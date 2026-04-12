'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { useState, useEffect } from 'react'

export default function Header() {
  const { profile, displayName, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [live, setLive] = useState(0)

  useEffect(() => {
    // Animate counter up
    let frame: number
    const target = 1247
    const dur = 1200
    let start: number | null = null
    const tick = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / dur, 1)
      setLive(Math.floor((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-20 border-b" style={{ background: 'rgba(250,250,250,.97)', borderColor: '#EFEFEF' }}>
        <div className="flex items-center justify-between px-5 h-[52px] max-w-[480px] mx-auto">
          <Link href="/">
            <span style={{ fontSize: 22, fontWeight: 900, color: '#111', letterSpacing: -0.5 }}>GUGU</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#E63225' }}>.</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Live counter */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: '#FFF0EF' }}>
              <span className="w-[5px] h-[5px] rounded-full animate-pulse-dot" style={{ background: '#E63225' }} />
              <span className="font-mono text-[11px] font-bold" style={{ color: '#E63225' }}>
                {live.toLocaleString('ko-KR')}
              </span>
            </div>

            {/* Notification */}
            <Link href="/notifications" className="relative w-[34px] h-[34px] rounded-full flex items-center justify-center text-[15px]" style={{ background: '#F7F7F7', border: '1px solid #EFEFEF' }}>
              🔔
              <span className="absolute top-1 right-1 w-[6px] h-[6px] rounded-full border-[1.5px] border-white" style={{ background: '#E63225' }} />
            </Link>

            {/* Search */}
            <Link href="/search" className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[15px]" style={{ background: '#F7F7F7', border: '1px solid #EFEFEF' }}>
              🔍
            </Link>

            {/* Profile dropdown */}
            {profile ? (
              <div className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)} className="w-[34px] h-[34px] rounded-full flex items-center justify-center overflow-hidden" style={{ background: '#F7F7F7', border: '1px solid #EFEFEF' }}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[13px] font-bold" style={{ color: '#E63225' }}>{displayName.charAt(0)}</span>
                  )}
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-50 mb-1">
                        <p className="text-xs" style={{ color: '#999' }}>로그인됨</p>
                        <p className="text-sm font-bold truncate" style={{ color: '#111' }}>{displayName}</p>
                      </div>
                      <Link href="/profile" className="block px-4 py-2.5 text-sm hover:bg-gray-50" style={{ color: '#444' }} onClick={() => setMenuOpen(false)}>내 프로필</Link>
                      <Link href="/orders" className="block px-4 py-2.5 text-sm hover:bg-gray-50" style={{ color: '#444' }} onClick={() => setMenuOpen(false)}>주문 내역</Link>
                      <hr className="my-1 border-gray-100" />
                      <button onClick={() => { signOut(); setMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50" style={{ color: '#999' }}>로그아웃</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="px-4 py-[7px] rounded-full text-[13px] font-bold text-white" style={{ background: '#111' }}>로그인</Link>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
