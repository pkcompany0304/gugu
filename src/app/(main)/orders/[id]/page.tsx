import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { formatPrice, formatDate, formatDateTime } from '@/lib/utils/format'
import BackButton from '@/components/ui/BackButton'
import { Package, MapPin, CreditCard, ChevronRight, Check } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

const STEPS = ['결제완료', '상품준비', '배송중', '배송완료']
const STATUS_STEP: Record<string, number> = {
  pending: 0, paid: 0, preparing: 1, shipped: 2, delivered: 3,
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: order } = await supabase
    .from('orders')
    .select('*, gugu:gugus(title, product_name, thumbnail_url, image_url, emoji, gonggu_price, sale_price, discount_rate)')
    .eq('id', id)
    .eq('consumer_id', user.id)
    .single()

  if (!order) notFound()

  const gugu    = order.gugu as Record<string, unknown> | null
  const thumb   = (gugu?.thumbnail_url ?? gugu?.image_url) as string | null
  const title   = (gugu?.title ?? gugu?.product_name) as string | null
  const total   = (order.total_price as number) ?? (order.total_amount as number) ?? 0
  const step    = STATUS_STEP[order.status] ?? 0
  const isCancelled = ['cancelled', 'refunded'].includes(order.status)

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3">
        <BackButton className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50" />
        <h1 className="text-base font-black text-gray-900">주문 상세</h1>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-3">

        {/* 배송 스텝 */}
        {!isCancelled ? (
          <div className="bg-white rounded-2xl p-5 border border-gray-100/80">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((label, i) => (
                <div key={label} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                    i <= step ? 'bg-pink-500' : 'bg-gray-100'
                  }`}>
                    {i < step ? (
                      <Check size={14} className="text-white" />
                    ) : i === step ? (
                      <span className="w-2.5 h-2.5 bg-white rounded-full" />
                    ) : (
                      <span className="w-2 h-2 bg-gray-300 rounded-full" />
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold text-center ${
                    i === step ? 'text-pink-500' : i < step ? 'text-gray-400' : 'text-gray-300'
                  }`}>{label}</span>
                </div>
              ))}
            </div>
            {/* 연결선 */}
            <div className="relative -mt-11 mb-8 mx-4 flex items-center justify-between px-4">
              {[0,1,2].map(i => (
                <div key={i} className={`flex-1 h-0.5 ${i < step ? 'bg-pink-500' : 'bg-gray-100'}`} />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
            <p className="text-sm font-bold text-red-500">
              {order.status === 'refunded' ? '환불 완료' : '주문 취소'}
            </p>
            <p className="text-xs text-red-400 mt-0.5">
              {order.status === 'refunded' ? '환불이 완료되었습니다.' : '주문이 취소되었습니다.'}
            </p>
          </div>
        )}

        {/* 주문 정보 */}
        <div className="bg-white rounded-2xl border border-gray-100/80 overflow-hidden">
          <div className="flex gap-4 p-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              {thumb ? (
                <img src={thumb} alt={title ?? ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl bg-pink-50">
                  {(gugu?.emoji as string) ?? '🛍️'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{title}</p>
              <p className="text-xs text-gray-400 mt-1">{order.quantity}개</p>
              <p className="text-base font-black text-pink-500 mt-1">{formatPrice(total)}</p>
            </div>
          </div>

          {order.order_number && (
            <div className="border-t border-gray-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">주문번호</span>
                <span className="text-xs font-mono font-semibold text-gray-600">{order.order_number}</span>
              </div>
            </div>
          )}
          <div className="border-t border-gray-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">주문일시</span>
              <span className="text-xs text-gray-600">{formatDateTime(order.created_at)}</span>
            </div>
          </div>
        </div>

        {/* 배송지 */}
        {order.shipping_name && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100/80">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={15} className="text-pink-500" />
              <span className="text-sm font-bold text-gray-900">배송지</span>
            </div>
            <p className="text-sm font-semibold text-gray-800">{order.shipping_name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{order.shipping_phone}</p>
            <p className="text-sm text-gray-500 mt-1">
              ({order.shipping_zip ?? order.shipping_zipcode}){' '}
              {order.shipping_address}
              {(order.shipping_detail) && ` ${order.shipping_detail}`}
            </p>
          </div>
        )}

        {/* 결제 정보 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100/80">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={15} className="text-pink-500" />
            <span className="text-sm font-bold text-gray-900">결제 정보</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">상품 금액</span>
              <span className="text-gray-700">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">배송비</span>
              <span className="text-green-600 font-semibold">무료</span>
            </div>
            <div className="border-t border-gray-50 pt-2 flex justify-between">
              <span className="text-sm font-bold text-gray-900">총 결제금액</span>
              <span className="text-base font-black text-pink-500">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {/* 배송 추적 */}
        {order.status === 'shipped' && order.tracking_number && (
          <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-purple-700">🚚 배송 중</p>
                <p className="text-xs text-purple-500 mt-0.5">
                  {order.shipping_carrier && `${order.shipping_carrier} `}
                  운송장: {String(order.tracking_number)}
                </p>
              </div>
              <ChevronRight size={16} className="text-purple-400" />
            </div>
          </div>
        )}

        {/* 주문 취소 버튼 */}
        {order.status === 'pending' && (
          <div className="pt-2">
            <button className="w-full py-3.5 text-sm font-semibold text-gray-400 border border-gray-200 rounded-2xl">
              주문 취소
            </button>
          </div>
        )}

        {/* 리뷰 작성 */}
        {order.status === 'delivered' && (
          <div className="pt-2">
            <a
              href={`/orders/${id}/review`}
              className="block w-full py-3.5 text-sm font-bold text-white bg-pink-500 rounded-2xl text-center"
            >
              리뷰 작성하기 ✍️
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
