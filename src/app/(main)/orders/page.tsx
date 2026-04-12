import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Gugu } from '@/types'

const SM: Record<string, { c: string; bg: string }> = {
  pending: { c: '#FF6B00', bg: '#FFF4EC' },
  paid: { c: '#FF6B00', bg: '#FFF4EC' },
  preparing: { c: '#2563EB', bg: '#EFF6FF' },
  shipped: { c: '#00B67A', bg: '#EDFFF7' },
  delivered: { c: '#999', bg: '#F7F7F7' },
  cancelled: { c: '#E63225', bg: '#FFF0EF' },
}

const STATUS_LABEL: Record<string, string> = {
  pending: '결제대기',
  paid: '공구진행중',
  preparing: '배송준비중',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '취소됨',
}

const fm = (n: number) => n.toLocaleString('ko-KR')

interface SearchParams { status?: string }

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { status } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/orders')

  let query = supabase
    .from('orders')
    .select('*, gugu:gugus(title, product_name, thumbnail_url, image_url, emoji, gonggu_price, sale_price, discount_rate)')
    .eq('consumer_id', user.id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data: orders } = await query

  const tabs = [
    { label: '전체', value: '' },
    { label: '공구진행중', value: 'paid' },
    { label: '배송중', value: 'shipped' },
    { label: '배송완료', value: 'delivered' },
  ]

  return (
    <div style={{ paddingBottom: 70 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(250,250,250,.97)', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', borderBottom: '1px solid #EFEFEF' }}>
        <span style={{ fontSize: 17, fontWeight: 800 }}>주문내역</span>
      </div>

      {/* Tabs */}
      <div style={{ padding: '12px 20px 0', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {tabs.map(t => (
          <a
            key={t.label}
            href={t.value ? `/orders?status=${t.value}` : '/orders'}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: 'none',
              background: (status || '') === t.value ? '#111' : '#fff',
              color: (status || '') === t.value ? '#fff' : '#777',
              fontSize: 12,
              fontWeight: (status || '') === t.value ? 700 : 500,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* Orders */}
      <div style={{ padding: '14px 20px' }}>
        {orders && orders.length > 0 ? orders.map((o, i) => {
          const gugu = o.gugu as Record<string, unknown> | null
          const title = (gugu?.title ?? gugu?.product_name ?? '주문 상품') as string
          const emoji = (gugu?.emoji ?? '🛍️') as string
          const thumb = (gugu?.thumbnail_url ?? gugu?.image_url) as string | null
          const total = (o.total_price ?? o.total_amount) as number
          const statusLabel = STATUS_LABEL[o.status] ?? o.status
          const sm = SM[o.status] ?? { c: '#999', bg: '#F7F7F7' }

          return (
            <Link key={o.id} href={`/orders/${o.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, border: '1px solid #EFEFEF', animation: `fu .3s ease ${i * 0.06}s both` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#999', fontFamily: "'JetBrains Mono',monospace" }}>{o.order_number ?? o.id.slice(0, 13)}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', background: sm.bg, color: sm.c, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999 }}>{statusLabel}</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 27, overflow: 'hidden', background: thumb ? '#f3f4f6' : 'linear-gradient(135deg, #FFF0EF, #FFD6D4)' }}>
                    {thumb ? <img src={thumb} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
                    <p style={{ margin: '3px 0', fontSize: 12, color: '#999' }}>수량 {o.quantity ?? 1}개 · {new Date(o.created_at).toLocaleDateString('ko-KR')}</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{fm(total)}원</p>
                  </div>
                </div>
              </div>
            </Link>
          )
        }) : (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#444' }}>주문 내역이 없어요</p>
            <p style={{ fontSize: 13, color: '#999', marginTop: 4 }}>공구에 참여해보세요!</p>
          </div>
        )}
      </div>
    </div>
  )
}
