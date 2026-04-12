import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils/format'
import Link from 'next/link'
import {
  Package, Star, Heart, Bell, HelpCircle,
  FileText, ChevronRight, Settings, LogOut, User
} from 'lucide-react'
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

  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const displayName = profile?.nickname ?? profile?.name ?? user.email?.split('@')[0] ?? '사용자'
  const roleLabel = profile?.role === 'admin' ? '관리자' : profile?.role === 'influencer' ? '인플루언서' : '일반회원'
  const roleColor = profile?.role === 'admin' ? 'bg-red-100 text-red-600' : profile?.role === 'influencer' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'

  const MENU_GROUPS = [
    {
      title: '쇼핑',
      items: [
        { href: '/orders',        icon: Package,   label: '주문 내역',    badge: orderCount ? String(orderCount) : null },
        { href: '/orders?status=shipped', icon: Package, label: '배송 조회', badge: null },
        { href: '/wishlist',      icon: Heart,     label: '찜 목록',      badge: null },
      ],
    },
    {
      title: '활동',
      items: [
        { href: '/reviews',       icon: Star,      label: '내 리뷰',      badge: reviewCount ? String(reviewCount) : null },
        { href: '/notifications', icon: Bell,      label: '알림 설정',    badge: null },
      ],
    },
    {
      title: '고객지원',
      items: [
        { href: '/faq',           icon: HelpCircle, label: '자주 묻는 질문', badge: null },
        { href: '/terms',         icon: FileText,   label: '이용약관',       badge: null },
        { href: '/settings',      icon: Settings,   label: '설정',           badge: null },
      ],
    },
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 프로필 헤더 */}
      <div className="bg-gradient-to-br from-pink-500 to-rose-500 pt-6 pb-8 px-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          {/* 아바타 */}
          <div className="relative">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-18 h-18 rounded-full object-cover border-4 border-white/40"
                style={{ width: 72, height: 72 }}
              />
            ) : (
              <div className="w-18 h-18 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/40"
                style={{ width: 72, height: 72 }}>
                <User size={32} className="text-white/80" />
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white ${roleColor}`}>
              {roleLabel}
            </div>
          </div>

          {/* 이름 + 이메일 */}
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">{displayName}</h1>
            <p className="text-pink-100 text-sm mt-0.5">{profile?.email ?? user.email}</p>
            <p className="text-pink-200 text-xs mt-0.5">가입일 {profile && formatDate(profile.created_at)}</p>
          </div>

          <Link href="/settings" className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Settings size={18} className="text-white" />
          </Link>
        </div>

        {/* 통계 */}
        <div className="max-w-lg mx-auto mt-5 grid grid-cols-3 gap-3">
          {[
            { label: '주문', value: orderCount ?? 0 },
            { label: '리뷰', value: reviewCount ?? 0 },
            { label: '찜', value: 0 },
          ].map(stat => (
            <div key={stat.label} className="bg-white/15 rounded-2xl py-3 text-center">
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-pink-100 font-semibold mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 메뉴 그룹 */}
      <div className="px-4 -mt-3 max-w-lg mx-auto space-y-3 pb-6">
        {MENU_GROUPS.map(group => (
          <div key={group.title} className="bg-white rounded-2xl border border-gray-100/80 overflow-hidden">
            <p className="px-4 pt-3 pb-2 text-xs font-bold text-gray-400">{group.title}</p>
            {group.items.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 card-tap ${
                  i < group.items.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon size={16} className="text-gray-500" />
                </div>
                <span className="flex-1 text-sm font-semibold text-gray-800">{item.label}</span>
                {item.badge && (
                  <span className="bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
                <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        ))}

        {/* 로그아웃 */}
        <LogoutButton />

        <p className="text-center text-xs text-gray-300 py-2">GUGU v0.1.0</p>
      </div>
    </div>
  )
}
