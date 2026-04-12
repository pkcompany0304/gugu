'use client'

import { LogOut } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-4 border border-gray-100/80 card-tap"
    >
      <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
        <LogOut size={16} className="text-red-400" />
      </div>
      <span className="text-sm font-semibold text-red-400">로그아웃</span>
    </button>
  )
}
