'use client'

import { Match } from '@/lib/types'
import { Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface AllMatchesCardProps {
  match: Match
}

export function AllMatchesCard({ match }: AllMatchesCardProps) {
  const matchTime = new Date(match.start_time)
  const timeString = format(matchTime, 'HH:mm', { locale: ru })

  return (
    <div className="bg-card-bg hover:bg-card-hover transition-all border-b border-border last:border-b-0">
      <div className="p-4">
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* Время матча */}
          <div className="col-span-2 flex items-center gap-2">
            {match.is_live ? (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-500">
                  {match.elapsed}'
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-text-secondary text-sm">
                <Clock className="w-4 h-4" />
                {timeString}
              </div>
            )}
          </div>

          {/* Команды и счет */}
          <div className="col-span-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {match.team1.logo && (
                    <img
                      src={match.team1.logo}
                      alt={match.team1.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  )}
                  <span className="text-sm font-medium text-foreground truncate">
                    {match.team1.name}
                  </span>
                </div>
                {match.score && (
                  <span className="text-sm font-bold text-foreground ml-2">
                    {match.score.team1}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {match.team2.logo && (
                    <img
                      src={match.team2.logo}
                      alt={match.team2.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  )}
                  <span className="text-sm font-medium text-foreground truncate">
                    {match.team2.name}
                  </span>
                </div>
                {match.score && (
                  <span className="text-sm font-bold text-foreground ml-2">
                    {match.score.team2}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Коэффициенты */}
          <div className="col-span-5 grid grid-cols-3 gap-2">
            {match.odds && (match.odds.p1 > 0 || match.odds.x > 0 || match.odds.p2 > 0) ? (
              <>
                <button className="py-2 px-3 bg-card-hover hover:bg-accent hover:text-black rounded-lg transition-all text-center">
                  <div className="text-xs text-text-secondary mb-0.5">П1</div>
                  <div className="text-sm font-bold text-foreground">
                    {match.odds.p1.toFixed(2)}
                  </div>
                </button>
                <button className="py-2 px-3 bg-card-hover hover:bg-accent hover:text-black rounded-lg transition-all text-center">
                  <div className="text-xs text-text-secondary mb-0.5">X</div>
                  <div className="text-sm font-bold text-foreground">
                    {match.odds.x > 0 ? match.odds.x.toFixed(2) : '-'}
                  </div>
                </button>
                <button className="py-2 px-3 bg-card-hover hover:bg-accent hover:text-black rounded-lg transition-all text-center">
                  <div className="text-xs text-text-secondary mb-0.5">П2</div>
                  <div className="text-sm font-bold text-foreground">
                    {match.odds.p2.toFixed(2)}
                  </div>
                </button>
              </>
            ) : (
              <div className="col-span-3 text-center text-sm text-text-secondary py-2">
                Коэффициенты недоступны
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
