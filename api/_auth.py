"""Authorization header → Supabase user 검증"""
import os, json
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://yattlqdsnrqeqzvcuvuu.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdHRscWRzbnJxZXF6dmN1dnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0Mzc4NDMsImV4cCI6MjA5MTAxMzg0M30.OXYzBYsMHg3ryW7DDr5xljXrgCkL92EIQS2LunAabag")

def get_user(headers: dict):
    """Bearer 토큰으로 Supabase 사용자 반환. 실패 시 None."""
    auth = headers.get("authorization") or headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[7:]
    try:
        cl = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        cl.auth.set_session(token, "")
        resp = cl.auth.get_user(token)
        return resp.user
    except Exception:
        return None

def get_user_with_profile(headers: dict):
    """사용자 + profiles 테이블 데이터 반환."""
    from api._db import get_db
    user = get_user(headers)
    if not user:
        return None, None
    db = get_db()
    profile = db.table("profiles").select("*").eq("id", user.id).single().execute()
    return user, profile.data

def require_admin(headers: dict):
    """admin 역할 확인. 아니면 None."""
    user, profile = get_user_with_profile(headers)
    if profile and profile.get("role") == "admin":
        return user, profile
    return None, None
