'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Gugu } from '@/types'

export function useRealtimeParticipants(guguId: string, initialCount: number) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    const supabase = createClient()
    const channelId = `gugu-${guguId}-${Math.random().toString(36).slice(2)}`

    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'gugus',
          filter: `id=eq.${guguId}`,
        },
        (payload) => {
          const updated = payload.new as Gugu
          setCount(updated.current_participants)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [guguId])

  return count
}

export function useActiveGugus() {
  const [gugus, setGugus] = useState<Gugu[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchGugus = async () => {
      const { data } = await supabase
        .from('gugus')
        .select('*, influencer:profiles(*)')
        .eq('status', 'active')
        .order('end_at', { ascending: true })

      setGugus((data as Gugu[]) || [])
      setLoading(false)
    }

    fetchGugus()

    const channel = supabase
      .channel(`active-gugus-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gugus' },
        () => fetchGugus()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { gugus, loading }
}
