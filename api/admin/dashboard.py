"""GET /api/admin/dashboard — 어드민 대시보드 통계"""
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

        db = get_db()
        today = datetime.date.today().isoformat()
        month_start = datetime.date.today().replace(day=1).isoformat()

        # 주문 통계
        all_orders   = db.table("orders").select("status, total_amount, created_at").execute().data or []
        paid_orders  = [o for o in all_orders if o["status"] not in ("pending","cancelled","refunded")]
        today_orders = [o for o in paid_orders if o["created_at"][:10] == today]
        month_orders = [o for o in paid_orders if o["created_at"][:10] >= month_start]

        # 대기 중 승인
        pending_apps = db.table("influencer_applications").select("id", count="exact").eq("status","pending").execute()
        pending_ship = db.table("orders").select("id", count="exact").eq("status","paid").execute()

        stats = {
            "total_revenue":    sum(int(o["total_amount"]) for o in paid_orders),
            "today_revenue":    sum(int(o["total_amount"]) for o in today_orders),
            "month_revenue":    sum(int(o["total_amount"]) for o in month_orders),
            "total_orders":     len(paid_orders),
            "today_orders":     len(today_orders),
            "pending_orders":   len([o for o in all_orders if o["status"] == "pending"]),
            "pending_shipment": pending_ship.count or 0,
            "pending_applications": pending_apps.count or 0,
        }

        self._send(*ok(stats))

    def _cors(self):
        self.send_response(204)
        for k, v in {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type,Authorization","Access-Control-Allow-Methods":"GET,OPTIONS"}.items():
            self.send_header(k, v)
        self.end_headers()

    def _send(self, body, status=200, headers=None):
        self.send_response(status)
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body.encode() if isinstance(body, str) else body)

    def log_message(self, *_): pass
