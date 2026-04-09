"""
POST /api/payments/checkout
소비자가 구매 버튼 누를 때: orderId 생성 + 주문 초안 저장
Body: { gugu_id, quantity, shipping: { name, phone, address, zipcode } }
"""
from http.server import BaseHTTPRequestHandler
import json, os, uuid, datetime
from api._db import get_db, ok, err
from api._auth import get_user_with_profile


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self._cors()

    def do_POST(self):
        body = self._body()
        user, profile = get_user_with_profile(self.headers)
        if not user:
            return self._send(*err("로그인이 필요합니다", 401))

        gugu_id  = body.get("gugu_id")
        quantity = int(body.get("quantity", 1))
        shipping = body.get("shipping", {})

        db = get_db()

        # 공구 정보 조회
        g = db.table("gugus").select("*").eq("id", gugu_id).eq("status", "active").single().execute()
        if not g.data:
            return self._send(*err("공구를 찾을 수 없습니다"))

        gugu = g.data
        unit_price   = int(gugu["sale_price"])
        total_amount = unit_price * quantity

        # orderId: Toss 요구사항 — 영문+숫자 6~64자
        order_id = f"GUGU-{uuid.uuid4().hex[:16].upper()}"

        # 주문 초안 저장 (status=pending)
        order = db.table("orders").insert({
            "id": str(uuid.uuid4()),
            "toss_order_id": order_id,
            "gugu_id": gugu_id,
            "consumer_id": user.id,
            "quantity": quantity,
            "unit_price": unit_price,
            "total_amount": total_amount,
            "status": "pending",
            "shipping_name":    shipping.get("name", ""),
            "shipping_phone":   shipping.get("phone", ""),
            "shipping_address": shipping.get("address", ""),
            "shipping_zipcode": shipping.get("zipcode", ""),
        }).execute()

        toss_client_key = os.environ.get("TOSS_CLIENT_KEY", "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq")

        self._send(*ok({
            "order_id":       order_id,
            "order_db_id":    order.data[0]["id"],
            "amount":         total_amount,
            "order_name":     gugu["title"][:100],
            "customer_name":  profile.get("name", ""),
            "customer_email": user.email or "",
            "toss_client_key": toss_client_key,
        }))

    # ── helpers ──────────────────────────────────────────
    def _body(self):
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n)) if n else {}

    def _cors(self):
        self.send_response(204)
        for k, v in {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        }.items():
            self.send_header(k, v)
        self.end_headers()

    def _send(self, body, status=200, headers=None):
        self.send_response(status)
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body.encode() if isinstance(body, str) else body)

    def log_message(self, *_): pass
