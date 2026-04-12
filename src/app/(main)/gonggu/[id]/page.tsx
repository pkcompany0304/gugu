import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Gugu } from '@/types'
import { formatPrice, formatDate, calcProgressPercent } from '@/lib/utils/format'
import CountdownTimer from '@/components/gonggu/CountdownTimer'
import GongguOrderButton from '@/components/gonggu/GongguOrderButton'
import BackButton from '@/components/ui/BackButton'
import { Users, Truck, Calendar, Star, ChevronRight } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function GongguDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('gugus')
    .select('*, influencer:profiles(*)')
    .eq('id', id)
    .single()

  if (!data) notFound()
  const g = data as Gugu

  // 리뷰 수 조회
  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('gugu_id', id)

  const price      = g.gonggu_price ?? g.sale_price
  const maxP       = g.max_participants ?? g.target_participants
  const minP       = g.min_participants ?? 10
  const thumb      = g.thumbnail_url ?? g.image_url
  const title      = g.title ?? g.product_name
  const endAt      = g.end_at ?? (g.end_date ? `${g.end_date}T23:59:59` : null)
  const startAt    = g.start_at ?? g.start_date
  const shippingFee = g.shipping_fee ?? g.shipping_cost ?? 0
  const displayName = g.influencer?.nickname ?? g.influencer?.name
  const progress   = calcProgressPercent(g.current_participants, maxP, minP)
  const allImages  = g.images?.length ? g.images : (thumb ? [thumb] : [])

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 이미지 영역 */}
      <div className="relative bg-white">
        <div className="aspect-square bg-gray-100 overflow-hidden">
          {thumb ? (
            <img src={thumb} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br from-pink-50 to-rose-50">
              {g.emoji ?? '🛍️'}
            </div>
          )}
        </div>

        {/* 뒤로가기 */}
        <BackButton className="absolute top-4 left-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm" />

        {/* 할인 뱃지 */}
        <div className="absolute top-4 right-4 bg-pink-500 text-white text-sm font-black px-2.5 py-1 rounded-xl shadow-sm">
          {g.discount_rate}% OFF
        </div>

        {/* 이미지 인디케이터 (복수 이미지 시) */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {allImages.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="px-4 space-y-3 pt-4 pb-32">

        {/* 인플루언서 + 상태 */}
        <div className="flex items-center justify-between">
          {displayName && (
            <div className="flex items-center gap-2">
              {g.influencer?.avatar_url ? (
                <img src={g.influencer.avatar_url} alt={displayName} className="w-8 h-8 rounded-full object-cover ring-2 ring-pink-100" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{displayName.charAt(0)}</span>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400">인플루언서</p>
                <p className="text-sm font-bold text-gray-900">{displayName}</p>
              </div>
            </div>
          )}
          <StatusChip status={g.status} />
        </div>

        {/* 제목 */}
        <h1 className="text-xl font-black text-gray-900 leading-snug">{title}</h1>

        {/* 가격 카드 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-400">정가</span>
            <span className="text-sm text-gray-300 line-through">{formatPrice(g.original_price)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700">공구가</span>
            <span className="text-2xl font-black text-pink-500">{formatPrice(price)}</span>
          </div>
          <div className="mt-3 bg-pink-50 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-xs text-pink-600">💰</span>
            <span className="text-xs text-pink-600 font-semibold">
              {formatPrice(g.original_price - price)} 절약
            </span>
          </div>
        </div>

        {/* 카운트다운 */}
        {g.status === 'active' && endAt && (
          <div className="bg-gray-900 rounded-2xl p-5">
            <p className="text-gray-400 text-xs text-center mb-4">⏳ 공구 마감까지</p>
            <div className="flex justify-center">
              <CountdownTimer endAt={endAt} />
            </div>
          </div>
        )}

        {/* 참여 현황 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-pink-500" />
              <span className="text-sm font-bold text-gray-900">참여 현황</span>
            </div>
            <span className="text-sm font-black text-pink-500">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: progress >= 80
                  ? 'linear-gradient(90deg, #f97316, #ef4444)'
                  : 'linear-gradient(90deg, #f472b6, #ec4899)',
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>현재 <strong className="text-gray-700">{g.current_participants.toLocaleString()}명</strong> 참여중</span>
            {maxP && <span>최대 {maxP.toLocaleString()}명</span>}
          </div>
          {g.current_participants < minP && (
            <div className="mt-2 bg-orange-50 rounded-xl px-3 py-2">
              <p className="text-xs text-orange-600 font-semibold">
                ⚠️ 최소 {minP}명 달성 시 공구 성립 ({minP - g.current_participants}명 더 필요)
              </p>
            </div>
          )}
        </div>

        {/* 배송 / 일정 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100/80 space-y-3">
          <h2 className="text-sm font-bold text-gray-900">배송 · 일정</h2>
          <InfoRow icon={<Truck size={15} className="text-gray-400" />} label="배송비">
            <span className="text-sm font-semibold text-gray-800">
              {shippingFee === 0 ? (
                <span className="text-green-600 font-bold">무료배송 🎉</span>
              ) : formatPrice(shippingFee)}
            </span>
          </InfoRow>
          {startAt && endAt && (
            <InfoRow icon={<Calendar size={15} className="text-gray-400" />} label="공구 기간">
              <span className="text-sm font-semibold text-gray-800">
                {formatDate(startAt)} ~ {formatDate(endAt)}
              </span>
            </InfoRow>
          )}
          {g.estimated_delivery && (
            <InfoRow icon={<Calendar size={15} className="text-gray-400" />} label="예상 배송">
              <span className="text-sm font-semibold text-gray-800">{g.estimated_delivery}</span>
            </InfoRow>
          )}
          {typeof (g as unknown as Record<string, unknown>).return_policy === 'string' && (
            <InfoRow icon={<span className="text-gray-400 text-sm">↩️</span>} label="교환/반품">
              <span className="text-sm text-gray-600">{(g as unknown as Record<string, unknown>).return_policy as string}</span>
            </InfoRow>
          )}
        </div>

        {/* 상품 설명 */}
        {g.description && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100/80">
            <h2 className="text-sm font-bold text-gray-900 mb-3">공구 소개</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{g.description}</p>
          </div>
        )}

        {/* 리뷰 미리보기 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star size={15} className="text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-bold text-gray-900">리뷰</span>
              <span className="text-sm font-bold text-pink-500">{reviewCount ?? 0}</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
          {(!reviewCount || reviewCount === 0) && (
            <p className="text-xs text-gray-400 mt-2">첫 번째 리뷰를 남겨보세요!</p>
          )}
        </div>
      </div>

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 max-w-lg mx-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="px-4 py-3">
          <GongguOrderButton gugu={g} />
        </div>
      </div>
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    upcoming:  { label: '오픈예정', cls: 'bg-blue-100 text-blue-600' },
    active:    { label: '진행중',   cls: 'bg-green-100 text-green-600' },
    closed:    { label: '마감',     cls: 'bg-gray-100 text-gray-500' },
    completed: { label: '완료',     cls: 'bg-purple-100 text-purple-600' },
    cancelled: { label: '취소',     cls: 'bg-red-100 text-red-500' },
  }
  const c = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' }
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.cls}`}>{c.label}</span>
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 flex items-center justify-center flex-shrink-0">{icon}</div>
      <span className="text-xs text-gray-400 w-16 flex-shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}
