"""
GET  /api/notifications/list  — 내 알림 목록
POST /api/notifications/list  — 읽음 처리 { id } or { all: true }
"""
from http.server import BaseHTTPRequestHandler
import json, datetime
from api._db import get_db, ok, err
from api._auth import get_user_with_profile


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self): self._cors()

    def do_GET(self):
        user, _ = get_user_with_profile(self.headers)
        if not user:
            return self._send(*err("로그인 필요", 401))

        db = get_db()
        notifs = db.table("notifications") \
            .select("*") \
            .eq("user_id", user.id) \
            .order("created_at", desc=True) \
            .limit(50) \
            .execute()

        self._send(*ok(notifs.data or []))

    def do_POST(self):
        user, _ = get_user_with_profile(self.headers)
        if not user:
            return self._send(*err("로그인 필요", 401))

        body = self._body()
        db   = get_db()

        if body.get("all"):
            db.table("notifications").update({"is_read": True}).eq("user_id", user.id).execute()
        elif body.get("id"):
            db.table("notifications").update({"is_read": True}) \
                .eq("id", body["id"]).eq("user_id", user.id).execute()

        self._send(*ok({"ok": True}))

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
