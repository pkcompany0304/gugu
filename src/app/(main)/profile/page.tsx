import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/profile')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('consumer_id', user.id)

  const displayName = profile?.nickname ?? profile?.name ?? user.email?.split('@')[0] ?? '구구 회원'

  const MENU_SECTIONS = [
    {
      title: '쇼핑 정보',
      items: [
        { icon: '📦', label: '주문/배송 조회', href: '/orders' },
        { icon: '↩️', label: '교환/반품 내역', href: '/orders' },
        { icon: '⭐', label: '내가 쓴 후기', href: '/orders' },
      ],
    },
    {
      title: '혜택',
      items: [
        { icon: '🎫', label: '쿠폰함', href: '/profile' },
        { icon: '💰', label: '포인트 내역', href: '/profile' },
        { icon: '🎁', label: '이벤트', href: '/profile' },
      ],
    },
    {
      title: '설정',
      items: [
        { icon: '👤', label: '회원정보 수정', href: '/profile' },
        { icon: '🔔', label: '알림 설정', href: '/notifications' },
        { icon: '❓', label: '고객센터', href: '/profile' },
        { icon: '📋', label: '이용약관', href: '/profile' },
      ],
    },
  ]

  return (
    <div style={{ paddingBottom: 70 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(250,250,250,.97)', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', borderBottom: '1px solid #EFEFEF' }}>
        <span style={{ fontSize: 17, fontWeight: 800 }}>MY</span>
      </div>

      {/* Profile */}
      <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#E63225,#FF7B73)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 800, overflow: 'hidden', flexShrink: 0 }}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            displayName.charAt(0)
          )}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{displayName}</p>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#999' }}>혜택을 받아보세요</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#fff', borderRadius: 16, border: '1px solid #EFEFEF' }}>
          {[
            { l: '쿠폰', v: '0장', i: '🎫' },
            { l: '포인트', v: '0P', i: '💰' },
            { l: '찜', v: `${orderCount ?? 0}개`, i: '❤️' },
          ].map((s, idx) => (
            <div key={s.l} style={{ textAlign: 'center', padding: '16px 8px', borderRight: idx < 2 ? '1px solid #EFEFEF' : 'none' }}>
              <span style={{ fontSize: 22 }}>{s.i}</span>
              <p style={{ margin: '4px 0 1px', fontSize: 16, fontWeight: 800 }}>{s.v}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#999' }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Sections */}
      {MENU_SECTIONS.map((sec, si) => (
        <div key={si} style={{ padding: '0 20px', marginBottom: 6 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#999', margin: '12px 0 6px' }}>{sec.title}</p>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EFEFEF', overflow: 'hidden' }}>
            {sec.items.map((item, i) => (
              <Link key={i} href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < sec.items.length - 1 ? '1px solid #EFEFEF' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span style={{ fontSize: 14 }}>{item.label}</span>
                  </div>
                  <span style={{ color: '#bbb' }}>›</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Logout */}
      <div style={{ padding: '0 20px', marginTop: 6 }}>
        <LogoutButton />
      </div>

      {/* Version */}
      <div style={{ padding: 20, textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: '#bbb' }}>GUGU v1.0.0</span>
      </div>
    </div>
  )
}
