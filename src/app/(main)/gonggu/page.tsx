'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Gugu } from '@/types'
import Link from 'next/link'

const C = { red: '#E63225', wh: '#fff', g3: '#bbb', g4: '#999' }
const MO = "'JetBrains Mono',monospace"
const fm = (n: number) => n.toLocaleString('ko-KR')

const VIDEOS = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
]

const CAPTS = [
  '클렌징 오일 리뷰 🧴✨',
  '그래놀라 언박싱 🥣',
  '가습기 실화? 💨',
  '아기 로션 끝판왕 👶',
  '단백질바 리뷰 💪',
  '실크 안대 후기 😴',
  '뷰티 꿀템 추천 💄',
  '건강식품 리뷰 🍵',
  '리빙 추천템 🏠',
]

interface ShortItem {
  id: string
  name: string
  emoji: string
  price: number
  sold: number
  caption: string
  video: string
  gd: [string, string]
}

export default function ShortsFeedPage() {
  const [shorts, setShorts] = useState<ShortItem[]>([])
  const [idx, setIdx] = useState(0)
  const [likes, setLikes] = useState<Record<string, boolean>>({})
  const [muted, setMuted] = useState(true)
  const vRefs = useRef<(HTMLVideoElement | null)[]>([])
  const cRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    const fetch = async () => {
      const { data } = await supabase
        .from('gugus')
        .select('id, title, product_name, emoji, gonggu_price, sale_price, current_participants, thumbnail_url, image_url')
        .eq('status', 'active')
        .order('current_participants', { ascending: false })
        .limit(6)

      if (data) {
        const items: ShortItem[] = data.map((g, i) => ({
          id: g.id,
          name: g.title ?? g.product_name ?? '공구 상품',
          emoji: g.emoji ?? '🛍️',
          price: g.gonggu_price ?? g.sale_price ?? 0,
          sold: g.current_participants ?? 0,
          caption: CAPTS[i % CAPTS.length],
          video: VIDEOS[i % VIDEOS.length],
          gd: ['#A8E6CF', '#88D8B0'] as [string, string],
        }))
        setShorts(items)
      }
    }
    fetch()
  }, [])

  // Scroll snap → detect current index
  useEffect(() => {
    const c = cRef.current
    if (!c) return
    const fn = () => {
      const n = Math.round(c.scrollTop / c.clientHeight)
      if (n !== idx) setIdx(n)
    }
    c.addEventListener('scroll', fn, { passive: true })
    return () => c.removeEventListener('scroll', fn)
  }, [idx])

  // Play active video, pause others
  useEffect(() => {
    vRefs.current.forEach((v, i) => {
      if (!v) return
      v.muted = muted
      if (i === idx) {
        v.currentTime = 0
        v.play().catch(() => {})
      } else {
        v.pause()
      }
    })
  }, [idx, muted])

  const toggleLike = useCallback((id: string) => {
    setLikes(l => ({ ...l, [id]: !l[id] }))
  }, [])

  if (shorts.length === 0) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <div style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'bp 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div
      ref={cRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        background: '#000',
        scrollbarWidth: 'none',
      }}
    >
      {shorts.map((s, i) => (
        <div key={s.id} style={{ height: '100vh', width: '100%', position: 'relative', scrollSnapAlign: 'start' }}>
          {/* Video */}
          <video
            ref={el => { vRefs.current[i] = el }}
            src={s.video}
            muted={muted}
            autoPlay={i === 0}
            loop
            playsInline
            preload={Math.abs(i - idx) <= 1 ? 'auto' : 'metadata'}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {/* Bottom gradient */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(transparent,rgba(0,0,0,.75))', pointerEvents: 'none' }} />

          {/* Top bar: GUGU. + mute */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 5 }}>
            <span style={{ color: C.wh, fontSize: 18, fontWeight: 900 }}>GUGU<span style={{ color: C.red }}>.</span></span>
            <div
              onClick={() => setMuted(!muted)}
              style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer' }}
            >
              {muted ? '🔇' : '🔊'}
            </div>
          </div>

          {/* Right side: like */}
          <div style={{ position: 'absolute', right: 12, bottom: 200, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', zIndex: 5 }}>
            <div
              onClick={() => toggleLike(s.id)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {likes[s.id] ? '❤️' : '🤍'}
              </div>
              <span style={{ fontSize: 11, color: C.wh, fontFamily: MO }}>{fm(s.sold)}</span>
            </div>
          </div>

          {/* Bottom: caption + product card */}
          <div style={{ position: 'absolute', bottom: 72, left: 0, right: 64, padding: '0 16px', zIndex: 5 }}>
            <p style={{ margin: '0 0 12px', fontSize: 14, color: C.wh, lineHeight: 1.5 }}>{s.caption}</p>
            <Link
              href={`/gonggu/${s.id}`}
              style={{ background: 'rgba(255,255,255,.12)', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
            >
              {/* Thumb */}
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg,${s.gd[0]}55,${s.gd[1]}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {s.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.wh, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                <span style={{ fontSize: 15, fontWeight: 900, color: C.wh }}>{fm(s.price)}원</span>
              </div>
              <div style={{ background: C.red, color: C.wh, fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 999 }}>참여</div>
            </Link>
          </div>
        </div>
      ))}

      {/* Spacer for bottom nav */}
      <div style={{ height: 56 }} />
    </div>
  )
}
