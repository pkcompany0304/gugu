import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatRelativeTime } from '@/lib/utils/format'
import BackButton from '@/components/ui/BackButton'
import { Bell, Package, Clock, Tag, Megaphone } from 'lucide-react'

// 알림 타입 — 실제 알림 테이블이 생기면 교체
type NotifType = 'order' | 'gonggu_open' | 'closing_soon' | 'discount' | 'system'

interface MockNotif {
  id: string
  type: NotifType
  title: string
  body: string
  read: boolean
  created_at: string
  href?: string
}

const ICON_MAP: Record<NotifType, { icon: typeof Bell; bg: string; color: string }> = {
  order:        { icon: Package,    bg: 'bg-blue-100',   color: 'text-blue-500' },
  gonggu_open:  { icon: Tag,        bg: 'bg-green-100',  color: 'text-green-500' },
  closing_soon: { icon: Clock,      bg: 'bg-orange-100', color: 'text-orange-500' },
  discount:     { icon: Tag,        bg: 'bg-pink-100',   color: 'text-pink-500' },
  system:       { icon: Megaphone,  bg: 'bg-gray-100',   color: 'text-gray-500' },
}

// 실 운영 시 Supabase 알림 테이블로 교체
const getMockNotifications = (): MockNotif[] => [
  {
    id: '1',
    type: 'closing_soon',
    title: '⏰ 마감 임박!',
    body: '관심 공구가 3시간 후 마감됩니다.',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    href: '/gonggu',
  },
  {
    id: '2',
    type: 'order',
    title: '🚚 배송이 시작됐어요',
    body: '주문하신 상품이 출발했습니다. 배송 현황을 확인하세요.',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    href: '/orders',
  },
  {
    id: '3',
    type: 'gonggu_open',
    title: '✨ 새 공구 오픈!',
    body: '인플루언서 공구가 새로 시작됐어요. 지금 참여하세요!',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    href: '/gonggu',
  },
  {
    id: '4',
    type: 'discount',
    title: '💝 특별 할인 공구',
    body: '오늘 하루만! 최대 50% 할인 공구가 오픈됐어요.',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    href: '/gonggu',
  },
  {
    id: '5',
    type: 'system',
    title: 'GUGU에 오신 것을 환영해요 🎉',
    body: '인플루언서가 직접 큐레이션한 뷰티 공동구매 플랫폼입니다.',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
]

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/notifications')

  const notifications = getMockNotifications()
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="px-4 h-14 flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <BackButton className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50" />
            <div>
              <h1 className="text-base font-black text-gray-900">알림</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-pink-500 font-semibold -mt-0.5">읽지 않은 알림 {unreadCount}개</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button className="text-xs font-semibold text-gray-400">모두 읽음</button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-2">
        {notifications.length > 0 ? (
          notifications.map(notif => {
            const { icon: Icon, bg, color } = ICON_MAP[notif.type]
            return (
              <a
                key={notif.id}
                href={notif.href ?? '#'}
                className={`flex gap-3 p-4 rounded-2xl border card-tap transition-colors ${
                  notif.read
                    ? 'bg-white border-gray-100/80'
                    : 'bg-pink-50/50 border-pink-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <Icon size={18} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${notif.read ? 'font-semibold text-gray-700' : 'font-bold text-gray-900'}`}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notif.body}</p>
                  <p className="text-[10px] text-gray-300 mt-1.5">{formatRelativeTime(notif.created_at)}</p>
                </div>
              </a>
            )
          })
        ) : (
          <div className="py-20 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell size={32} className="text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-600">알림이 없어요</p>
            <p className="text-xs text-gray-400 mt-1">새로운 공구 알림을 기다려보세요!</p>
          </div>
        )}
      </div>
    </div>
  )
}
