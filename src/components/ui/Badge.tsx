import { cn } from '@/lib/utils/cn'
import { GongguStatus } from '@/types'

const statusConfig: Record<GongguStatus, { label: string; className: string }> = {
  upcoming: { label: '오픈 예정', className: 'bg-blue-100 text-blue-700' },
  active: { label: '진행중', className: 'bg-green-100 text-green-700' },
  closed: { label: '마감', className: 'bg-gray-100 text-gray-600' },
  completed: { label: '완료', className: 'bg-purple-100 text-purple-700' },
  cancelled: { label: '취소', className: 'bg-red-100 text-red-600' },
}

export function StatusBadge({ status }: { status: GongguStatus }) {
  const config = statusConfig[status]
  return (
    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', config.className)}>
      {config.label}
    </span>
  )
}

export function DiscountBadge({ rate }: { rate: number }) {
  return (
    <span className="text-sm font-bold bg-red-500 text-white px-2.5 py-1 rounded-full">
      {rate}% OFF
    </span>
  )
}

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md', className)}>
      {children}
    </span>
  )
}
