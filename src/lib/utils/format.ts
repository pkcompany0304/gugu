import { format, formatDistanceToNow, differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns'
import { ko } from 'date-fns/locale'

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price) + '원'
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'yyyy.MM.dd', { locale: ko })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'yyyy.MM.dd HH:mm', { locale: ko })
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko })
}

export function formatCountdown(endAt: string | Date): string {
  const end = new Date(endAt)
  const now = new Date()
  const seconds = differenceInSeconds(end, now)

  if (seconds <= 0) return '종료'

  const days = differenceInDays(end, now)
  const hours = differenceInHours(end, now) % 24
  const minutes = differenceInMinutes(end, now) % 60
  const secs = seconds % 60

  if (days > 0) return `${days}일 ${hours}시간 남음`
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`
  if (minutes > 0) return `${minutes}분 ${secs}초 남음`
  return `${secs}초 남음`
}

export function formatParticipants(current: number, max: number | null): string {
  if (max === null) return `${current.toLocaleString()}명 참여중`
  return `${current.toLocaleString()} / ${max.toLocaleString()}명`
}

export function formatDiscountRate(rate: number): string {
  return `${rate}%`
}

export function calcProgressPercent(current: number, max: number | null, min: number): number {
  if (max === null) return Math.min((current / min) * 100, 100)
  return Math.min((current / max) * 100, 100)
}
