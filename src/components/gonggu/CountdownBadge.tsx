'use client'

import { useEffect, useState } from 'react'
import { differenceInSeconds } from 'date-fns'
import { cn } from '@/lib/utils/cn'

interface Props {
  endAt: string
  className?: string
  /** compact: "D-3" or "2h" / full: "2시간 34분" */
  mode?: 'compact' | 'full'
}

export default function CountdownBadge({ endAt, className, mode = 'compact' }: Props) {
  const [text, setText] = useState('')
  const [urgent, setUrgent] = useState(false)

  useEffect(() => {
    const calc = () => {
      const total = differenceInSeconds(new Date(endAt), new Date())
      if (total <= 0) {
        setText('마감')
        setUrgent(true)
        return
      }

      const d = Math.floor(total / 86400)
      const h = Math.floor((total % 86400) / 3600)
      const m = Math.floor((total % 3600) / 60)
      const s = total % 60

      setUrgent(total < 3600 * 6)  // 6시간 미만이면 urgent

      if (mode === 'compact') {
        if (d > 0) setText(`D-${d}`)
        else if (h > 0) setText(`${h}시간`)
        else setText(`${m}분 ${String(s).padStart(2, '0')}초`)
      } else {
        if (d > 0) setText(`${d}일 ${h}시간 남음`)
        else if (h > 0) setText(`${h}시간 ${m}분 남음`)
        else if (m > 0) setText(`${m}분 ${String(s).padStart(2, '0')}초`)
        else setText(`${s}초 남음`)
      }
    }

    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [endAt, mode])

  if (!text) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-bold tabular-nums',
        urgent ? 'text-red-500' : 'text-orange-500',
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', urgent ? 'bg-red-500 live-dot' : 'bg-orange-400')} />
      {text}
    </span>
  )
}
