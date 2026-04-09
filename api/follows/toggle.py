"""POST /api/follows/toggle — 팔로우/언팔로우"""
from http.server import BaseHTTPRequestHandler
import json, uuid
from api._db import get_db, ok, err
from api._auth import get_user_with_profile


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self): self._cors()

    def do_POST(self):
        user, _ = get_user_with_profile(self.headers)
        if not user:
            return self._send(*err("로그인 필요", 401))

        body          = self._body()
        influencer_id = body.get("influencer_id")
        if not influencer_id:
            return self._send(*err("influencer_id 누락"))

        db = get_db()
        existing = db.table("follows").select("id").eq("consumer_id", user.id).eq("influencer_id", influencer_id).execute()

        if existing.data:
            db.table("follows").delete().eq("consumer_id", user.id).eq("influencer_id", influencer_id).execute()
            self._send(*ok({"following": False}))
        else:
            db.table("follows").insert({
                "id":             str(uuid.uuid4()),
                "consumer_id":    user.id,
                "influencer_id":  influencer_id,
            }).execute()
            self._send(*ok({"following": True}))

    def _body(self):
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n)) if n else {}

    def _cors(self):
        self.send_response(204)
        for k, v in {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type,Authorization","Access-Control-Allow-Methods":"POST,OPTIONS"}.items():
            self.send_header(k, v)
        self.end_headers()

    def _send(self, body, status=200, headers=None):
        self.send_response(status)
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body.encode() if isinstance(body, str) else body)

    def log_message(self, *_): pass
