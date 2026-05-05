'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { motion, AnimatePresence } from 'framer-motion'

export function PendingBetsBadge() {
  const { isAuthenticated } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) {
      setCount(0)
      return
    }

    loadCount()

    // Создаем уникальное имя канала для каждого экземпляра
    const channelName = `pending-bets-${Math.random().toString(36).substring(7)}`
    const channel = supabase.channel(channelName)

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bet_slips',
        filter: 'status=eq.placed',
      },
      () => {
        loadCount()
      }
    )

    channel.subscribe()

    return () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [isAuthenticated])

  const loadCount = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count: pendingCount } = await supabase
      .from('bet_slips')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'placed')

    setCount(pendingCount || 0)
  }

  if (count === 0) return null

  return (
    <AnimatePresence>
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full"
      >
        {count > 99 ? '99+' : count}
      </motion.span>
    </AnimatePresence>
  )
}
