'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { TrendingUp, DollarSign, Target, Activity } from 'lucide-react'
import { motion } from 'framer-motion'

interface LiveStats {
  totalProfit: number
  roi: number
  winRate: number
  activeBets: number
  todayProfit: number
}

export function LiveAnalytics() {
  const { isAuthenticated } = useAuth()
  const [stats, setStats] = useState<LiveStats>({
    totalProfit: 0,
    roi: 0,
    winRate: 0,
    activeBets: 0,
    todayProfit: 0,
  })

  useEffect(() => {
    if (!isAuthenticated) return

    loadStats()

    const channel = supabase.channel(`live-analytics-${Math.random().toString(36).substring(7)}`)

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bet_slips' },
      () => { loadStats() }
    )

    channel.subscribe()

    return () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [isAuthenticated])

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: betSlips } = await supabase
      .from('bet_slips')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['won', 'lost', 'cancelled'])

    if (!betSlips || betSlips.length === 0) {
      setStats({ totalProfit: 0, roi: 0, winRate: 0, activeBets: 0, todayProfit: 0 })
      return
    }

    const { count: activeCount } = await supabase
      .from('bet_slips')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'placed')

    const totalStaked = betSlips.reduce((sum, b) => sum + b.stake_amount, 0)
    const totalReturn = betSlips
      .filter(b => b.status === 'won')
      .reduce((sum, b) => sum + b.potential_win, 0)
    const totalProfit = totalReturn - totalStaked
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0

    const wonBets = betSlips.filter(b => b.status === 'won').length
    const winRate = betSlips.length > 0 ? (wonBets / betSlips.length) * 100 : 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayBets = betSlips.filter(b => {
      const betDate = new Date(b.placed_at || b.created_at)
      return betDate >= today
    })
    const todayStaked = todayBets.reduce((sum, b) => sum + b.stake_amount, 0)
    const todayReturn = todayBets
      .filter(b => b.status === 'won')
      .reduce((sum, b) => sum + b.potential_win, 0)
    const todayProfit = todayReturn - todayStaked

    setStats({ totalProfit, roi, winRate, activeBets: activeCount || 0, todayProfit })
  }

  if (!isAuthenticated) return null

  const cards = [
    { label: 'Общая прибыль', value: `${stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(0)} ₽`, icon: DollarSign, color: stats.totalProfit >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]', delay: 0.1 },
    { label: 'ROI', value: `${stats.roi >= 0 ? '+' : ''}${stats.roi.toFixed(1)}%`, icon: TrendingUp, color: stats.roi >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]', delay: 0.2 },
    { label: 'Винрейт', value: `${stats.winRate.toFixed(0)}%`, icon: Target, color: 'text-[var(--ink)]', delay: 0.3 },
    { label: 'Активные', value: `${stats.activeBets}`, icon: Activity, color: 'text-blue-500', delay: 0.4 },
    { label: 'Сегодня', value: `${stats.todayProfit >= 0 ? '+' : ''}${stats.todayProfit.toFixed(0)} ₽`, icon: DollarSign, color: stats.todayProfit >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]', delay: 0.5 },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: card.delay }}
          className="bg-[var(--canvas)] rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-center gap-2 mb-2">
            <card.icon className="w-4 h-4 text-[var(--mute)]" />
            <span className="text-xs text-[var(--body)] font-medium">{card.label}</span>
          </div>
          <div className={`text-xl sm:text-2xl font-[800] ${card.color}`}>
            {card.value}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
