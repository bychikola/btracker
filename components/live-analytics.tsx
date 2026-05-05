'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { TrendingUp, TrendingDown, DollarSign, Target, Activity } from 'lucide-react'
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

    // Подписка на изменения в реальном времени
    const channelName = `live-analytics-${Math.random().toString(36).substring(7)}`
    const channel = supabase.channel(channelName)

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bet_slips',
      },
      () => {
        loadStats()
      }
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

    // Получаем все завершенные ставки
    const { data: betSlips } = await supabase
      .from('bet_slips')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['won', 'lost', 'cancelled'])

    if (!betSlips || betSlips.length === 0) {
      setStats({
        totalProfit: 0,
        roi: 0,
        winRate: 0,
        activeBets: 0,
        todayProfit: 0,
      })
      return
    }

    // Подсчет активных ставок
    const { count: activeCount } = await supabase
      .from('bet_slips')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'placed')

    // Расчет статистики
    const totalStaked = betSlips.reduce((sum, b) => sum + b.stake_amount, 0)
    const totalReturn = betSlips
      .filter(b => b.status === 'won')
      .reduce((sum, b) => sum + b.potential_win, 0)
    const totalProfit = totalReturn - totalStaked
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0

    const wonBets = betSlips.filter(b => b.status === 'won').length
    const winRate = betSlips.length > 0 ? (wonBets / betSlips.length) * 100 : 0

    // Прибыль за сегодня
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

    setStats({
      totalProfit,
      roi,
      winRate,
      activeBets: activeCount || 0,
      todayProfit,
    })
  }

  if (!isAuthenticated) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card-bg rounded-xl p-4 border border-border"
      >
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-text-secondary" />
          <span className="text-xs text-text-secondary">Общая прибыль</span>
        </div>
        <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(0)} ₽
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card-bg rounded-xl p-4 border border-border"
      >
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-text-secondary" />
          <span className="text-xs text-text-secondary">ROI</span>
        </div>
        <div className={`text-2xl font-bold ${stats.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card-bg rounded-xl p-4 border border-border"
      >
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-text-secondary" />
          <span className="text-xs text-text-secondary">Винрейт</span>
        </div>
        <div className="text-2xl font-bold text-foreground">
          {stats.winRate.toFixed(0)}%
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card-bg rounded-xl p-4 border border-border"
      >
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-text-secondary" />
          <span className="text-xs text-text-secondary">Активные</span>
        </div>
        <div className="text-2xl font-bold text-blue-500">
          {stats.activeBets}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card-bg rounded-xl p-4 border border-border"
      >
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-text-secondary" />
          <span className="text-xs text-text-secondary">Сегодня</span>
        </div>
        <div className={`text-2xl font-bold ${stats.todayProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {stats.todayProfit >= 0 ? '+' : ''}{stats.todayProfit.toFixed(0)} ₽
        </div>
      </motion.div>
    </div>
  )
}
