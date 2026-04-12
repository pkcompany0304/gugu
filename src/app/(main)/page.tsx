import { createClient } from '@/lib/supabase/server'
import GongguCard from '@/components/gonggu/GongguCard'
import GongguCardHorizontal from '@/components/gonggu/GongguCardHorizontal'
import { Gugu } from '@/types'
import Link from 'next/link'
import { ChevronRight, Flame, Clock, Sparkles } from 'lucide-react'

export const revalidate = 30

export default async function HomePage() {
  const supabase = await createClient()

  // 마감임박 (end_at 빠른 순, 최대 10개)
  const { data: closingSoon } = await supabase
    .from('gugus')
    .select('*, influencer:profiles(*)')
    .eq('status', 'active')
    .order('end_at', { ascending: true, nullsFirst: false })
    .limit(10)

  // 진행중 전체 (참여자 많은 순)
  const { data: activeGugus } = await supabase
    .from('gugus')
    .select('*, influencer:profiles(*)')
    .eq('status', 'active')
    .order('current_participants', { ascending: false })
    .limit(8)

  // 오픈 예정
  const { data: upcomingGugus } = await supabase
    .from('gugus')
    .select('*, influencer:profiles(*)')
    .eq('status', 'upcoming')
    .order('start_at', { ascending: true })
    .limit(4)

  const totalActive = activeGugus?.length ?? 0

  return (
    <div className="space-y-0">

      {/* ── 히어로 배너 ── */}
      <section className="px-4 pt-4 pb-2">
        <div className="relative bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 rounded-3xl overflow-hidden">
          {/* 배경 장식 */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute -bottom-12 -left-6 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute top-1/2 right-12 w-4 h-4 bg-white/30 rounded-full" />
          </div>

          <div className="relative p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full live-dot" />
                    LIVE 공구 {totalActive}개 진행중
                  </span>
                </div>
                <h1 className="text-2xl font-black text-white leading-tight mb-1">
                  함께 사면<br />더 저렴하게!
                </h1>
                <p className="text-pink-100 text-sm mb-5">
                  인플루언서가 직접 고른 뷰티템
                </p>
                <Link
                  href="/gonggu"
                  className="inline-flex items-center gap-1.5 bg-white text-pink-500 text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm active:scale-95 transition-transform"
                >
                  공구 둘러보기
                  <ChevronRight size={15} />
                </Link>
              </div>

              {/* 우측 이모지 장식 */}
              <div className="flex flex-col items-end gap-2 ml-4">
                <div className="text-4xl filter drop-shadow-sm">💄</div>
                <div className="text-3xl filter drop-shadow-sm">✨</div>
                <div className="text-2xl filter drop-shadow-sm">🛍️</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 마감임박 ── */}
      {closingSoon && closingSoon.length > 0 && (
        <section className="pt-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-orange-100 rounded-xl flex items-center justify-center">
                <Flame size={15} className="text-orange-500" />
              </div>
              <h2 className="text-base font-black text-gray-900">마감임박</h2>
              <span className="text-xs font-bold bg-orange-100 text-orange-500 px-2 py-0.5 rounded-full">
                HOT
              </span>
            </div>
            <Link
              href="/gonggu?status=active"
              className="flex items-center gap-0.5 text-xs font-semibold text-gray-400"
            >
              전체보기 <ChevronRight size={13} />
            </Link>
          </div>

          {/* 가로 스크롤 */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1 snap-x-mandatory">
            {closingSoon.map((g) => (
              <GongguCardHorizontal key={g.id} gugu={g as Gugu} />
            ))}
            {/* 더보기 카드 */}
            <Link
              href="/gonggu?status=active"
              className="flex-shrink-0 w-40 snap-start flex items-center justify-center"
            >
              <div className="bg-gray-100 rounded-2xl w-full aspect-square flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
                <span className="text-xs font-semibold text-gray-400">더보기</span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── 진행중 공구 ── */}
      <section className="pt-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-pink-100 rounded-xl flex items-center justify-center">
              <Sparkles size={14} className="text-pink-500" />
            </div>
            <h2 className="text-base font-black text-gray-900">진행중 공구</h2>
            {totalActive > 0 && (
              <span className="text-xs font-bold text-gray-400">{totalActive}</span>
            )}
          </div>
          <Link
            href="/gonggu?status=active"
            className="flex items-center gap-0.5 text-xs font-semibold text-gray-400"
          >
            전체보기 <ChevronRight size={13} />
          </Link>
        </div>

        {activeGugus && activeGugus.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 px-4">
            {activeGugus.map((g) => (
              <GongguCard key={g.id} gugu={g as Gugu} />
            ))}
          </div>
        ) : (
          <EmptyState
            emoji="🔍"
            title="진행중인 공구가 없어요"
            sub="곧 새로운 공구가 오픈됩니다"
          />
        )}
      </section>

      {/* ── 오픈 예정 ── */}
      {upcomingGugus && upcomingGugus.length > 0 && (
        <section className="pt-6 pb-2">
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock size={14} className="text-blue-500" />
              </div>
              <h2 className="text-base font-black text-gray-900">오픈 예정</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 px-4">
            {upcomingGugus.map((g) => (
              <GongguCard key={g.id} gugu={g as Gugu} />
            ))}
          </div>
        </section>
      )}

      {/* 하단 여백 */}
      <div className="h-4" />
    </div>
  )
}

function EmptyState({
  emoji,
  title,
  sub,
}: {
  emoji: string
  title: string
  sub: string
}) {
  return (
    <div className="mx-4 py-12 flex flex-col items-center bg-white rounded-2xl border border-gray-100">
      <span className="text-4xl mb-3">{emoji}</span>
      <p className="text-sm font-bold text-gray-700">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}
