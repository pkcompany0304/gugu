-- =============================================
-- GUGU. Supabase Migration v2
-- 실행: Supabase SQL Editor에서 실행
-- =============================================

-- 1. gugus 테이블에 공구 타입 추가
ALTER TABLE gugus
  ADD COLUMN IF NOT EXISTS gugu_type TEXT DEFAULT 'period'
    CHECK (gugu_type IN ('period', 'quantity', 'funding'));

-- 2. orders 테이블에 결제 수단 + 무통장 필드 추가
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card'
    CHECK (payment_method IN ('card', 'bank_transfer')),
  ADD COLUMN IF NOT EXISTS bank_depositor TEXT,
  ADD COLUMN IF NOT EXISTS bank_confirmed_at TIMESTAMPTZ;

-- 3. 기존 데이터 기본값 적용
UPDATE gugus SET gugu_type = 'period' WHERE gugu_type IS NULL;
UPDATE orders SET payment_method = 'card' WHERE payment_method IS NULL;

-- 4. gugus 인덱스 (타입별 조회용)
CREATE INDEX IF NOT EXISTS idx_gugus_type ON gugus(gugu_type);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

-- 5. 수량형 공구 자동 마감 함수
-- current_participants >= target_participants 이면 status = 'closed'
CREATE OR REPLACE FUNCTION check_quantity_gugu()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.gugu_type = 'quantity' AND NEW.current_participants >= NEW.target_participants THEN
    NEW.status = 'closed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_quantity_gugu ON gugus;
CREATE TRIGGER tr_check_quantity_gugu
  BEFORE UPDATE ON gugus
  FOR EACH ROW EXECUTE FUNCTION check_quantity_gugu();

-- 6. 펀딩형 공구 만료 체크 함수 (배치로 실행하거나 수동 실행)
-- 기간이 지났고 목표 미달이면 status = 'failed' 처리
CREATE OR REPLACE FUNCTION fail_expired_funding_gugus()
RETURNS void AS $$
BEGIN
  UPDATE gugus
  SET status = 'failed'
  WHERE gugu_type = 'funding'
    AND status = 'active'
    AND end_date < CURRENT_DATE
    AND current_participants < target_participants;
END;
$$ LANGUAGE plpgsql;

-- 7. notifications 타입에 delivered, bank_confirmed 추가 (이미 text라 별도 조치 불필요)

-- 8. RLS 정책 — payment_method 필드 읽기 허용 (기존 정책에 포함됨)
-- orders 테이블 기존 RLS가 있으면 별도 추가 불필요

SELECT 'Migration v2 완료' AS result;
