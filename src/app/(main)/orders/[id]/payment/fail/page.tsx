'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { XCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

const USER_CANCEL_CODE = 'PAY_PROCESS_CANCELED'

function FailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const code    = searchParams.get('code') ?? ''
  const message = searchParams.get('message') ?? '결제에 실패했습니다.'

  const isCanceled = code === USER_CANCEL_CODE

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">

        <div className="flex justify-center mb-6">
          <XCircle size={72} className={isCanceled ? 'text-gray-400' : 'text-red-400'} />
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-2">
          {isCanceled ? '결제가 취소됐어요' : '결제에 실패했어요'}
        </h1>
        <p className="text-sm text-gray-400 mb-2">{message}</p>
        {code && (
          <p className="text-xs text-gray-300 mb-8">에러코드: {code}</p>
        )}

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.back()}
          >
            다시 시도하기
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => router.push('/')}
          >
            홈으로
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function PaymentFailPage() {
  return (
    <Suspense>
      <FailContent />
    </Suspense>
  )
}
