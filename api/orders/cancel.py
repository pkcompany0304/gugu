"""POST /api/orders/cancel — 주문 취소 (마감 24h 전까지)"""
from http.server import BaseHTTPRequestHandler
import json, os, base64, datetime
import requests as req
from api._db import get_db, ok, err
from api._auth import get_user_with_profile

TOSS_SECRET_KEY = os.environ.get("TOSS_SECRET_KEY", "test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R")


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self): self._cors()

    def do_POST(self):
        body = self._body()
        user, _ = get_user_with_profile(self.headers)
        if not user:
            return self._send(*err("로그인 필요", 401))

        order_id = body.get("order_id")
        reason   = body.get("reason", "단순 변심")
        db = get_db()

        o = db.table("orders").select("*").eq("id", order_id).eq("consumer_id", user.id).single().execute()
        if not o.data:
            return self._send(*err("주문을 찾을 수 없습니다"))

        order = o.data
        if order["status"] not in ("pending", "paid", "preparing"):
            return self._send(*err("취소할 수 없는 주문 상태입니다"))

        # 공구 마감 24h 전 체크
        gugu = db.table("gugus").select("end_date").eq("id", order["gugu_id"]).single().execute().data
        if gugu and gugu.get("end_date"):
            end = datetime.datetime.fromisoformat(gugu["end_date"].replace("Z",""))
            if datetime.datetime.utcnow() > end - datetime.timedelta(hours=24):
                return self._send(*err("마감 24시간 이내에는 취소할 수 없습니다"))

        # Toss 환불 (결제 완료된 경우)
        if order.get("payment_key"):
            auth_bytes = base64.b64encode(f"{TOSS_SECRET_KEY}:".encode()).decode()
            toss_resp = req.post(
                f"https://api.tosspayments.com/v1/payments/{order['payment_key']}/cancel",
                headers={"Authorization": f"Basic {auth_bytes}", "Content-Type": "application/json"},
                json={"cancelReason": reason},
                timeout=10,
            )
            if toss_resp.status_code != 200:
                return self._send(*err(f"환불 실패: {toss_resp.json().get('message','')}"))

        # 주문 취소 처리
        db.table("orders").update({
            "status": "cancelled",
            "cancel_reason": reason,
            "cancelled_at": datetime.datetime.utcnow().isoformat(),
        }).eq("id", order_id).execute()

        # 참여자 수 감소
        db.rpc("decrement_participants", {"p_gugu_id": order["gugu_id"]}).execute()

        self._send(*ok({"cancelled": True}))

    def _body(self):
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n)) if n else {}

    def _cors(self):
        self.send_response(204)
        for k, v in {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type,Authorization","Access-Control-Allow-Methods":"GET,POST,OPTIONS"}.items():
            self.send_header(k, v)
        self.end_headers()

    def _send(self, body, status=200, headers=None):
        self.send_response(status)
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body.encode() if isinstance(body, str) else body)

    def log_message(self, *_): pass
