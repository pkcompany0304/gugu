'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }

      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setProfile(data)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithKakao = (next = '/') => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    const url = new URL('https://kauth.kakao.com/oauth/authorize')
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY!)
    url.searchParams.set('redirect_uri', `${appUrl}/api/auth/kakao/callback`)
    url.searchParams.set('scope', 'profile_nickname profile_image')
    url.searchParams.set('state', encodeURIComponent(next))
    window.location.href = url.toString()
  }

  const signOut = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  // 표시명: nickname > name > email 앞부분
  const displayName = profile?.nickname || profile?.name || profile?.email?.split('@')[0] || '사용자'

  return { user, profile, loading, displayName, signInWithKakao, signOut }
}
