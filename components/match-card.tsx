'use client'

import { Match } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { useLiveOddsContext } from '@/lib/contexts/live-odds-context'
import { translateTeam, translateLeague } from '@/lib/translations'
import { useTranslation } from '@/lib/contexts/translation-context'
import { FavoriteButton } from './favorite-button'
import { FavoriteMatchData } from '@/lib/types/favorites'
import { OddButton } from './odd-button'
import { BetSlipMatchData } from '@/lib/types/bet-slip'
import { memo } from 'react'
import Link from 'next/link'

interface MatchCardProps {
  match: Match
}

const sportColors: Record<string, string> = {
  football: 'bg-green-500',
  hockey: 'bg-cyan-500',
  tennis: 'bg-yellow-500',
  basketball: 'bg-orange-500',
  esports: 'bg-purple-500',
  volleyball: 'bg-pink-500',
  boxing: 'bg-red-500',
}

export const MatchCard = memo(function MatchCard({ match }: MatchCardProps) {
  const { translateEnabled } = useTranslation()

  // API уже возвращает правильный статус is_live
  const isActuallyLive = match.is_live

  // Получаем Live-коэффициенты из контекста (один батч-запрос для всех матчей)
  const { getOdds } = useLiveOddsContext()
  const liveOdds = isActuallyLive ? getOdds(match.id) : null

  // Используем Live-коэффициенты если они есть, иначе обычные из match
  const displayOdds = liveOdds?.odds || match.odds || { p1: 0, x: 0, p2: 0 }

  // Проверяем, что коэффициенты валидны
  const hasValidOdds = displayOdds.p1 > 0 || displayOdds.x > 0 || displayOdds.p2 > 0

  const formatTime = () => {
    if (isActuallyLive) {
      return match.elapsed ? `${match.elapsed}'` : 'LIVE'
    }
    try {
      const matchTime = new Date(match.start_time)
      return format(matchTime, 'HH:mm', { locale: ru })
    } catch {
      return '--:--'
    }
  }

  // Данные для избранного
  const favoriteData: FavoriteMatchData = {
    type: 'match',
    sport_type: match.sport_type,
    league_name: match.league_name,
    team1: match.team1,
    team2: match.team2,
    start_time: match.start_time,
    is_live: match.is_live,
  }

  // Данные для купона
  const betSlipMatchData: BetSlipMatchData = {
    match_id: match.id,
    sport_type: match.sport_type,
    league_name: match.league_name,
    team1: match.team1,
    team2: match.team2,
    start_time: match.start_time,
    is_live: match.is_live,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="bg-card-bg rounded-xl hover:bg-card-hover transition-all p-4 border border-border"
    >
      {/* Время и избранное */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isActuallyLive ? (
            <div className="flex items-center gap-1.5 text-accent font-semibold text-sm">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
              {formatTime()}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-text-secondary text-sm">
              <Clock className="w-4 h-4" />
              {formatTime()}
            </div>
          )}
        </div>
        <FavoriteButton
          favoriteData={{
            favorite_type: 'match',
            item_id: match.id,
            item_data: favoriteData,
          }}
          size="sm"
        />
      </div>

      {/* Лига */}
      <div className="text-xs text-text-secondary mb-3 truncate">
        {translateLeague(match.league_name, translateEnabled)}
      </div>

      {/* Команды и счет */}
      <Link href={`/match/${match.id}`} className="block">
        <div className="space-y-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-card-hover flex items-center justify-center flex-shrink-0">
                {match.team1.logo ? (
                  <img src={match.team1.logo} alt={match.team1.name} className="w-6 h-6" />
                ) : (
                  <span className="text-xs font-bold text-text-secondary">
                    {match.team1.name.charAt(0)}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-foreground truncate">
                {translateTeam(match.team1.name, translateEnabled)}
              </span>
            </div>
            {match.score && (
              <span className="text-lg font-bold text-foreground ml-2">
                {match.score.team1}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-card-hover flex items-center justify-center flex-shrink-0">
                {match.team2.logo ? (
                  <img src={match.team2.logo} alt={match.team2.name} className="w-6 h-6" />
                ) : (
                  <span className="text-xs font-bold text-text-secondary">
                    {match.team2.name.charAt(0)}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-foreground truncate">
                {translateTeam(match.team2.name, translateEnabled)}
              </span>
            </div>
            {match.score && (
              <span className="text-lg font-bold text-foreground ml-2">
                {match.score.team2}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Коэффициенты */}
      {hasValidOdds ? (
        <div className="grid grid-cols-3 gap-2">
          <OddButton
            label="П1"
            value={displayOdds.p1}
            outcome="home"
            matchData={betSlipMatchData}
          />

          {displayOdds.x > 0 && (
            <OddButton
              label="X"
              value={displayOdds.x}
              outcome="draw"
              matchData={betSlipMatchData}
            />
          )}

          <OddButton
            label="П2"
            value={displayOdds.p2}
            outcome="away"
            matchData={betSlipMatchData}
          />
        </div>
      ) : (
        <div className="py-4 text-center text-sm text-text-secondary">
          Коэффициенты недоступны
        </div>
      )}
    </motion.div>
  )
})
