import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token'
const KAKAO_PROFILE_URL = 'https://kapi.kakao.com/v2/user/me'

function deriveCredentials(kakaoId: string) {
  const secret = process.env.KAKAO_AUTH_SECRET!
  const email = `kakao_${kakaoId}@gugu.kakao`
  const password = crypto.createHmac('sha256', secret).update(kakaoId).digest('hex')
  return { email, password }
}

function debugJson(step: string, error: unknown) {
  return NextResponse.json({ step, error: String(error) }, { status: 500 })
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('state') ? decodeURIComponent(searchParams.get('state')!) : '/'

  if (!code) {
    return debugJson('no_code', 'code 파라미터 없음')
  }

  // 환경변수 확인
  const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY
  const clientSecret = process.env.KAKAO_CLIENT_SECRET
  const authSecret = process.env.KAKAO_AUTH_SECRET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!clientId || !clientSecret || !authSecret || !supabaseUrl || !serviceKey) {
    return debugJson('env_missing', {
      clientId: !!clientId,
      clientSecret: !!clientSecret,
      authSecret: !!authSecret,
      supabaseUrl: !!supabaseUrl,
      serviceKey: !!serviceKey,
    })
  }

  // ── 1. 카카오 토큰 교환 ─────────────────────────────────────────────────
  const redirectUri = `${origin}/api/auth/kakao/callback`

  const tokenRes = await fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  })

  const tokenBody = await tokenRes.text()
  if (!tokenRes.ok) {
    return debugJson('token_exchange', { status: tokenRes.status, body: tokenBody, redirectUri })
  }

  const { access_token } = JSON.parse(tokenBody) as { access_token: string }

  // ── 2. 카카오 프로필 조회 ────────────────────────────────────────────────
  const profileRes = await fetch(KAKAO_PROFILE_URL, {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  const profileBody = await profileRes.text()
  if (!profileRes.ok) {
    return debugJson('profile_fetch', { status: profileRes.status, body: profileBody })
  }

  const kakaoUser = JSON.parse(profileBody) as {
    id: number
    kakao_account?: { profile?: { nickname?: string; profile_image_url?: string } }
  }

  const kakaoId = String(kakaoUser.id)
  const nickname = kakaoUser.kakao_account?.profile?.nickname ?? `user_${kakaoId}`
  const avatarUrl = kakaoUser.kakao_account?.profile?.profile_image_url ?? null

  // ── 3. Supabase 세션 ────────────────────────────────────────────────────
  const { email, password } = deriveCredentials(kakaoId)

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

  let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

  if (signInError) {
    const admin = createAdminClient()
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: nickname, avatar_url: avatarUrl, kakao_id: kakaoId },
    })

    if (createError) {
      return debugJson('create_user', { error: createError.message, email })
    }

    const result = await supabase.auth.signInWithPassword({ email, password })
    signInData = result.data
    signInError = result.error
  }

  if (signInError || !signInData?.user) {
    return debugJson('sign_in', { error: signInError?.message })
  }

  // ── 4. 프로필 업데이트 ──────────────────────────────────────────────────
  const admin = createAdminClient()
  await admin.from('profiles').upsert(
    { id: signInData.user.id, nickname, avatar_url: avatarUrl },
    { onConflict: 'id' }
  )

  // ── 5. 리다이렉트 ──────────────────────────────────────────────────────
  const response = NextResponse.redirect(`${origin}${next}`)
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  })

  return response
}
