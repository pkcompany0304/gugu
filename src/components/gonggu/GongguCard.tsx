'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { Gugu } from '@/types'
import { formatPrice, calcProgressPercent } from '@/lib/utils/format'
import { useRealtimeParticipants } from '@/lib/hooks/useGonggu'
import CountdownBadge from './CountdownBadge'

interface Props {
  gugu: Gugu
}

export default function GongguCard({ gugu }: Props) {
  const participants = useRealtimeParticipants(gugu.id, gugu.current_participants)
  const maxP = gugu.max_participants ?? gugu.target_participants
  const minP = gugu.min_participants ?? 10
  const price = gugu.gonggu_price ?? gugu.sale_price
  const thumb = gugu.thumbnail_url ?? gugu.image_url
  const title = gugu.title ?? gugu.product_name
  const endAt = gugu.end_at ?? (gugu.end_date ? `${gugu.end_date}T23:59:59` : null)
  const displayName = gugu.influencer?.nickname ?? gugu.influencer?.name
  const progress = calcProgressPercent(participants, maxP, minP)

  return (
    <Link href={`/gonggu/${gugu.id}`} className="block card-tap">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100/80">
        {/* 이미지 */}
        <div className="relative aspect-square bg-gray-100">
          {thumb ? (
            <img
              src={thumb}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-pink-50 to-rose-50">
              {gugu.emoji ?? '🛍️'}
            </div>
          )}

          {/* 할인 뱃지 */}
          <div className="absolute top-2 right-2">
            <span className="text-xs font-black bg-pink-500 text-white px-1.5 py-0.5 rounded-lg">
              {gugu.discount_rate}%
            </span>
          </div>

          {/* 마감임박 표시 */}
          {gugu.status === 'active' && endAt && (
            <div className="absolute bottom-2 left-2">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg px-2 py-0.5">
                <CountdownBadge
                  endAt={endAt}
                  mode="compact"
                  className="text-[11px]"
                />
              </div>
            </div>
          )}

          {/* 오픈 예정 오버레이 */}
          {gugu.status === 'upcoming' && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-lg">
                오픈 예정
              </span>
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="p-3">
          {/* 인플루언서 */}
          {displayName && (
            <div className="flex items-center gap-1.5 mb-1.5">
              {gugu.influencer?.avatar_url ? (
                <img
                  src={gugu.influencer.avatar_url}
                  alt={displayName}
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] font-bold text-pink-500">
                    {displayName.charAt(0)}
                  </span>
                </div>
              )}
              <span className="text-[11px] text-gray-400 font-medium truncate">{displayName}</span>
            </div>
          )}

          {/* 상품명 */}
          <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-2">
            {title}
          </p>

          {/* 가격 */}
          <div className="mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-pink-500">{formatPrice(price)}</span>
              <span className="text-[11px] text-gray-300 line-through">{formatPrice(gugu.original_price)}</span>
            </div>
          </div>

          {/* 참여 진행바 */}
          <div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
              <div
                className="h-full rounded-full progress-bar"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  background: progress >= 80
                    ? 'linear-gradient(90deg, #f97316, #ef4444)'
                    : 'linear-gradient(90deg, #f472b6, #ec4899)',
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5 text-[11px] text-gray-400">
                <Users size={10} />
                <span className="font-semibold text-gray-600">{participants.toLocaleString()}</span>
                <span>명</span>
              </div>
              <span className="text-[11px] font-bold text-pink-500">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
