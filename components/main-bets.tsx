'use client'

import { Match } from '@/lib/types'
import { useBetSlip } from '@/lib/contexts/bet-slip-context'
import { BetSlipMatchData } from '@/lib/types/bet-slip'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useMemo } from 'react'

interface MainBetsProps {
  match: Match
}

export function MainBets({ match }: MainBetsProps) {
  const { addItem, removeItem, isItemInSlip, getItemInSlip } = useBetSlip()

  const odds = match.odds || { p1: 0, x: 0, p2: 0 }
  const hasValidOdds = odds.p1 > 0 || odds.x > 0 || odds.p2 > 0

  const betSlipMatchData: BetSlipMatchData = {
    match_id: match.id,
    sport_type: match.sport_type,
    league_name: match.league_name,
    team1: match.team1,
    team2: match.team2,
    start_time: match.start_time,
    is_live: match.is_live,
  }

  const isSelected = (outcome: string) => isItemInSlip(match.id, outcome)

  const handleToggleBet = async (outcome: 'home' | 'draw' | 'away', oddValue: number, label: string) => {
    if (oddValue <= 0) {
      toast.error('Коэффициент недоступен')
      return
    }

    // Если ставка уже в купоне - удаляем
    const existingItem = getItemInSlip(match.id, outcome)
    if (existingItem) {
      try {
        await removeItem(existingItem.id)
        toast.success(`Удалено: ${label}`)
      } catch (error: any) {
        toast.error(error.message || 'Ошибка при удалении ставки')
      }
      return
    }

    // Иначе добавляем
    try {
      await addItem({
        match_id: match.id,
        match_data: betSlipMatchData,
        bet_outcome: outcome,
        odds: oddValue,
      })
      toast.success(`Добавлено: ${label} (${oddValue.toFixed(2)})`)
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при добавлении ставки')
    }
  }

  if (!hasValidOdds) {
    return (
      <div className="bg-card-bg rounded-xl p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Основные ставки</h2>
        <div className="text-center py-8 text-text-secondary">
          Коэффициенты недоступны
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card-bg rounded-xl p-6 border border-border">
      <h2 className="text-xl font-bold text-foreground mb-6">Основные ставки</h2>

      {/* Исход матча */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Исход матча</h3>
        <div className="grid grid-cols-3 gap-3">
          {/* П1 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={{
              backgroundColor: isSelected('home') ? 'var(--accent)' : 'var(--card-hover)',
              borderColor: isSelected('home') ? 'var(--accent)' : 'rgba(0,0,0,0)',
            }}
            transition={{ duration: 0.2 }}
            onClick={() => handleToggleBet('home', odds.p1, `П1 (${match.team1.name})`)}
            disabled={odds.p1 <= 0}
            className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 ${
              isSelected('home')
                ? 'bg-accent border-accent text-black'
                : 'bg-card-hover hover:bg-border border-transparent hover:border-accent'
            }`}
          >
            <motion.span
              animate={{ color: isSelected('home') ? 'rgba(0,0,0,0.7)' : 'var(--text-secondary)' }}
              className="text-xs mb-2"
            >
              П1
            </motion.span>
            <motion.span
              animate={{ color: isSelected('home') ? 'rgb(0,0,0)' : 'var(--foreground)' }}
              className="text-sm font-medium mb-1 text-center truncate w-full px-2"
            >
              {match.team1.name}
            </motion.span>
            <motion.span
              animate={{ color: isSelected('home') ? 'rgb(0,0,0)' : 'var(--accent)' }}
              className="text-2xl font-bold"
            >
              {odds.p1 > 0 ? odds.p1.toFixed(2) : '-'}
            </motion.span>
          </motion.button>

          {/* X (Ничья) */}
          {odds.x > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                backgroundColor: isSelected('draw') ? 'var(--accent)' : 'var(--card-hover)',
                borderColor: isSelected('draw') ? 'var(--accent)' : 'rgba(0,0,0,0)',
              }}
              transition={{ duration: 0.2 }}
              onClick={() => handleToggleBet('draw', odds.x, 'X (Ничья)')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors border-2 ${
                isSelected('draw')
                  ? 'bg-accent border-accent text-black'
                  : 'bg-card-hover hover:bg-border border-transparent hover:border-accent'
              }`}
            >
              <motion.span
                animate={{ color: isSelected('draw') ? 'rgba(0,0,0,0.7)' : 'var(--text-secondary)' }}
                className="text-xs mb-2"
              >
                X
              </motion.span>
              <motion.span
                animate={{ color: isSelected('draw') ? 'rgb(0,0,0)' : 'var(--foreground)' }}
                className="text-sm font-medium mb-1"
              >
                Ничья
              </motion.span>
              <motion.span
                animate={{ color: isSelected('draw') ? 'rgb(0,0,0)' : 'var(--accent)' }}
                className="text-2xl font-bold"
              >
                {odds.x.toFixed(2)}
              </motion.span>
            </motion.button>
          )}

          {/* П2 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={{
              backgroundColor: isSelected('away') ? 'var(--accent)' : 'var(--card-hover)',
              borderColor: isSelected('away') ? 'var(--accent)' : 'rgba(0,0,0,0)',
            }}
            transition={{ duration: 0.2 }}
            onClick={() => handleToggleBet('away', odds.p2, `П2 (${match.team2.name})`)}
            disabled={odds.p2 <= 0}
            className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 ${
              isSelected('away')
                ? 'bg-accent border-accent text-black'
                : 'bg-card-hover hover:bg-border border-transparent hover:border-accent'
            }`}
          >
            <motion.span
              animate={{ color: isSelected('away') ? 'rgba(0,0,0,0.7)' : 'var(--text-secondary)' }}
              className="text-xs mb-2"
            >
              П2
            </motion.span>
            <motion.span
              animate={{ color: isSelected('away') ? 'rgb(0,0,0)' : 'var(--foreground)' }}
              className="text-sm font-medium mb-1 text-center truncate w-full px-2"
            >
              {match.team2.name}
            </motion.span>
            <motion.span
              animate={{ color: isSelected('away') ? 'rgb(0,0,0)' : 'var(--accent)' }}
              className="text-2xl font-bold"
            >
              {odds.p2 > 0 ? odds.p2.toFixed(2) : '-'}
            </motion.span>
          </motion.button>
        </div>
      </div>

      {/* Информация */}
      <div className="mt-6 p-4 bg-card-hover rounded-lg">
        <p className="text-sm text-text-secondary text-center">
          Нажмите на коэффициент, чтобы добавить ставку в купон
        </p>
      </div>
    </div>
  )
}
