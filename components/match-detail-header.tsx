'use client'

import { Match } from '@/lib/types'
import { Clock, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { FavoriteButton } from './favorite-button'
import { FavoriteMatchData } from '@/lib/types/favorites'
import { translateTeam, translateLeague } from '@/lib/translations'

interface MatchDetailHeaderProps {
  match: Match
  translateEnabled: boolean
}

export function MatchDetailHeader({ match, translateEnabled }: MatchDetailHeaderProps) {
  const isLive = match.is_live

  const formatTime = () => {
    if (isLive) {
      return match.elapsed ? `${match.elapsed}'` : 'LIVE'
    }
    try {
      const matchTime = new Date(match.start_time)
      return format(matchTime, 'dd MMMM yyyy, HH:mm', { locale: ru })
    } catch {
      return 'Время не указано'
    }
  }

  const favoriteData: FavoriteMatchData = {
    type: 'match',
    sport_type: match.sport_type,
    league_name: match.league_name,
    team1: match.team1,
    team2: match.team2,
    start_time: match.start_time,
    is_live: match.is_live,
  }

  return (
    <div className="bg-card-bg rounded-xl border border-border overflow-hidden">
      {/* Верхняя часть - лига и избранное */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card-hover">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-text-secondary">
            {translateLeague(match.league_name, translateEnabled)}
          </span>
        </div>
        <FavoriteButton
          favoriteData={{
            favorite_type: 'match',
            item_id: match.id,
            item_data: favoriteData,
          }}
          size="md"
        />
      </div>

      {/* Основная часть - команды и счет */}
      <div className="p-6">
        <div className="flex items-center justify-between gap-8">
          {/* Команда 1 */}
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-card-hover flex items-center justify-center mb-3">
              {match.team1.logo ? (
                <img
                  src={match.team1.logo}
                  alt={match.team1.name}
                  className="w-16 h-16 md:w-20 md:h-20 object-contain"
                />
              ) : (
                <span className="text-3xl md:text-4xl font-bold text-text-secondary">
                  {match.team1.name.charAt(0)}
                </span>
              )}
            </div>
            <h2 className="text-lg md:text-xl font-bold text-foreground">
              {translateTeam(match.team1.name, translateEnabled)}
            </h2>
          </div>

          {/* Счет или время */}
          <div className="flex flex-col items-center justify-center min-w-[120px]">
            {isLive && match.score ? (
              <>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-4xl md:text-5xl font-bold text-foreground">
                    {match.score.team1}
                  </span>
                  <span className="text-2xl md:text-3xl font-bold text-text-secondary">:</span>
                  <span className="text-4xl md:text-5xl font-bold text-foreground">
                    {match.score.team2}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-accent font-semibold">
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                  <span>{formatTime()}</span>
                </div>
              </>
            ) : match.score ? (
              <div className="flex items-center gap-4">
                <span className="text-4xl md:text-5xl font-bold text-foreground">
                  {match.score.team1}
                </span>
                <span className="text-2xl md:text-3xl font-bold text-text-secondary">:</span>
                <span className="text-4xl md:text-5xl font-bold text-foreground">
                  {match.score.team2}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm">Начало</span>
                </div>
                <div className="text-lg font-bold text-foreground text-center">
                  {formatTime()}
                </div>
              </div>
            )}
          </div>

          {/* Команда 2 */}
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-card-hover flex items-center justify-center mb-3">
              {match.team2.logo ? (
                <img
                  src={match.team2.logo}
                  alt={match.team2.name}
                  className="w-16 h-16 md:w-20 md:h-20 object-contain"
                />
              ) : (
                <span className="text-3xl md:text-4xl font-bold text-text-secondary">
                  {match.team2.name.charAt(0)}
                </span>
              )}
            </div>
            <h2 className="text-lg md:text-xl font-bold text-foreground">
              {translateTeam(match.team2.name, translateEnabled)}
            </h2>
          </div>
        </div>
      </div>

      {/* Нижняя часть - дополнительная информация */}
      {isLive && (
        <div className="px-6 pb-4">
          <div className="flex items-center justify-center gap-6 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <span>Статус:</span>
              <span className="text-accent font-medium">В игре</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
