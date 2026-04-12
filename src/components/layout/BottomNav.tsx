'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', icon: '🏠', label: '홈' },
  { href: '/gonggu', icon: '🎬', label: '숏피' },
  { href: '/orders', icon: '📦', label: '주문' },
  { href: '/profile', icon: '👤', label: 'MY' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 max-w-[480px] mx-auto" style={{ background: '#fff', borderTop: '1px solid #EFEFEF' }}>
      <div
        className="flex justify-around items-center"
        style={{ height: 56, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {tabs.map(({ href, icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-[1px] card-tap"
              style={{ padding: '5px 14px' }}
            >
              <span style={{ fontSize: 19, opacity: active ? 1 : 0.3 }}>{icon}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? '#E63225' : '#999' }}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
