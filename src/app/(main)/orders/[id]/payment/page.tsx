'use client'

import BackButton from '@/components/ui/BackButton'
import Link from 'next/link'
import { CreditCard } from 'lucide-react'

export default function PaymentPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="px-4 h-14 flex items-center gap-3 max-w-lg mx-auto">
          <BackButton className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50" />
          <h1 className="text-base font-black text-gray-900">결제하기</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <CreditCard size={36} className="text-red-400" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">결제 기능 준비 중</h2>
        <p className="text-sm text-gray-400 text-center mb-8 leading-relaxed">
          토스페이먼츠 결제 연동을 준비하고 있어요.<br />
          곧 안전하게 결제할 수 있게 될 거예요!
        </p>
        <Link
          href="/"
          className="px-8 py-3 bg-red-500 text-white font-bold rounded-2xl active:scale-95 transition-transform"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
