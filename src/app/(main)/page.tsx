import { createClient } from '@/lib/supabase/server'
import GongguCard from '@/components/gonggu/GongguCard'
import GongguCardHorizontal from '@/components/gonggu/GongguCardHorizontal'
import { Gugu } from '@/types'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import CountdownTimer from '@/components/gonggu/CountdownTimer'

export const revalidate = 30

export default async function HomePage() {
  const supabase = await createClient()

  const { data: closingSoon } = await supabase
    .from('gugus')
    .select('*, influencer:profiles(*)')
    .eq('status', 'active')
    .order('end_at', { ascending: true, nullsFirst: false })
    .limit(10)

  const { data: activeGugus } = await supabase
    .from('gugus')
    .select('*, influencer:profiles(*)')
    .eq('status', 'active')
    .order('current_participants', { ascending: false })
    .limit(8)

  const { data: upcomingGugus } = await supabase
    .from('gugus')
    .select('*, influencer:profiles(*)')
    .eq('status', 'upcoming')
    .order('start_at', { ascending: true })
    .limit(4)

  const totalActive = activeGugus?.length ?? 0

  // Get unique influencers from active gugus
  const influencers = activeGugus
    ?.map(g => (g as Gugu).influencer)
    .filter((inf, i, arr) => inf && arr.findIndex(x => x?.id === inf?.id) === i)
    .slice(0, 7) ?? []

  // Find the first closing soon item for hero
  const hero = closingSoon?.[0] as Gugu | undefined

  return (
    <div style={{ paddingBottom: 70 }}>
      <Header />

      {/* Hero Banner */}
      {hero && (
        <div className="px-5 pt-3.5 pb-0">
          <Link href={`/gonggu/${hero.id}`} className="block card-tap">
            <div className="relative overflow-hidden rounded-[20px]" style={{ background: 'linear-gradient(135deg, #111, #252525)', padding: '20px 18px 18px' }}>
              <div className="absolute" style={{ top: -40, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(230,50,37,.09)' }} />
              <div className="relative z-[1]">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white px-2.5 py-[3px] rounded-full animate-pulse-dot" style={{ background: '#E63225' }}>HOT</span>
                  <span className="text-[11px] font-mono" style={{ color: '#999' }}>오늘의 추천</span>
                </div>
                <h2 className="text-[19px] font-extrabold text-white mb-0.5 leading-tight">
                  {(hero.title ?? hero.product_name)} {hero.discount_rate}% 할인
                </h2>
                <p className="text-[12px] mb-4" style={{ color: '#777' }}>
                  {hero.influencer?.nickname ?? hero.influencer?.name} × GUGU 단독
                </p>
                <div className="flex items-center justify-between">
                  {hero.end_at && <CountdownTimer endAt={hero.end_at} />}
                  <span className="text-[13px] font-bold text-white px-5 py-2.5 rounded-full" style={{ background: '#E63225' }}>참여하기</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 마감임박 Horizontal Scroll */}
      {closingSoon && closingSoon.length > 0 && (
        <section className="pt-[18px]">
          <div className="px-5 flex items-center gap-1.5 mb-2.5">
            <span className="text-[16px]">🔥</span>
            <h3 className="text-[15px] font-extrabold" style={{ color: '#E63225' }}>마감임박</h3>
          </div>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-5 pb-1 snap-x-mandatory">
            {closingSoon.map(g => (
              <GongguCardHorizontal key={g.id} gugu={g as Gugu} />
            ))}
          </div>
        </section>
      )}

      {/* 인기 셀러 */}
      {influencers.length > 0 && (
        <section className="pt-[18px]">
          <div className="px-5 mb-3">
            <h3 className="text-[15px] font-extrabold" style={{ color: '#111' }}>인기 셀러</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1.5">
            {influencers.map(inf => inf && (
              <div key={inf.id} className="flex flex-col items-center gap-[5px] min-w-[72px] flex-shrink-0">
                <div className="w-[62px] h-[62px] rounded-full p-[3px]" style={{ background: 'linear-gradient(135deg, #E63225, #C9271C)' }}>
                  <div className="w-full h-full rounded-full flex items-center justify-center text-white text-[16px] font-black" style={{ background: `linear-gradient(135deg, ${inf.avatar_url ? '#ddd' : '#FF6B6B'}, ${inf.avatar_url ? '#ccc' : '#E63225'})`, border: '2.5px solid white' }}>
                    {inf.avatar_url ? (
                      <img src={inf.avatar_url} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      (inf.nickname ?? inf.name ?? '?').charAt(0)
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-semibold max-w-[72px] truncate" style={{ color: '#444' }}>
                  {inf.nickname ?? inf.name}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 진행중 공구 */}
      <section className="pt-[18px]">
        <div className="px-5 flex items-center justify-between pb-2 mb-0" style={{ borderBottom: '1px solid #EFEFEF' }}>
          <span className="text-[14px] font-extrabold" style={{ color: '#111' }}>
            진행중 <span className="font-mono" style={{ color: '#E63225' }}>{totalActive}</span>
          </span>
          <Link href="/gonggu?status=active" className="text-[12px]" style={{ color: '#999' }}>
            전체보기 ›
          </Link>
        </div>

        {activeGugus && activeGugus.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 px-5 pt-2.5">
            {activeGugus.map((g, i) => (
              <GongguCard key={g.id} gugu={g as Gugu} index={i} />
            ))}
          </div>
        ) : (
          <div className="mx-5 py-12 flex flex-col items-center bg-white rounded-2xl" style={{ border: '1px solid #EFEFEF' }}>
            <span className="text-4xl mb-3">🔍</span>
            <p className="text-sm font-bold" style={{ color: '#444' }}>진행중인 공구가 없어요</p>
            <p className="text-xs mt-1" style={{ color: '#999' }}>곧 새로운 공구가 오픈됩니다</p>
          </div>
        )}
      </section>

      {/* 오픈 예정 */}
      {upcomingGugus && upcomingGugus.length > 0 && (
        <section className="pt-[18px] pb-2">
          <div className="px-5 flex items-center gap-1.5 mb-2.5">
            <span className="text-[14px]">⏰</span>
            <h3 className="text-[15px] font-extrabold" style={{ color: '#111' }}>오픈 예정</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5 px-5">
            {upcomingGugus.map((g, i) => (
              <GongguCard key={g.id} gugu={g as Gugu} index={i} />
            ))}
          </div>
        </section>
      )}

      <div className="h-4" />
    </div>
  )
}
