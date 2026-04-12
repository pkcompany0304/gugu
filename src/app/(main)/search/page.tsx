'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Gugu } from '@/types'
import GongguCard from '@/components/gonggu/GongguCard'
import { useRouter } from 'next/navigation'

const C = { red: '#E63225', dk: '#111', g4: '#999', g3: '#bbb', g1: '#EFEFEF', g0: '#F7F7F7', wh: '#fff' }

export default function SearchPage() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Gugu[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (query: string) => {
    if (!query.trim()) { setResults([]); return }
    setLoading(true)
    const supabase = createClient()
    const like = `%${query}%`
    const { data } = await supabase
      .from('gugus')
      .select('*, influencer:profiles(*)')
      .or(`title.ilike.${like},product_name.ilike.${like},description.ilike.${like}`)
      .in('status', ['active', 'upcoming'])
      .limit(20)
    setResults((data as Gugu[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(q), 300)
    return () => clearTimeout(timer)
  }, [q, search])

  return (
    <div style={{ paddingBottom: 70 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(250,250,250,.97)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.g1}` }}>
        <span onClick={() => router.back()} style={{ fontSize: 20, cursor: 'pointer' }}>←</span>
        <div style={{ flex: 1, background: C.wh, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${q ? C.red : C.g1}` }}>
          <span style={{ fontSize: 14, opacity: 0.35 }}>🔍</span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="검색어를 입력해주세요"
            autoFocus
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 16, width: '100%', padding: 0 }}
          />
          {q && <span onClick={() => setQ('')} style={{ fontSize: 16, color: C.g3, cursor: 'pointer' }}>✕</span>}
        </div>
      </div>

      {q.length === 0 ? (
        <div style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>인기 검색어</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['비건', '클렌징', '이유식', '단백질', '가습기', '선크림', '그래놀라', '실크'].map((w, i) => (
              <span key={w} onClick={() => setQ(w)} style={{ padding: '8px 16px', background: C.wh, borderRadius: 999, fontSize: 13, color: '#444', cursor: 'pointer', border: `1px solid ${C.g1}`, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 12, color: C.red, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{i + 1}</span>{w}
              </span>
            ))}
          </div>
          <h3 style={{ margin: '24px 0 12px', fontSize: 15, fontWeight: 700 }}>카테고리</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[{ e: '💄', l: '뷰티', c: '#FDE8E8' }, { e: '🍽️', l: '식품', c: '#FEF3C7' }, { e: '🏠', l: '리빙', c: '#DBEAFE' }, { e: '👶', l: '육아', c: '#FCE7F3' }].map(c => (
              <div key={c.l} onClick={() => setQ(c.l)} style={{ padding: 16, background: c.c, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <span style={{ fontSize: 28 }}>{c.e}</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{c.l}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: '10px 20px' }}>
          <p style={{ fontSize: 13, color: C.g4, marginBottom: 12 }}>
            검색결과 <b style={{ color: C.dk }}>{results.length}</b>건
          </p>
          {results.length === 0 && !loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 14, color: C.g4 }}>"{q}" 결과 없음</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {results.map((p, i) => <GongguCard key={p.id} gugu={p} index={i} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
