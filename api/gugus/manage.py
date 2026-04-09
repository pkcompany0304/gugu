"""
POST /api/gugus/manage  — 공구 등록 (인플루언서)
PUT  /api/gugus/manage  — 공구 수정
DELETE /api/gugus/manage — 공구 삭제 (미판매 시)
"""
from http.server import BaseHTTPRequestHandler
import json, uuid, datetime
from urllib.parse import urlparse, parse_qs
from api._db import get_db, ok, err
from api._auth import get_user_with_profile


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self): self._cors()

    def do_POST(self):
        user, profile = get_user_with_profile(self.headers)
        if not user:
            return self._send(*err("로그인 필요", 401))
        if not profile or profile.get("role") != "influencer":
            return self._send(*err("인플루언서만 등록 가능합니다", 403))

        body = self._body()
        required = ["title", "original_price", "sale_price", "target_participants", "end_date", "category"]
        for f in required:
            if not body.get(f):
                return self._send(*err(f"{f} 필드 누락"))

        original = int(body["original_price"])
        sale     = int(body["sale_price"])
        if sale >= original:
            return self._send(*err("공구가는 원가보다 낮아야 합니다"))

        db = get_db()
        gugu = db.table("gugus").insert({
            "id":                  str(uuid.uuid4()),
            "influencer_id":       user.id,
            "title":               body["title"],
            "description":         body.get("description", ""),
            "category":            body["category"],
            "emoji":               body.get("emoji", "🛍️"),
            "original_price":      original,
            "sale_price":          sale,
            "target_participants": int(body["target_participants"]),
            "min_participants":    int(body.get("min_participants", 0)),
            "current_participants": 0,
            "status":              "active",
            "start_date":          datetime.datetime.utcnow().isoformat(),
            "end_date":            body["end_date"],
        }).execute()

        self._send(*ok(gugu.data[0] if gugu.data else {}))

    def do_PUT(self):
        user, profile = get_user_with_profile(self.headers)
        if not user or not profile or profile.get("role") != "influencer":
            return self._send(*err("인플루언서 권한 필요", 403))

        body    = self._body()
        gugu_id = body.get("id")
        if not gugu_id:
            return self._send(*err("id 누락"))

        db = get_db()
        # 본인 공구인지 확인
        existing = db.table("gugus").select("influencer_id, current_participants").eq("id", gugu_id).single().execute()
        if not existing.data or existing.data["influencer_id"] != user.id:
            return self._send(*err("수정 권한이 없습니다", 403))
        if existing.data["current_participants"] > 0:
            # 주문이 있으면 가격 수정 불가
            body.pop("original_price", None)
            body.pop("sale_price", None)

        allowed = {"title","description","category","emoji","target_participants","end_date","status"}
        updates = {k: v for k, v in body.items() if k in allowed}
        if not updates:
            return self._send(*err("수정할 필드 없음"))

        result = db.table("gugus").update(updates).eq("id", gugu_id).execute()
        self._send(*ok(result.data[0] if result.data else {}))

    def do_DELETE(self):
        user, profile = get_user_with_profile(self.headers)
        if not user or not profile or profile.get("role") != "influencer":
            return self._send(*err("인플루언서 권한 필요", 403))

        qs = parse_qs(urlparse(self.path).query)
        gugu_id = qs.get("id", [None])[0]
        if not gugu_id:
            return self._send(*err("id 누락"))

        db = get_db()
        existing = db.table("gugus").select("influencer_id, current_participants").eq("id", gugu_id).single().execute()
        if not existing.data or existing.data["influencer_id"] != user.id:
            return self._send(*err("삭제 권한 없음", 403))
        if existing.data["current_participants"] > 0:
            return self._send(*err("참여자가 있는 공구는 삭제할 수 없어요. 종료 처리 후 삭제하세요."))

        db.table("gugus").delete().eq("id", gugu_id).execute()
        self._send(*ok({"deleted": True}))

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
