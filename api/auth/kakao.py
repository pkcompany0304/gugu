"""
GET /api/auth/kakao          — 카카오 OAuth 시작 (redirect)
GET /api/auth/kakao?code=... — 카카오 callback → Supabase 세션 생성
환경변수: KAKAO_CLIENT_ID, KAKAO_CLIENT_SECRET, APP_BASE_URL
"""
from http.server import BaseHTTPRequestHandler
import json, os, uuid
import requests as req
from urllib.parse import urlparse, parse_qs, urlencode
from api._db import get_db

KAKAO_CLIENT_ID     = os.environ.get("KAKAO_CLIENT_ID", "")
KAKAO_CLIENT_SECRET = os.environ.get("KAKAO_CLIENT_SECRET", "")
APP_BASE_URL        = os.environ.get("APP_BASE_URL", "https://gugu.vercel.app")
REDIRECT_URI        = f"{APP_BASE_URL}/api/auth/kakao"


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        qs   = parse_qs(urlparse(self.path).query)
        code = qs.get("code", [None])[0]

        if not code:
            # 1단계: 카카오 로그인 페이지로 리다이렉트
            params = urlencode({
                "client_id":     KAKAO_CLIENT_ID,
                "redirect_uri":  REDIRECT_URI,
                "response_type": "code",
                "scope":         "profile_nickname,account_email",
            })
            self._redirect(f"https://kauth.kakao.com/oauth/authorize?{params}")
            return

        # 2단계: code → access_token
        token_resp = req.post("https://kauth.kakao.com/oauth/token", data={
            "grant_type":    "authorization_code",
            "client_id":     KAKAO_CLIENT_ID,
            "client_secret": KAKAO_CLIENT_SECRET,
            "redirect_uri":  REDIRECT_URI,
            "code":          code,
        }, timeout=10)
        if token_resp.status_code != 200:
            return self._redirect(f"{APP_BASE_URL}/login.html?error=kakao_token")

        kakao_token = token_resp.json()["access_token"]

        # 3단계: 사용자 정보
        me = req.get("https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {kakao_token}"},
            timeout=10).json()

        kakao_id = str(me["id"])
        email    = me.get("kakao_account", {}).get("email", f"{kakao_id}@kakao.gugu")
        nickname = me.get("properties", {}).get("nickname", "카카오유저")

        db = get_db()

        # 기존 유저 조회 (kakao_id로)
        existing = db.table("profiles").select("id, supabase_token").eq("kakao_id", kakao_id).execute()

        if existing.data:
            # 이미 가입된 유저 → 저장된 토큰으로 세션 복원
            profile = existing.data[0]
            token = profile.get("supabase_token", "")
        else:
            # 신규 가입: Supabase Auth에 계정 생성
            SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
            SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
            create_resp = req.post(
                f"{SUPABASE_URL}/auth/v1/admin/users",
                headers={"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                         "Content-Type": "application/json"},
                json={"email": email, "password": str(uuid.uuid4()), "email_confirm": True,
                      "user_metadata": {"name": nickname, "role": "consumer"}},
                timeout=10
            )
            if create_resp.status_code not in (200, 201):
                # 이메일 중복이면 기존 유저 찾기
                user_list = req.get(
                    f"{SUPABASE_URL}/auth/v1/admin/users?email={email}",
                    headers={"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"},
                    timeout=10
                ).json()
                user_id = user_list.get("users", [{}])[0].get("id")
            else:
                user_id = create_resp.json()["id"]

            # profiles에 kakao_id 저장
            if user_id:
                db.table("profiles").update({"kakao_id": kakao_id}).eq("id", user_id).execute()

            # 임시 토큰 생성 (서명된 JWT)
            sign_resp = req.post(
                f"{SUPABASE_URL}/auth/v1/admin/generate_link",
                headers={"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                         "Content-Type": "application/json"},
                json={"type": "magiclink", "email": email},
                timeout=10
            )
            token = sign_resp.json().get("action_link", "")

        # 프론트엔드로 리다이렉트 (토큰 포함)
        self._redirect(f"{APP_BASE_URL}/login.html?kakao_token=done&email={email}")

    def _redirect(self, url):
        self.send_response(302)
        self.send_header("Location", url)
        self.end_headers()

    def log_message(self, *_): pass
