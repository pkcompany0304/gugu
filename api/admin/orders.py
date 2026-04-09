"""
GET  /api/admin/orders  — 전체 주문 목록 (admin)
PUT  /api/admin/orders  — 주문 상태 변경 / 송장번호 입력
"""
from http.server import BaseHTTPRequestHandler
import json, datetime
from api._db import get_db, ok, err
from api._auth import require_admin


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self): self._cors()

    def do_GET(self):
        admin, _ = require_admin(self.headers)
        if not admin:
            return self._send(*err("관리자 권한 필요", 403))

        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        status = qs.get("status", [None])[0]
        page   = int(qs.get("page", [1])[0])
        limit  = 50
        offset = (page - 1) * limit

        db = get_db()
        q = db.table("orders").select(
            "*, gugus(title, emoji, category, influencer_id, profiles(channel_name,name)), "
            "profiles!orders_consumer_id_fkey(name, email)"
        ).order("created_at", desc=True).range(offset, offset + limit - 1)

        if status:
            q = q.eq("status", status)

        result = q.execute()
        self._send(*ok(result.data or []))

    def do_PUT(self):
        admin, _ = require_admin(self.headers)
        if not admin:
            return self._send(*err("관리자 권한 필요", 403))

        body     = self._body()
        order_id = body.get("order_id")
        updates  = {}

        if "status" in body:
            updates["status"] = body["status"]
        if "tracking_number" in body:
            updates["tracking_number"] = body["tracking_number"]
        if "shipping_carrier" in body:
            updates["shipping_carrier"] = body["shipping_carrier"]
        if "admin_note" in body:
            updates["admin_note"] = body["admin_note"]

        # 배송 시작 시 shipped_at 자동 기록
        if updates.get("status") == "shipped":
            updates["shipped_at"] = datetime.datetime.utcnow().isoformat()

        if updates.get("status") == "delivered":
            updates["delivered_at"] = datetime.datetime.utcnow().isoformat()

        if not order_id or not updates:
            return self._send(*err("order_id와 업데이트 필드 필요"))

        db = get_db()
        result = db.table("orders").update(updates).eq("id", order_id).execute()

        # 배송 시작 시 소비자 알림
        if updates.get("status") == "shipped":
            o = db.table("orders").select("consumer_id, tracking_number, shipping_carrier, gugus(title)") \
                .eq("id", order_id).single().execute().data
            if o:
                title = o["gugus"]["title"][:30] if o.get("gugus") else "상품"
                tracking = updates.get("tracking_number","")
                carrier  = updates.get("shipping_carrier","")
                db.table("notifications").insert({
                    "user_id": o["consumer_id"],
                    "type":    "shipped",
                    "title":   "📦 상품이 출발했어요!",
                    "content": f"[{title}] {carrier} {tracking}",
                    "link":    "/mypage.html",
                    "is_read": False,
                }).execute()

        self._send(*ok(result.data[0] if result.data else {}))

    def _body(self):
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n)) if n else {}

    def _cors(self):
        self.send_response(204)
        for k, v in {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type,Authorization","Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS"}.items():
            self.send_header(k, v)
        self.end_headers()

    def _send(self, body, status=200, headers=None):
        self.send_response(status)
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body.encode() if isinstance(body, str) else body)

    def log_message(self, *_): pass
