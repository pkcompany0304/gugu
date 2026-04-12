'use client'

import Link from 'next/link'
import { Bell, Search, User } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useState } from 'react'

export default function Header() {
  const { profile, displayName, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          {/* 로고 */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-black tracking-tighter text-pink-500">
              GUGU
            </span>
            <span className="ml-1.5 text-[10px] font-semibold bg-pink-100 text-pink-500 px-1.5 py-0.5 rounded-md">
              뷰티
            </span>
          </Link>

          {/* 우측 아이콘 */}
          <div className="flex items-center gap-1">
            {/* 검색 */}
            <Link href="/search" className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <Search size={20} strokeWidth={1.8} />
            </Link>

            {/* 알림 */}
            <Link href="/notifications" className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors relative">
              <Bell size={20} strokeWidth={1.8} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full border border-white" />
            </Link>

            {/* 프로필 / 로그인 */}
            {profile ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-pink-100"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {displayName.charAt(0)}
                      </span>
                    </div>
                  )}
                </button>

                {/* 드롭다운 */}
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                      <div className="px-4 py-2 border-b border-gray-50 mb-1">
                        <p className="text-xs text-gray-400">로그인됨</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                      </div>
                      {[
                        { href: '/profile', label: '내 프로필' },
                        { href: '/orders', label: '주문 내역' },
                      ].map(({ href, label }) => (
                        <Link
                          key={href}
                          href={href}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                          onClick={() => setMenuOpen(false)}
                        >
                          {label}
                        </Link>
                      ))}
                      {profile.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2.5 text-sm text-pink-600 hover:bg-pink-50"
                          onClick={() => setMenuOpen(false)}
                        >
                          관리자
                        </Link>
                      )}
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={() => { signOut(); setMenuOpen(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50"
                      >
                        로그아웃
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <User size={20} strokeWidth={1.8} />
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
