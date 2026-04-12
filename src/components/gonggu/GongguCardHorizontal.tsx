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

/** 마감임박 섹션용 가로 스크롤 카드 (세로형 단일 카드) */
export default function GongguCardHorizontal({ gugu }: Props) {
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
    <Link href={`/gonggu/${gugu.id}`} className="block card-tap flex-shrink-0 w-40 snap-start">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100/80 h-full">
        {/* 이미지 */}
        <div className="relative w-full aspect-square bg-gray-100">
          {thumb ? (
            <img src={thumb} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-pink-50 to-rose-50">
              {gugu.emoji ?? '🛍️'}
            </div>
          )}
          <div className="absolute top-2 right-2">
            <span className="text-xs font-black bg-pink-500 text-white px-1.5 py-0.5 rounded-lg">
              {gugu.discount_rate}%
            </span>
          </div>
        </div>

        {/* 정보 */}
        <div className="p-3">
          <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2 mb-2">
            {title}
          </p>

          <p className="text-sm font-black text-pink-500 mb-2">{formatPrice(price)}</p>

          {/* 진행바 */}
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: 'linear-gradient(90deg, #f97316, #ef4444)',
              }}
            />
          </div>

          {/* 카운트다운 */}
          {endAt && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5 text-[10px] text-gray-400">
                <Users size={9} />
                <span className="font-semibold text-gray-600">{participants.toLocaleString()}</span>
                <span>명</span>
              </div>
              <CountdownBadge endAt={endAt} mode="compact" className="text-[11px]" />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
