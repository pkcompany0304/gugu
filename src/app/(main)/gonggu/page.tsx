import { createClient } from '@/lib/supabase/server'
import GongguCard from '@/components/gonggu/GongguCard'
import { Gugu, GugugStatus } from '@/types'

export const revalidate = 30

interface SearchParams {
  status?: GugugStatus
}

export default async function GongguListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('gugus')
    .select('*, influencer:profiles(*)')
    .order('end_at', { ascending: true, nullsFirst: false })

  if (status) {
    query = query.eq('status', status)
  } else {
    query = query.in('status', ['active', 'upcoming'])
  }

  const { data: gugus } = await query

  const tabs: { label: string; value: GugugStatus | undefined }[] = [
    { label: '전체', value: undefined },
    { label: '진행중', value: 'active' },
    { label: '오픈예정', value: 'upcoming' },
    { label: '마감', value: 'closed' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">공구 목록</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <a
            key={tab.label}
            href={tab.value ? `/gonggu?status=${tab.value}` : '/gonggu'}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              status === tab.value || (!status && !tab.value)
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300'
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {gugus && gugus.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gugus.map((g) => (
            <GongguCard key={g.id} gugu={g as Gugu} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">해당하는 공구가 없습니다</p>
        </div>
      )}
    </div>
  )
}
