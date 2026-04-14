'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const params = useParams()
  const [confirming, setConfirming] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const confirm = async () => {
      const paymentId = searchParams.get('paymentId')
      const orderId = params.id as string

      if (!paymentId || !orderId) {
        setError('결제 정보가 올바르지 않습니다.')
        setConfirming(false)
        return
      }

      const response = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, orderId }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(data?.error || '결제 확인에 실패했습니다.')
      }

      setConfirming(false)
    }

    confirm()
  }, [params.id, searchParams])

  if (confirming) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <div className="animate-spin w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full" />
        <p className="text-gray-500 font-medium">결제 확인 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16 px-4">
        <h2 className="text-xl font-black text-gray-900 mb-2">결제 확인 실패</h2>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <Button onClick={() => router.back()}>다시 시도</Button>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto text-center py-16 px-4">
      <div className="flex justify-center mb-6">
        <CheckCircle size={72} className="text-green-500" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">결제 완료!</h2>
      <p className="text-gray-500 mb-8">
        공동구매 참여가 완료되었습니다.
      </p>
      <div className="flex flex-col gap-3">
        <Link href={`/orders/${params.id}`}>
          <Button variant="outline" className="w-full">주문 내역 확인</Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" className="w-full">홈으로</Button>
        </Link>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
