'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, Package, User } from 'lucide-react'

const tabs = [
  { href: '/',        icon: Home,         label: '홈' },
  { href: '/gonggu',  icon: ShoppingBag,  label: '공구' },
  { href: '/orders',  icon: Package,      label: '주문' },
  { href: '/profile', icon: User,         label: 'MY' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-100">
      <div
        className="flex items-center justify-around"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', height: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {tabs.map(({ href, icon: Icon, label }) => {
          const active =
            href === '/'
              ? pathname === '/'
              : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-14 relative"
            >
              <div className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${active ? 'bg-pink-50' : ''}`}>
                <Icon
                  size={21}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={`transition-colors duration-200 ${active ? 'text-pink-500' : 'text-gray-400'}`}
                />
                {/* 활성 인디케이터 점 */}
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-pink-500 rounded-full" />
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-tight transition-colors duration-200 ${active ? 'text-pink-500' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
