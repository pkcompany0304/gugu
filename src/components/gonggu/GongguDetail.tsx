'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Gugu } from '@/types'
import { useRealtimeParticipants } from '@/lib/hooks/useGonggu'
import CountdownTimer from './CountdownTimer'
import BackButton from '@/components/ui/BackButton'

const C = { red: '#E63225', rDk: '#C9271C', dk: '#111', g7: '#444', g5: '#777', g4: '#999', g3: '#bbb', g2: '#ddd', g1: '#EFEFEF', g0: '#F7F7F7', wh: '#fff', bg: '#FAFAFA', gn: '#00B67A', yl: '#FFB800' }
const fm = (n: number) => n.toLocaleString('ko-KR')

function Stars({ r, size = 12 }: { r: number; size?: number }) {
  return <span style={{ display: 'inline-flex', gap: 1 }}>{[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: size, color: i <= Math.round(r) ? C.yl : C.g2 }}>★</span>)}</span>
}

function Bar({ cur, goal, h = 5, label = true }: { cur: number; goal: number; h?: number; label?: boolean }) {
  const pct = Math.min(cur / goal * 100, 100)
  const hot = pct >= 85
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
          <span style={{ color: C.g7 }}><b style={{ color: hot ? C.red : C.dk, fontWeight: 800 }}>{fm(cur)}명</b> 참여</span>
          <span style={{ color: C.g4 }}>목표 {fm(goal)}명</span>
        </div>
      )}
      <div style={{ width: '100%', height: h, background: C.g1, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: hot ? `linear-gradient(90deg,${C.red},${C.rDk})` : `linear-gradient(90deg,${C.red}bb,${C.red}88)`, borderRadius: 999, transition: 'width .8s cubic-bezier(.22,1,.36,1)' }} />
      </div>
    </div>
  )
}

interface Props {
  gugu: Gugu
  reviewCount: number
}

export default function GongguDetail({ gugu: g, reviewCount }: Props) {
  const participants = useRealtimeParticipants(g.id, g.current_participants)
  const [tab, setTab] = useState('info')

  const price = g.gonggu_price ?? g.sale_price
  const thumb = g.thumbnail_url ?? g.image_url
  const title = g.title ?? g.product_name
  const endAt = g.end_at ?? (g.end_date ? `${g.end_date}T23:59:59` : null)
  const maxP = g.max_participants ?? g.target_participants ?? 200
  const displayName = g.influencer?.nickname ?? g.influencer?.name
  const urgent = endAt ? (new Date(endAt).getTime() - Date.now()) < 6 * 60 * 60 * 1000 : false

  return (
    <div style={{ paddingBottom: 76, background: C.bg }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, height: 48, background: 'rgba(250,250,250,.97)', borderBottom: `1px solid ${C.g1}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px' }}>
        <BackButton className="" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, background: 'none', border: 'none' }} />
        <span style={{ fontSize: 14, fontWeight: 700 }}>공구 상세</span>
        <div style={{ width: 36 }} />
      </div>

      {/* Image */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '9/11', background: '#000' }}>
        {thumb ? (
          <img src={thumb} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 120, background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)' }}>
            {g.emoji ?? '🛍️'}
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(transparent,rgba(0,0,0,.45))', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 5 }}>
          {urgent && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: C.red, color: C.wh, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, animation: 'bp 2s infinite' }}>마감임박</span>}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(0,0,0,.6)', color: C.wh, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999 }}>{g.discount_rate}% OFF</span>
        </div>
        <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,.6)', borderRadius: 999, padding: '4px 10px 4px 6px' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ADE80' }} />
            <span style={{ color: C.wh, fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{fm(participants)}명</span>
          </div>
          {endAt && <CountdownTimer endAt={endAt} />}
        </div>
      </div>

      {/* Seller */}
      {displayName && (
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, background: C.wh, borderBottom: `1px solid ${C.g1}` }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg,${C.red},${C.rDk})`, padding: 2 }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: g.influencer?.avatar_url ? '#ddd' : `linear-gradient(135deg,#FF6B6B,${C.red})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.wh, fontSize: 14, fontWeight: 800, border: `2px solid ${C.wh}`, overflow: 'hidden' }}>
              {g.influencer?.avatar_url ? <img src={g.influencer.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : displayName.charAt(0)}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{displayName}</span>
              <span style={{ background: C.red, color: C.wh, fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 3 }}>인증</span>
            </div>
          </div>
          <span style={{ color: C.g3 }}>›</span>
        </div>
      )}

      {/* Product Info */}
      <div style={{ padding: '16px 20px', background: C.wh }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1.4 }}>{title}</h1>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '10px 0 0' }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: C.red }}>{g.discount_rate}%</span>
          <span style={{ fontSize: 24, fontWeight: 800 }}>{fm(price)}<span style={{ fontSize: 14 }}>원</span></span>
        </div>
        <span style={{ fontSize: 13, color: C.g3, textDecoration: 'line-through' }}>{fm(g.original_price)}원</span>
      </div>

      {/* Progress */}
      <div style={{ margin: '6px 0', padding: '16px 20px', background: C.wh }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.red, animation: 'bp 2s infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.red }}>실시간 현황</span>
        </div>
        <Bar cur={participants} goal={maxP} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: C.wh, borderBottom: `1px solid ${C.g1}`, position: 'sticky', top: 48, zIndex: 15 }}>
        {[{ id: 'info', l: '상품정보' }, { id: 'review', l: `후기 ${fm(reviewCount)}` }, { id: 'policy', l: '배송/교환' }].map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, textAlign: 'center', padding: '12px 0', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? C.dk : C.g4, borderBottom: tab === t.id ? `2px solid ${C.dk}` : '2px solid transparent' }}>{t.l}</div>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ background: C.wh, minHeight: 180 }}>
        {tab === 'info' && (
          <div style={{ padding: 20 }}>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: C.g5, lineHeight: 1.75 }}>{g.description}</p>
            {displayName && (
              <div style={{ padding: 14, background: C.g0, borderRadius: 12, borderLeft: '3px solid #E86F8A' }}>
                <p style={{ margin: 0, fontSize: 13, color: C.g7, fontStyle: 'italic', lineHeight: 1.6 }}>"{title} 직접 써보고 열었어요! 💛"</p>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: C.g4 }}>— {displayName}</p>
              </div>
            )}
          </div>
        )}
        {tab === 'review' && (
          <div style={{ padding: 20 }}>
            {reviewCount === 0 ? (
              <p style={{ fontSize: 14, color: C.g4, textAlign: 'center', padding: '20px 0' }}>첫 번째 리뷰를 남겨보세요!</p>
            ) : (
              <p style={{ fontSize: 14, color: C.g4, textAlign: 'center', padding: '20px 0' }}>리뷰 {reviewCount}개</p>
            )}
          </div>
        )}
        {tab === 'policy' && (
          <div style={{ padding: 20 }}>
            {[{ t: '배송', items: ['마감 후 3영업일 내 발송', 'CJ대한통운'] }, { t: '교환/반품', items: ['수령 후 7일 이내'] }, { t: '환불', items: ['마감 전 전액 환불'] }].map((s, i) => (
              <div key={i} style={{ marginBottom: i < 2 ? 14 : 0 }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700 }}>{s.t}</h4>
                {s.items.map((x, j) => <div key={j} style={{ fontSize: 13, color: C.g5, lineHeight: 1.6, marginBottom: 2 }}>· {x}</div>)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', padding: '8px 20px', paddingBottom: 'calc(8px + env(safe-area-inset-bottom,0px))', background: 'rgba(255,255,255,.98)', borderTop: `1px solid ${C.g1}`, zIndex: 20 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ padding: '6px 10px', fontSize: 20 }}>🤍</span>
          <Link href={`/orders/new?gugu_id=${g.id}&quantity=1`} style={{ flex: 1, padding: '14px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${C.red},${C.rDk})`, color: C.wh, fontSize: 15, fontWeight: 800, textAlign: 'center', textDecoration: 'none', display: 'block', boxShadow: `0 4px 18px ${C.red}44` }}>
            공구 참여하기
          </Link>
        </div>
      </div>
    </div>
  )
}
