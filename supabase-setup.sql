-- ═══════════════════════════════════════════════════════
-- GUGU. 전체 스키마 v2 — Supabase SQL Editor에서 실행
-- ═══════════════════════════════════════════════════════

-- 기존 테이블 초기화
DROP TABLE IF EXISTS notifications         CASCADE;
DROP TABLE IF EXISTS follows               CASCADE;
DROP TABLE IF EXISTS payments              CASCADE;
DROP TABLE IF EXISTS orders                CASCADE;
DROP TABLE IF EXISTS settlements           CASCADE;
DROP TABLE IF EXISTS gugus                 CASCADE;
DROP TABLE IF EXISTS influencer_applications CASCADE;
DROP TABLE IF EXISTS profiles              CASCADE;

DROP FUNCTION IF EXISTS handle_new_user()         CASCADE;
DROP FUNCTION IF EXISTS increment_participants(uuid) CASCADE;
DROP FUNCTION IF EXISTS decrement_participants(uuid) CASCADE;


-- ── 1. profiles ──────────────────────────────────────────
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT '',
  email        TEXT,
  role         TEXT NOT NULL DEFAULT 'consumer'
               CHECK (role IN ('consumer','influencer','admin')),
  channel_name TEXT,
  channel_url  TEXT,
  phone        TEXT,
  kakao_id     TEXT UNIQUE,
  naver_id     TEXT UNIQUE,
  avatar_url   TEXT,
  bio          TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);


-- ── 2. influencer_applications ───────────────────────────
CREATE TABLE influencer_applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel_name     TEXT NOT NULL,
  channel_url      TEXT NOT NULL,
  channel_type     TEXT DEFAULT 'instagram',
  follower_count   INT  DEFAULT 0,
  category         TEXT NOT NULL,
  introduction     TEXT,
  portfolio_url    TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected')),
  rejection_reason TEXT,
  reviewed_at      TIMESTAMPTZ,
  reviewed_by      UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE influencer_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_self_read"  ON influencer_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "app_self_ins"   ON influencer_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "app_admin_all"  ON influencer_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin'));


-- ── 3. gugus ─────────────────────────────────────────────
CREATE TABLE gugus (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  description          TEXT DEFAULT '',
  category             TEXT NOT NULL,
  emoji                TEXT DEFAULT '🛍️',
  original_price       INT  NOT NULL CHECK (original_price > 0),
  sale_price           INT  NOT NULL CHECK (sale_price > 0),
  target_participants  INT  NOT NULL DEFAULT 100,
  min_participants     INT  DEFAULT 0,
  current_participants INT  NOT NULL DEFAULT 0,
  status               TEXT NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active','closed','cancelled')),
  start_date           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date             TIMESTAMPTZ NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE gugus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gugus_read"   ON gugus FOR SELECT USING (true);
CREATE POLICY "gugus_insert" ON gugus FOR INSERT WITH CHECK (auth.uid() = influencer_id);
CREATE POLICY "gugus_update" ON gugus FOR UPDATE USING (auth.uid() = influencer_id);
CREATE POLICY "gugus_delete" ON gugus FOR DELETE USING (auth.uid() = influencer_id);
CREATE INDEX idx_gugus_status   ON gugus (status);
CREATE INDEX idx_gugus_category ON gugus (category);
CREATE INDEX idx_gugus_end      ON gugus (end_date);


-- ── 4. orders ────────────────────────────────────────────
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toss_order_id    TEXT UNIQUE,
  gugu_id          UUID NOT NULL REFERENCES gugus(id),
  consumer_id      UUID NOT NULL REFERENCES profiles(id),
  quantity         INT  NOT NULL DEFAULT 1,
  unit_price       INT  NOT NULL,
  total_amount     INT  NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN (
                     'pending','paid','preparing','shipped',
                     'delivered','cancelled','refunded','partially_refunded'
                   )),
  shipping_name    TEXT DEFAULT '',
  shipping_phone   TEXT DEFAULT '',
  shipping_address TEXT DEFAULT '',
  shipping_zipcode TEXT DEFAULT '',
  shipping_carrier TEXT,
  tracking_number  TEXT,
  payment_key      TEXT,
  payment_method   TEXT,
  paid_at          TIMESTAMPTZ,
  shipped_at       TIMESTAMPTZ,
  delivered_at     TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ,
  cancel_reason    TEXT,
  admin_note       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_consumer" ON orders FOR SELECT  USING (auth.uid() = consumer_id);
CREATE POLICY "orders_insert"   ON orders FOR INSERT  WITH CHECK (auth.uid() = consumer_id);
CREATE POLICY "orders_influencer" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM gugus WHERE id=gugu_id AND influencer_id=auth.uid())
);
CREATE POLICY "orders_admin"    ON orders FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin'));
CREATE INDEX idx_orders_consumer ON orders (consumer_id);
CREATE INDEX idx_orders_gugu     ON orders (gugu_id);
CREATE INDEX idx_orders_status   ON orders (status);


-- ── 5. payments ──────────────────────────────────────────
CREATE TABLE payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES orders(id),
  payment_key    TEXT,
  toss_order_id  TEXT,
  payment_method TEXT,
  amount         INT  NOT NULL,
  status         TEXT NOT NULL DEFAULT 'done',
  raw_response   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_admin" ON payments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin'));


-- ── 6. follows ───────────────────────────────────────────
CREATE TABLE follows (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (consumer_id, influencer_id)
);
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_read"   ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON follows FOR INSERT WITH CHECK (auth.uid() = consumer_id);
CREATE POLICY "follows_delete" ON follows FOR DELETE USING (auth.uid() = consumer_id);


-- ── 7. notifications ─────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT,
  link       TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_read"    ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_update"  ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notif_service" ON notifications FOR INSERT WITH CHECK (true);
CREATE INDEX idx_notif_user ON notifications (user_id, is_read, created_at DESC);


-- ── 8. settlements ───────────────────────────────────────
CREATE TABLE settlements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id     UUID NOT NULL REFERENCES profiles(id),
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  gross_amount      INT  NOT NULL,
  commission_rate   NUMERIC(5,2) NOT NULL DEFAULT 10.0,
  commission_amount INT  NOT NULL,
  payout_amount     INT  NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed')),
  bank_name         TEXT,
  account_number    TEXT,
  account_holder    TEXT,
  admin_note        TEXT,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settle_self"  ON settlements FOR SELECT USING (auth.uid() = influencer_id);
CREATE POLICY "settle_admin" ON settlements FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin'));


-- ── Functions ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1),'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role','consumer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION increment_participants(p_gugu_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE gugus SET current_participants = current_participants + 1 WHERE id = p_gugu_id;
$$;

CREATE OR REPLACE FUNCTION decrement_participants(p_gugu_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE gugus SET current_participants = GREATEST(0, current_participants - 1) WHERE id = p_gugu_id;
$$;

-- 내 계정을 admin으로 설정하려면 아래 실행 (이메일 교체):
-- UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
