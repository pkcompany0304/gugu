'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gugu } from '@/types'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils/format'
import { ShoppingCart } from 'lucide-react'

interface Props {
  gugu: Gugu
}

export default function GongguOrderButton({ gugu }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)

  const maxPerPerson = gugu.max_per_person ?? 3
  const isActive = gugu.status === 'active'
  const price = gugu.gonggu_price ?? gugu.sale_price

  const handleOrder = () => {
    if (!user) {
      router.push(`/auth/login?redirect=/gonggu/${gugu.id}`)
      return
    }
    router.push(`/orders/new?gugu_id=${gugu.id}&quantity=${quantity}`)
  }

  if (!isActive) {
    return (
      <div className="bg-gray-100 rounded-2xl p-4 text-center text-gray-400 font-semibold">
        {gugu.status === 'upcoming' ? '⏰ 오픈 예정' : '마감된 공구입니다'}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
      {/* 수량 선택 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-gray-700">수량</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max((gugu.min_per_person ?? 1), quantity - 1))}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-200"
          >
            -
          </button>
          <span className="w-8 text-center font-bold text-gray-900">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(maxPerPerson, quantity + 1))}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-200"
          >
            +
          </button>
        </div>
      </div>

      {/* 합계 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">합계</span>
        <span className="text-xl font-black text-pink-500">{formatPrice(price * quantity)}</span>
      </div>

      <Button size="lg" className="w-full" onClick={handleOrder}>
        <ShoppingCart size={18} className="mr-2" />
        공구 참여하기
      </Button>
    </div>
  )
}
