import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Gugu } from '@/types'
import GongguDetail from '@/components/gonggu/GongguDetail'

interface Props { params: Promise<{ id: string }> }

export default async function GongguDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('gugus')
    .select('*, influencer:profiles(*)')
    .eq('id', id)
    .single()

  if (!data) notFound()
  const g = data as Gugu

  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('gugu_id', id)

  return <GongguDetail gugu={g} reviewCount={reviewCount ?? 0} />
}
