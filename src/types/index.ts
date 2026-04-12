// DB 실제 스키마 기반 타입 (gugus 테이블 기준)
export type UserRole = 'consumer' | 'influencer' | 'admin'
export type GugugStatus = 'upcoming' | 'active' | 'closed' | 'completed' | 'cancelled'
export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'

/** GongguStatus alias for backward compat */
export type GongguStatus = GugugStatus

export interface Profile {
  id: string
  email: string | null
  nickname: string | null      // ADD COLUMN: GUGU 표시명
  name: string | null          // 기존 컬럼
  avatar_url: string | null
  role: UserRole               // 'consumer' | 'influencer' | 'admin'
  phone: string | null
  kakao_id: string | null
  channel_name: string | null
  created_at: string
  updated_at: string | null
}

export interface Product {
  id: string
  influencer_id: string
  name: string
  description: string
  category: string
  brand: string | null
  thumbnail_url: string | null
  images: string[]
  original_price: number
  is_active: boolean
  created_at: string
  updated_at: string
  influencer?: Profile
}

/** DB 테이블명: gugus */
export interface Gugu {
  id: string
  influencer_id: string
  product_name: string         // 기존 컬럼
  title: string                // ADD COLUMN
  description: string | null
  original_price: number
  sale_price: number           // 기존 컬럼
  gonggu_price: number         // ADD COLUMN (= sale_price)
  discount_rate: number        // ADD COLUMN
  target_participants: number | null  // 기존 컬럼
  min_participants: number     // ADD COLUMN
  max_participants: number | null     // ADD COLUMN
  current_participants: number
  start_date: string | null    // 기존 컬럼 (date)
  end_date: string | null      // 기존 컬럼 (date)
  start_at: string | null      // ADD COLUMN (timestamptz)
  end_at: string | null        // ADD COLUMN (timestamptz)
  status: GugugStatus
  shipping_cost: number        // 기존 컬럼
  shipping_fee: number         // ADD COLUMN
  image_url: string | null     // 기존 컬럼
  thumbnail_url: string | null // ADD COLUMN
  images: string[]             // ADD COLUMN
  estimated_delivery: string | null
  emoji: string | null
  min_per_person: number | null    // 기존 컬럼
  max_per_person: number | null    // 기존 컬럼
  created_at: string
  updated_at: string | null
  influencer?: Profile
}

/** GongguStatus 호환 alias */
export type Gonggu = Gugu

export interface Order {
  id: string
  consumer_id: string          // 기존 컬럼 (= user_id)
  gugu_id: string
  quantity: number
  unit_price: number
  total_amount: number         // 기존 컬럼
  total_price: number          // ADD COLUMN
  status: OrderStatus
  payment_status: PaymentStatus // ADD COLUMN
  payment_key: string | null
  order_number: string | null  // ADD COLUMN
  shipping_name: string | null
  shipping_phone: string | null
  shipping_address: string | null
  shipping_detail: string | null  // 기존 컬럼
  shipping_zip: string | null     // 기존 컬럼
  shipping_zipcode: string | null // ADD COLUMN
  created_at: string
  updated_at: string | null
  gugu?: Gugu
  consumer?: Profile
}

export interface Review {
  id: string
  user_id: string
  gugu_id: string | null
  order_id: string
  rating: number
  content: string
  images: string[]
  is_verified: boolean
  created_at: string
  updated_at: string
  user?: Profile
  gugu?: Gugu
}
