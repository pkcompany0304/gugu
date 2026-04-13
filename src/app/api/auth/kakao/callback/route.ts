import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token'
const KAKAO_PROFILE_URL = 'https://kapi.kakao.com/v2/user/me'

/** 카카오 ID → Supabase auth 전용 내부 credentials 생성 (사용자에게 노출 안 됨) */
function deriveCredentials(kakaoId: string) {
  const secret = process.env.KAKAO_AUTH_SECRET!
  const email = `kakao_${kakaoId}@gugu.kakao`
  const password = crypto.createHmac('sha256', secret).update(kakaoId).digest('hex')
  return { email, password }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('state') ? decodeURIComponent(searchParams.get('state')!) : '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error`)
  }

  // ── 1. 카카오 액세스 토큰 발급 ──────────────────────────────────────────
  const tokenRes = await fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY!,
      client_secret: process.env.KAKAO_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/auth/kakao/callback`,
      code,
    }),
  })

  if (!tokenRes.ok) {
    console.error('[kakao] token exchange failed', await tokenRes.text())
    return NextResponse.redirect(`${origin}/auth/error`)
  }

  const { access_token } = await tokenRes.json() as { access_token: string }

  // ── 2. 카카오 프로필 조회 ────────────────────────────────────────────────
  const profileRes = await fetch(KAKAO_PROFILE_URL, {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (!profileRes.ok) {
    console.error('[kakao] profile fetch failed', await profileRes.text())
    return NextResponse.redirect(`${origin}/auth/error`)
  }

  const kakaoUser = await profileRes.json() as {
    id: number
    kakao_account?: {
      profile?: {
        nickname?: string
        profile_image_url?: string
      }
    }
  }

  const kakaoId   = String(kakaoUser.id)
  const nickname  = kakaoUser.kakao_account?.profile?.nickname ?? `user_${kakaoId}`
  const avatarUrl = kakaoUser.kakao_account?.profile?.profile_image_url ?? null

  // ── 3. Supabase 세션 발급 ────────────────────────────────────────────────
  const { email, password } = deriveCredentials(kakaoId)

  // 쿠키를 Response에 설정하기 위해 수집
  const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = []
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => { toSet.forEach((c) => cookiesToSet.push(c)) },
      },
    }
  )

  // 기존 유저 로그인 시도
  let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

  if (signInError) {
    // 신규 유저 — admin 클라이언트로 생성 (email 확인 없이)
    const admin = createAdminClient()
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: nickname, avatar_url: avatarUrl, kakao_id: kakaoId },
    })

    if (createError || !created.user) {
      console.error('[kakao] createUser failed', createError)
      return NextResponse.redirect(`${origin}/auth/error`)
    }

    // 생성 직후 로그인
    const result = await supabase.auth.signInWithPassword({ email, password })
    signInData  = result.data
    signInError = result.error
  }

  if (signInError || !signInData?.user) {
    console.error('[kakao] signIn failed', signInError)
    return NextResponse.redirect(`${origin}/auth/error`)
  }

  // ── 4. 프로필 최신 카카오 정보로 업데이트 ───────────────────────────────
  const admin = createAdminClient()
  await admin.from('profiles').upsert(
    { id: signInData.user.id, nickname, avatar_url: avatarUrl },
    { onConflict: 'id' }
  )

  // ── 5. 세션 쿠키 설정 후 리다이렉트 ────────────────────────────────────
  const response = NextResponse.redirect(`${origin}${next}`)
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  })

  return response
}
