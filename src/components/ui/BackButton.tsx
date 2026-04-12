'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export default function BackButton({ className }: { className?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className={cn('flex items-center justify-center text-gray-700', className)}
      aria-label="뒤로가기"
    >
      <ChevronRight size={20} className="rotate-180" />
    </button>
  )
}
