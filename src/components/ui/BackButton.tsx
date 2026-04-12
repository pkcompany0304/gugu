'use client'

import { useRouter } from 'next/navigation'

export default function BackButton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className={className}
      style={style}
      aria-label="뒤로가기"
    >
      ←
    </button>
  )
}
