"""
GET /api/orders/track?order_id=XXX
스마트택배(sweettracker) API로 실시간 배송 조회
송장번호 있는 주문만 가능
"""
from http.server import BaseHTTPRequestHandler
import json, os, requests
from api._db import get_db, ok, err
from api._auth import get_user_with_profile

# 택배사 코드표 (sweettracker 기준)
CARRIER_CODES = {
    "CJ대한통운": "04",
    "한진택배":   "05",
    "롯데택배":   "06",
    "우체국택배": "01",
    "로젠택배":   "08",
    "드림택배":   "09",
    "편의점택배": "22",
    "GTX로지스": "26",
    "경동택배":   "23",
    "합동택배":   "32",
}

# sweettracker 레벨 → 우리 status 매핑
LEVEL_STATUS = {
    1: "preparing",   # 상품인수
    2: "shipped",     # 이동중
    3: "shipped",     # 배송출발
    4: "delivered",   # 배달완료
}


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self): self._cors()

    def do_GET(self):
        user, _ = get_user_with_profile(self.headers)
        if not user:
            return self._send(*err("로그인 필요", 401))

        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        order_id = qs.get("order_id", [None])[0]
        if not order_id:
            return self._send(*err("order_id 필요"))

        db = get_db()
        order = db.table("orders").select(
            "id, status, tracking_number, shipping_carrier, consumer_id, gugu_id, gugus(influencer_id)"
        ).eq("id", order_id).single().execute().data

        if not order:
            return self._send(*err("주문 없음", 404))

        # 본인 주문 또는 본인 공구 인플루언서만
        is_consumer   = order["consumer_id"] == user.id
        is_influencer = (order.get("gugus") or {}).get("influencer_id") == user.id
        if not is_consumer and not is_influencer:
            return self._send(*err("권한 없음", 403))

        tracking = order.get("tracking_number", "")
        carrier  = order.get("shipping_carrier", "")

        if not tracking or not carrier:
            return self._send(*ok({
                "has_tracking": False,
                "status": order["status"],
                "message": "아직 송장번호가 입력되지 않았어요."
            }))

        carrier_code = CARRIER_CODES.get(carrier, "")
        if not carrier_code:
            # 코드 없으면 그냥 DB status 반환
            return self._send(*ok({
                "has_tracking": True,
                "status": order["status"],
                "carrier": carrier,
                "tracking_number": tracking,
                "details": [],
                "message": "배송사 코드를 찾을 수 없어요."
            }))

        api_key = os.environ.get("SWEETTRACKER_API_KEY", "")
        try:
            resp = requests.get(
                "https://info.sweettracker.co.kr/api/v1/trackingInfo",
                params={"t_key": api_key, "t_code": carrier_code, "t_invoice": tracking},
                timeout=8
            )
            data = resp.json()
        except Exception as e:
            return self._send(*ok({
                "has_tracking": True,
                "status": order["status"],
                "carrier": carrier,
                "tracking_number": tracking,
                "details": [],
                "message": f"배송 조회 오류: {str(e)}"
            }))

        if data.get("result") != "Y":
            return self._send(*ok({
                "has_tracking": True,
                "status": order["status"],
                "carrier": carrier,
                "tracking_number": tracking,
                "details": [],
                "message": data.get("msg", "배송 정보를 아직 찾을 수 없어요. 잠시 후 다시 확인해주세요.")
            }))

        # sweettracker 레벨로 상태 자동 업데이트
        level      = int(data.get("level", 0))
        new_status = LEVEL_STATUS.get(level, order["status"])

        if new_status != order["status"] and new_status in ("shipped", "delivered"):
            import datetime
            upd = {"status": new_status}
            if new_status == "shipped" and not order.get("shipped_at"):
                upd["shipped_at"] = datetime.datetime.utcnow().isoformat()
            if new_status == "delivered" and not order.get("delivered_at"):
                upd["delivered_at"] = datetime.datetime.utcnow().isoformat()
                # 배달완료 알림
                db.table("notifications").insert({
                    "user_id": order["consumer_id"],
                    "type":    "delivered",
                    "title":   "✅ 배달이 완료됐어요!",
                    "content": f"{carrier} {tracking} — 잘 받으셨나요?",
                    "link":    "/mypage.html",
                    "is_read": False,
                }).execute()
            db.table("orders").update(upd).eq("id", order_id).execute()

        details = data.get("trackingDetails", [])

        self._send(*ok({
            "has_tracking": True,
            "status": new_status,
            "carrier": data.get("Company", carrier),
            "tracking_number": tracking,
            "level": level,
            "last_detail": data.get("lastDetail", {}),
            "details": details[-10:],  # 최근 10개
            "message": None
        }))

    def _cors(self):
        self.send_response(204)
        for k, v in {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,OPTIONS"
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
