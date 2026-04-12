'use client'

import { useEffect, useState } from 'react'
import { differenceInSeconds } from 'date-fns'
import { cn } from '@/lib/utils/cn'

interface CountdownTimerProps {
  endAt: string
  className?: string
}

export default function CountdownTimer({ endAt, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const calc = () => {
      const total = differenceInSeconds(new Date(endAt), new Date())
      if (total <= 0) {
        setExpired(true)
        return
      }
      setTimeLeft({
        days: Math.floor(total / 86400),
        hours: Math.floor((total % 86400) / 3600),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60,
      })
    }

    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [endAt])

  if (expired) {
    return (
      <div className={cn('text-center', className)}>
        <span className="text-lg font-bold text-gray-400">공구 종료</span>
      </div>
    )
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {timeLeft.days > 0 && (
        <>
          <TimeBlock value={timeLeft.days} label="일" />
          <Colon />
        </>
      )}
      <TimeBlock value={timeLeft.hours} label="시" />
      <Colon />
      <TimeBlock value={timeLeft.minutes} label="분" />
      <Colon />
      <TimeBlock value={timeLeft.seconds} label="초" urgent={timeLeft.days === 0 && timeLeft.hours < 1} />
    </div>
  )
}

function TimeBlock({ value, label, urgent }: { value: number; label: string; urgent?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        'min-w-[48px] h-12 flex items-center justify-center rounded-xl font-black text-xl tabular-nums',
        urgent ? 'bg-red-500 text-white' : 'bg-gray-900 text-white'
      )}>
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-xs text-gray-400 mt-1">{label}</span>
    </div>
  )
}

function Colon() {
  return <span className="text-xl font-black text-gray-400 pb-4">:</span>
}
