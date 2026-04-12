'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock, TrendingUp, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Gugu } from '@/types'
import { formatPrice } from '@/lib/utils/format'
import Link from 'next/link'
import CountdownBadge from '@/components/gonggu/CountdownBadge'

const RECENT_KEY = 'gugu_recent_searches'
const HOT_KEYWORDS = ['선크림', '세럼', '토너', '클렌징', '마스크팩', '아이크림', '파운데이션']

function getRecent(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}
function addRecent(q: string) {
  const list = [q, ...getRecent().filter(s => s !== q)].slice(0, 10)
  localStorage.setItem(RECENT_KEY, JSON.stringify(list))
}
function removeRecent(q: string) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(getRecent().filter(s => s !== q)))
}

export default function SearchPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Gugu[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setRecent(getRecent())
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()
      const q = query.trim()
      const { data } = await supabase
        .from('gugus')
        .select('*, influencer:profiles(nickname, name, avatar_url)')
        .in('status', ['active', 'upcoming'])
        .or(`title.ilike.%${q}%,product_name.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%,brand_name.ilike.%${q}%`)
        .order('current_participants', { ascending: false })
        .limit(20)
      setResults((data as Gugu[]) ?? [])
      setLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const handleSubmit = (q: string) => {
    if (!q.trim()) return
    addRecent(q.trim())
    setRecent(getRecent())
    setQuery(q.trim())
  }

  const clearAll = () => {
    localStorage.removeItem(RECENT_KEY)
    setRecent([])
  }

  const thumb = (g: Gugu) => g.thumbnail_url ?? g.image_url
  const title = (g: Gugu) => g.title ?? g.product_name
  const price = (g: Gugu) => g.gonggu_price ?? g.sale_price
  const endAt = (g: Gugu) => g.end_at ?? (g.end_date ? `${g.end_date}T23:59:59` : null)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 검색바 */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 flex-shrink-0">
            <ChevronRight size={22} className="rotate-180" />
          </button>
          <div className="flex-1 flex items-center bg-gray-100 rounded-2xl px-4 py-2.5 gap-2">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit(query)}
              placeholder="상품명, 브랜드, 인플루언서 검색"
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-400 flex-shrink-0">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* 결과 */}
        {query ? (
          loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 flex gap-3 animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              <p className="text-xs text-gray-400 mb-3">
                <span className="text-pink-500 font-bold">"{query}"</span> 검색 결과 {results.length}개
              </p>
              <div className="space-y-3">
                {results.map(g => {
                  const ea = endAt(g)
                  const displayName = g.influencer?.nickname ?? g.influencer?.name
                  return (
                    <Link
                      key={g.id}
                      href={`/gonggu/${g.id}`}
                      onClick={() => handleSubmit(query)}
                      className="block bg-white rounded-2xl p-4 flex gap-3 card-tap border border-gray-100/80"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {thumb(g) ? (
                          <img src={thumb(g)!} alt={title(g)} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl bg-pink-50">
                            {g.emoji ?? '🛍️'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {displayName && (
                          <p className="text-[11px] text-gray-400 truncate mb-0.5">{displayName}</p>
                        )}
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
                          {title(g)}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-black text-pink-500">{formatPrice(price(g))}</span>
                            <span className="text-xs font-bold text-pink-400">{g.discount_rate}%</span>
                          </div>
                          {g.status === 'active' && ea && (
                            <CountdownBadge endAt={ea} mode="compact" className="text-[11px]" />
                          )}
                          {g.status === 'upcoming' && (
                            <span className="text-[11px] font-semibold text-blue-500">오픈예정</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🔍</p>
              <p className="text-sm font-bold text-gray-700">검색 결과가 없어요</p>
              <p className="text-xs text-gray-400 mt-1">다른 검색어를 입력해보세요</p>
            </div>
          )
        ) : (
          <>
            {/* 최근 검색어 */}
            {recent.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-sm font-bold text-gray-700">최근 검색</span>
                  </div>
                  <button onClick={clearAll} className="text-xs text-gray-400">전체 삭제</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map(r => (
                    <div key={r} className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-3 py-1.5">
                      <button
                        onClick={() => { setQuery(r); handleSubmit(r) }}
                        className="text-sm text-gray-700"
                      >
                        {r}
                      </button>
                      <button
                        onClick={() => { removeRecent(r); setRecent(getRecent()) }}
                        className="text-gray-300 hover:text-gray-500"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 인기 키워드 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-pink-500" />
                <span className="text-sm font-bold text-gray-700">인기 검색어</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {HOT_KEYWORDS.map((kw, i) => (
                  <button
                    key={kw}
                    onClick={() => { setQuery(kw); handleSubmit(kw) }}
                    className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 card-tap border border-gray-100/80"
                  >
                    <span className="text-sm font-black text-pink-400 w-5">{i + 1}</span>
                    <span className="text-sm text-gray-800">{kw}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
