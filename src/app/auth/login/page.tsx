'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '@/components/ui/Button'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
  const { signInWithKakao } = useAuth()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const [loading, setLoading] = useState(false)

  const handleKakaoLogin = () => {
    setLoading(true)
    signInWithKakao(redirect)
    // window.location.href 이동이므로 setLoading(false) 불필요
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-red-500 mb-2">GUGU</h1>
          <p className="text-gray-500 text-sm">인플루언서 공동구매 플랫폼</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-black text-gray-900 mb-2 text-center">로그인</h2>
          <p className="text-gray-400 text-sm text-center mb-8">
            로그인 후 공구에 참여할 수 있어요
          </p>

          {/* 카카오 로그인 */}
          <Button
            variant="kakao"
            size="lg"
            className="w-full"
            onClick={handleKakaoLogin}
            loading={loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9 0C4.029 0 0 3.134 0 7C0 9.387 1.426 11.49 3.6 12.753L2.7 16.2C2.628 16.495 2.952 16.726 3.213 16.556L7.2 14C7.785 14.077 8.388 14.1 9 14.1C13.971 14.1 18 10.966 18 7C18 3.134 13.971 0 9 0Z"
                fill="#191919"
              />
            </svg>
            카카오로 시작하기
          </Button>

          <p className="text-xs text-gray-400 text-center mt-6">
            로그인 시 서비스 이용약관 및 개인정보처리방침에<br />동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
