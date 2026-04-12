'use client'

import Link from 'next/link'
import { Gugu } from '@/types'
import { formatPrice, calcProgressPercent } from '@/lib/utils/format'
import { useRealtimeParticipants } from '@/lib/hooks/useGonggu'
import CountdownBadge from './CountdownBadge'

interface Props { gugu: Gugu }

export default function GongguCardHorizontal({ gugu }: Props) {
  const participants = useRealtimeParticipants(gugu.id, gugu.current_participants)
  const maxP = gugu.max_participants ?? gugu.target_participants
  const minP = gugu.min_participants ?? 10
  const price = gugu.gonggu_price ?? gugu.sale_price
  const thumb = gugu.thumbnail_url ?? gugu.image_url
  const title = gugu.title ?? gugu.product_name
  const endAt = gugu.end_at ?? (gugu.end_date ? `${gugu.end_date}T23:59:59` : null)

  return (
    <Link href={`/gonggu/${gugu.id}`} className="block card-tap flex-shrink-0 w-60 snap-start">
      <div className="bg-white rounded-2xl p-3" style={{ border: '1px solid rgba(230,50,37,.13)' }}>
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-[28px]"
            style={{ background: `linear-gradient(135deg, ${thumb ? '#f3f4f6' : '#FFF0EF'}, ${thumb ? '#e5e7eb' : '#FFD6D4'})` }}>
            {thumb ? (
              <img src={thumb} alt={title} className="w-full h-full rounded-xl object-cover" />
            ) : (
              gugu.emoji ?? '🛍️'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold leading-tight line-clamp-2 mb-1" style={{ color: '#111' }}>{title}</p>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="text-[14px] font-black" style={{ color: '#E63225' }}>{gugu.discount_rate}%</span>
              <span className="text-[13px] font-bold" style={{ color: '#111' }}>{formatPrice(price)}</span>
            </div>
            {endAt && <CountdownBadge endAt={endAt} mode="compact" className="text-[11px]" />}
          </div>
        </div>
      </div>
    </Link>
  )
}
