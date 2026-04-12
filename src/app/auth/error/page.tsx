import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-4">😢</div>
        <h1 className="text-xl font-black text-gray-900 mb-2">로그인에 실패했어요</h1>
        <p className="text-sm text-gray-400 mb-8">
          카카오 로그인 중 문제가 발생했습니다.<br />잠시 후 다시 시도해주세요.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center w-full py-4 bg-red-500 text-white font-bold rounded-2xl"
        >
          다시 로그인하기
        </Link>
      </div>
    </div>
  )
}
