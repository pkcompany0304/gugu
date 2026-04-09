"""GET /api/orders/list — 내 주문 목록"""
from http.server import BaseHTTPRequestHandler
import json
from api._db import get_db, ok, err
from api._auth import get_user_with_profile


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        user, _ = get_user_with_profile(self.headers)
        if not user:
            return self._send(*err("로그인 필요", 401))

        db = get_db()
        orders = db.table("orders") \
            .select("*, gugus(title, emoji, category, end_date, influencer_id, profiles(channel_name, name))") \
            .eq("consumer_id", user.id) \
            .order("created_at", desc=True) \
            .execute()

        self._send(*ok(orders.data or []))

    def do_OPTIONS(self): self._cors()

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
