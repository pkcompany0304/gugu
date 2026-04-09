"""POST /api/influencers/apply — 인플루언서 신청"""
from http.server import BaseHTTPRequestHandler
import json, uuid
from api._db import get_db, ok, err
from api._auth import get_user_with_profile


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self): self._cors()

    def do_POST(self):
        body = self._body()
        user, profile = get_user_with_profile(self.headers)
        if not user:
            return self._send(*err("로그인 필요", 401))
        if profile and profile.get("role") == "influencer":
            return self._send(*err("이미 인플루언서입니다"))

        db = get_db()

        # 중복 신청 체크
        existing = db.table("influencer_applications") \
            .select("id, status") \
            .eq("user_id", user.id) \
            .in_("status", ["pending", "approved"]) \
            .execute()
        if existing.data:
            s = existing.data[0]["status"]
            return self._send(*err(f"이미 {'검토 중인' if s=='pending' else '승인된'} 신청이 있습니다"))

        # 신청 저장
        db.table("influencer_applications").insert({
            "id":             str(uuid.uuid4()),
            "user_id":        user.id,
            "channel_name":   body.get("channel_name", ""),
            "channel_url":    body.get("channel_url", ""),
            "channel_type":   body.get("channel_type", ""),   # instagram/youtube/tiktok
            "follower_count": int(body.get("follower_count", 0)),
            "category":       body.get("category", ""),
            "introduction":   body.get("introduction", ""),
            "portfolio_url":  body.get("portfolio_url", ""),
            "status":         "pending",
        }).execute()

        # 운영자에게 알림 (admin role 가진 모든 유저)
        admins = db.table("profiles").select("id").eq("role", "admin").execute().data or []
        for adm in admins:
            db.table("notifications").insert({
                "user_id": adm["id"],
                "type":    "new_application",
                "title":   "새 인플루언서 신청 📬",
                "content": f"{profile.get('name','신청자')}님이 인플루언서를 신청했어요",
                "link":    "/admin.html#influencers",
                "is_read": False,
            }).execute()

        self._send(*ok({"applied": True}))

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
