-- =============================================
-- GUGU 공동구매 플랫폼 초기 스키마
-- =============================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES (유저 프로필)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  nickname    TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'influencer', 'admin')),
  phone       TEXT,
  kakao_id    TEXT UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PRODUCTS (상품)
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT '뷰티',
  brand           TEXT,
  thumbnail_url   TEXT,
  images          TEXT[] NOT NULL DEFAULT '{}',
  original_price  INTEGER NOT NULL CHECK (original_price > 0),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- GONGGUS (공동구매)
-- =============================================
CREATE TABLE IF NOT EXISTS gonggus (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  influencer_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  description           TEXT,
  discount_rate         INTEGER NOT NULL CHECK (discount_rate BETWEEN 1 AND 99),
  gonggu_price          INTEGER NOT NULL CHECK (gonggu_price > 0),
  original_price        INTEGER NOT NULL CHECK (original_price > 0),
  min_participants      INTEGER NOT NULL DEFAULT 10 CHECK (min_participants > 0),
  max_participants      INTEGER CHECK (max_participants IS NULL OR max_participants >= min_participants),
  current_participants  INTEGER NOT NULL DEFAULT 0 CHECK (current_participants >= 0),
  start_at              TIMESTAMPTZ NOT NULL,
  end_at                TIMESTAMPTZ NOT NULL,
  status                TEXT NOT NULL DEFAULT 'upcoming'
                          CHECK (status IN ('upcoming', 'active', 'closed', 'completed', 'cancelled')),
  shipping_fee          INTEGER NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  estimated_delivery    TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (end_at > start_at)
);

-- =============================================
-- ORDERS (주문)
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gonggu_id               UUID NOT NULL REFERENCES gonggus(id) ON DELETE RESTRICT,
  quantity                INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price              INTEGER NOT NULL CHECK (unit_price > 0),
  total_price             INTEGER NOT NULL CHECK (total_price > 0),
  status                  TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status          TEXT NOT NULL DEFAULT 'pending'
                            CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  payment_key             TEXT UNIQUE,
  order_number            TEXT NOT NULL UNIQUE,
  shipping_name           TEXT NOT NULL,
  shipping_phone          TEXT NOT NULL,
  shipping_address        TEXT NOT NULL,
  shipping_address_detail TEXT,
  shipping_zipcode        TEXT NOT NULL,
  memo                    TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- REVIEWS (리뷰)
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  gonggu_id    UUID REFERENCES gonggus(id) ON DELETE SET NULL,
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content      TEXT NOT NULL CHECK (char_length(content) >= 10),
  images       TEXT[] NOT NULL DEFAULT '{}',
  is_verified  BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, order_id)  -- 주문당 리뷰 1개
);

-- =============================================
-- 인덱스
-- =============================================
CREATE INDEX idx_gonggus_status ON gonggus(status);
CREATE INDEX idx_gonggus_end_at ON gonggus(end_at);
CREATE INDEX idx_gonggus_influencer_id ON gonggus(influencer_id);
CREATE INDEX idx_gonggus_product_id ON gonggus(product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_gonggu_id ON orders(gonggu_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_products_influencer_id ON products(influencer_id);

-- =============================================
-- UPDATED_AT 자동 업데이트 트리거
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER gonggus_updated_at BEFORE UPDATE ON gonggus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 신규 유저 프로필 자동 생성 트리거
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, nickname, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 주문 시 참여자 수 증가 함수
-- =============================================
CREATE OR REPLACE FUNCTION increment_gonggu_participants(p_gonggu_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE gonggus
  SET current_participants = current_participants + 1
  WHERE id = p_gonggu_id
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION '활성화된 공구를 찾을 수 없습니다.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 주문 번호 생성 함수
-- =============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  v_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_number := 'GG' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = v_number) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- RLS (Row Level Security) 활성화
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE gonggus ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- PROFILES RLS
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- PRODUCTS RLS
CREATE POLICY "products_select_active" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "products_insert_influencer" ON products FOR INSERT
  WITH CHECK (
    auth.uid() = influencer_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('influencer', 'admin'))
  );
CREATE POLICY "products_update_own" ON products FOR UPDATE
  USING (auth.uid() = influencer_id);

-- GONGGUS RLS
CREATE POLICY "gonggus_select_all" ON gonggus FOR SELECT USING (true);
CREATE POLICY "gonggus_insert_influencer" ON gonggus FOR INSERT
  WITH CHECK (
    auth.uid() = influencer_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('influencer', 'admin'))
  );
CREATE POLICY "gonggus_update_own" ON gonggus FOR UPDATE
  USING (auth.uid() = influencer_id);

-- ORDERS RLS
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_authenticated" ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_update_own" ON orders FOR UPDATE USING (auth.uid() = user_id);

-- REVIEWS RLS
CREATE POLICY "reviews_select_all" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE USING (auth.uid() = user_id);
