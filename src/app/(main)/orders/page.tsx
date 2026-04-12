import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatPrice, formatDate } from '@/lib/utils/format'
import Link from 'next/link'
import { Package, ChevronRight } from 'lucide-react'

const STATUS_TABS = [
  { value: 'all',       label: '전체' },
  { value: 'paid',      label: '결제완료' },
  { value: 'preparing', label: '준비중' },
  { value: 'shipped',   label: '배송중' },
  { value: 'delivered', label: '배송완료' },
] as const

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: '결제 대기', color: 'text-orange-500', bg: 'bg-orange-50' },
  paid:      { label: '결제 완료', color: 'text-blue-500',   bg: 'bg-blue-50' },
  preparing: { label: '상품 준비', color: 'text-indigo-500', bg: 'bg-indigo-50' },
  shipped:   { label: '배송 중',   color: 'text-purple-500', bg: 'bg-purple-50' },
  delivered: { label: '배송 완료', color: 'text-green-600',  bg: 'bg-green-50' },
  cancelled: { label: '취소',      color: 'text-gray-400',   bg: 'bg-gray-50' },
  refunded:  { label: '환불',      color: 'text-red-400',    bg: 'bg-red-50' },
}

interface SearchParams { status?: string }

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { status } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/orders')

  let query = supabase
    .from('orders')
    .select('*, gugu:gugus(title, product_name, thumbnail_url, image_url, emoji)')
    .eq('consumer_id', user.id)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: orders } = await query

  const totalPrice = (o: Record<string, unknown>) =>
    (o.total_price as number) ?? (o.total_amount as number) ?? 0

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white px-4 pt-4 pb-0 border-b border-gray-100">
        <h1 className="text-xl font-black text-gray-900 mb-4">주문 내역</h1>

        {/* 상태 탭 */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-3">
          {STATUS_TABS.map(tab => {
            const active = tab.value === (status ?? 'all')
            return (
              <Link
                key={tab.value}
                href={tab.value === 'all' ? '/orders' : `/orders?status=${tab.value}`}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-3">
        {orders && orders.length > 0 ? (
          orders.map(order => {
            const gugu = order.gugu as Record<string, unknown> | null
            const guguThumb = (gugu?.thumbnail_url ?? gugu?.image_url) as string | null
            const guguTitle = (gugu?.title ?? gugu?.product_name) as string | null
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-2xl border border-gray-100/80 overflow-hidden card-tap"
              >
                {/* 상단: 날짜 + 상태 */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <div>
                    <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
                    {order.order_number && (
                      <span className="text-xs text-gray-300 ml-2">#{order.order_number}</span>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.color} ${cfg.bg}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* 상품 정보 */}
                <div className="flex gap-3 p-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {guguThumb ? (
                      <img src={guguThumb} alt={guguTitle ?? ''} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl bg-red-50">
                        {(gugu?.emoji as string) ?? '🛍️'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
                      {guguTitle ?? '공구 상품'}
                    </p>
                    <p className="text-xs text-gray-400">{order.quantity}개</p>
                    <p className="text-base font-black text-red-500 mt-1">
                      {formatPrice(totalPrice(order))}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-200 self-center flex-shrink-0" />
                </div>

                {/* 액션 버튼 */}
                {order.status === 'delivered' && (
                  <div className="px-4 pb-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/orders/${order.id}/review`}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 text-center text-sm font-semibold bg-red-500 text-white py-2 rounded-xl"
                      >
                        리뷰 작성
                      </Link>
                    </div>
                  </div>
                )}
                {order.status === 'shipped' && (
                  <div className="px-4 pb-4">
                    <div className="bg-purple-50 rounded-xl px-3 py-2">
                      <p className="text-xs text-purple-600 font-semibold">🚚 배송 중</p>
                      {order.tracking_number && (
                        <p className="text-xs text-purple-500 mt-0.5">
                          운송장: {String(order.tracking_number)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            )
          })
        ) : (
          <div className="py-20 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package size={32} className="text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-600">주문 내역이 없어요</p>
            <p className="text-xs text-gray-400 mt-1 mb-6">
              {status && status !== 'all' ? '해당 상태의 주문이 없습니다' : '첫 공구에 참여해보세요!'}
            </p>
            <Link
              href="/gonggu"
              className="flex items-center gap-1.5 bg-red-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl"
            >
              공구 보러가기 <ChevronRight size={15} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
