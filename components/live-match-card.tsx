'use client'

import { Match } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useLiveOddsContext } from '@/lib/contexts/live-odds-context'
import { translateTeam, translateLeague } from '@/lib/translations'
import { useTranslation } from '@/lib/contexts/translation-context'
import { FavoriteButton } from './favorite-button'
import { FavoriteMatchData } from '@/lib/types/favorites'
import { OddButton } from './odd-button'
import { BetSlipMatchData } from '@/lib/types/bet-slip'

interface LiveMatchCardProps {
  match: Match
}

export function LiveMatchCard({ match }: LiveMatchCardProps) {
  const score1 = match.score?.team1 ?? 0
  const score2 = match.score?.team2 ?? 0
  const { translateEnabled } = useTranslation()

  // API уже возвращает правильный статус is_live
  const isActuallyLive = match.is_live

  // Получаем Live-коэффициенты из контекста (один батч-запрос для всех матчей)
  const { getOdds } = useLiveOddsContext()
  const liveOdds = getOdds(match.id)

  // Используем Live-коэффициенты если они есть, иначе обычные из match
  const displayOdds = liveOdds?.odds || match.odds || { p1: 0, x: 0, p2: 0 }

  // Проверяем, что коэффициенты валидны
  const hasValidOdds = displayOdds.p1 > 0 || displayOdds.x > 0 || displayOdds.p2 > 0

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
    <div className="flex-shrink-0 w-80 bg-card-bg rounded-xl shadow-md border border-border p-4 snap-center hover:bg-card-hover transition-all">
      {/* Шапка */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
          <span className="text-xs font-bold text-accent">
            {match.elapsed ? `${match.elapsed}'` : 'LIVE'}
          </span>
          <span className="text-xs text-text-secondary truncate max-w-[100px]">
            {translateLeague(match.league_name, translateEnabled)}
          </span>
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

      {/* Команды и счет */}
      <div className="space-y-3">
        {/* Команда 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-full bg-card-hover flex-shrink-0 flex items-center justify-center">
              {match.team1.logo ? (
                <img src={match.team1.logo} alt={match.team1.name} className="w-5 h-5" />
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
          <span className="text-xl font-bold text-accent ml-2">
            {score1}
          </span>
        </div>

        {/* Команда 2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-full bg-card-hover flex-shrink-0 flex items-center justify-center">
              {match.team2.logo ? (
                <img src={match.team2.logo} alt={match.team2.name} className="w-5 h-5" />
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
          <span className="text-xl font-bold text-accent ml-2">
            {score2}
          </span>
        </div>
      </div>

      {/* Коэффициенты (компактно) */}
      <div className="mt-3 pt-3 border-t border-border">
        {hasValidOdds ? (
          <div className="flex gap-2">
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
          <div className="text-center text-xs text-text-secondary">
            Коэффициенты недоступны
          </div>
        )}
      </div>
    </div>
  )
}
