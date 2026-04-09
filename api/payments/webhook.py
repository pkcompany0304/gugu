"""
POST /api/payments/webhook
Toss → 서버 웹훅 (결제 상태 변경 이벤트)
Toss 대시보드에서 웹훅 URL로 등록: https://yourdomain.vercel.app/api/payments/webhook
"""
from http.server import BaseHTTPRequestHandler
import json, hmac, hashlib, os
from api._db import get_db

TOSS_WEBHOOK_SECRET = os.environ.get("TOSS_WEBHOOK_SECRET", "")


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        body_bytes = self._raw_body()
        body = json.loads(body_bytes) if body_bytes else {}

        # 웹훅 서명 검증 (선택사항 — secret 설정 시)
        if TOSS_WEBHOOK_SECRET:
            sig = self.headers.get("Toss-Signature", "")
            expected = hmac.new(TOSS_WEBHOOK_SECRET.encode(), body_bytes, hashlib.sha256).hexdigest()
            if not hmac.compare_digest(sig, expected):
                return self._respond(400, {"error": "invalid signature"})

        event_type = body.get("eventType", "")
        data       = body.get("data", {})
        order_id   = data.get("orderId", "")    # toss_order_id

        db = get_db()

        if event_type == "PAYMENT_STATUS_CHANGED":
            status = data.get("status", "")
            toss_to_db = {
                "DONE":      "paid",
                "CANCELED":  "cancelled",
                "ABORTED":   "cancelled",
                "PARTIAL_CANCELED": "partially_refunded",
            }
            db_status = toss_to_db.get(status)
            if db_status and order_id:
                db.table("orders").update({"status": db_status}).eq("toss_order_id", order_id).execute()
                db.table("payments").update({"status": status.lower()}).eq("toss_order_id", order_id).execute()

        self._respond(200, {"ok": True})

    def _raw_body(self):
        n = int(self.headers.get("Content-Length", 0))
        return self.rfile.read(n) if n else b""

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def log_message(self, *_): pass
