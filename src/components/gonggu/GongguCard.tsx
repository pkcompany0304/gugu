'use client'

import Link from 'next/link'
import { Gugu } from '@/types'
import { formatPrice, calcProgressPercent } from '@/lib/utils/format'
import { useRealtimeParticipants } from '@/lib/hooks/useGonggu'
import CountdownBadge from './CountdownBadge'

interface Props { gugu: Gugu; index?: number }

export default function GongguCard({ gugu, index = 0 }: Props) {
  const participants = useRealtimeParticipants(gugu.id, gugu.current_participants)
  const maxP = gugu.max_participants ?? gugu.target_participants
  const minP = gugu.min_participants ?? 10
  const price = gugu.gonggu_price ?? gugu.sale_price
  const thumb = gugu.thumbnail_url ?? gugu.image_url
  const title = gugu.title ?? gugu.product_name
  const endAt = gugu.end_at ?? (gugu.end_date ? `${gugu.end_date}T23:59:59` : null)
  const displayName = gugu.influencer?.nickname ?? gugu.influencer?.name
  const progress = calcProgressPercent(participants, maxP, minP)
  const urgent = endAt ? (new Date(endAt).getTime() - Date.now()) < 3 * 60 * 60 * 1000 : false
  const hot = progress >= 85

  return (
    <Link
      href={`/gonggu/${gugu.id}`}
      className="block card-tap"
      style={{ animation: `fu .4s ease ${index * 0.05}s both` }}
    >
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #EFEFEF' }}>
        {/* Image / Emoji */}
        <div className="relative" style={{ paddingTop: '100%' }}>
          <div className="absolute inset-0">
            {thumb ? (
              <img src={thumb} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[68px]" style={{ background: `linear-gradient(145deg, ${gugu.emoji === '🌸' ? '#FFE4E8' : gugu.emoji === '💧' ? '#E0F2FE' : gugu.emoji === '💄' ? '#FCE7F3' : gugu.emoji === '✨' ? '#FEF3C7' : gugu.emoji === '🌟' ? '#EDE9FE' : gugu.emoji === '🌹' ? '#FFE4E6' : gugu.emoji === '🍵' ? '#D1FAE5' : '#F3F4F6'}88, ${gugu.emoji === '🌸' ? '#FFC0CB' : gugu.emoji === '💧' ? '#BAE6FD' : gugu.emoji === '💄' ? '#FBCFE8' : gugu.emoji === '✨' ? '#FDE68A' : gugu.emoji === '🌟' ? '#DDD6FE' : gugu.emoji === '🌹' ? '#FECDD3' : gugu.emoji === '🍵' ? '#A7F3D0' : '#E5E7EB'}88)` }}>
                {gugu.emoji ?? '🛍️'}
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {urgent && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white px-2.5 py-[3px] rounded-full animate-pulse-dot" style={{ background: '#E63225' }}>
                마감임박
              </span>
            )}
            <span className="text-[11px] font-bold text-white px-2.5 py-[3px] rounded-full" style={{ background: 'rgba(0,0,0,.6)' }}>
              {gugu.discount_rate}%
            </span>
          </div>

          {/* Live count */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-[2px] rounded-full" style={{ background: 'rgba(0,0,0,.55)' }}>
            <span className="w-[5px] h-[5px] rounded-full" style={{ background: '#4ADE80' }} />
            <span className="text-white text-[10px] font-semibold font-mono">{participants.toLocaleString()}</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          {displayName && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-3 h-3 rounded-full inline-flex items-center justify-center text-[7px] text-white font-bold" style={{ background: gugu.influencer?.avatar_url ? undefined : '#E63225' }}>
                {gugu.influencer?.avatar_url ? (
                  <img src={gugu.influencer.avatar_url} className="w-full h-full rounded-full object-cover" />
                ) : '✓'}
              </span>
              <span className="text-[11px]" style={{ color: '#999' }}>{displayName}</span>
            </div>
          )}

          <h3 className="text-[14px] font-bold leading-[1.4] mb-1.5 line-clamp-2" style={{ color: '#111' }}>
            {title}
          </h3>

          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-[16px] font-black" style={{ color: '#E63225' }}>
              {formatPrice(price)}
            </span>
            <span className="text-[11px] line-through" style={{ color: '#bbb' }}>
              {formatPrice(gugu.original_price)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: '#EFEFEF' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: hot
                  ? `linear-gradient(90deg, #E63225, #C9271C)`
                  : `linear-gradient(90deg, #E63225bb, #E6322588)`,
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
