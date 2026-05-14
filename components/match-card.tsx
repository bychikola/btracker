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
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'

interface MatchCardProps {
  match: Match
}

export const MatchCard = memo(function MatchCard({ match }: MatchCardProps) {
  const { translateEnabled } = useTranslation()

  const isActuallyLive = match.is_live

  const { getOdds, changedIds } = useLiveOddsContext()
  const liveOdds = isActuallyLive ? getOdds(match.id) : null
  const oddsChanged = changedIds.has(String(match.id))

  const displayOdds = liveOdds?.odds || match.odds || { p1: 0, x: 0, p2: 0 }
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

  const favoriteData: FavoriteMatchData = {
    type: 'match',
    sport_type: match.sport_type,
    league_name: match.league_name,
    team1: match.team1,
    team2: match.team2,
    start_time: match.start_time,
    is_live: match.is_live,
  }

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
      whileTap={{ scale: 0.98 }}
    >
      <Card padding="sm" className="hover:bg-[var(--canvas-soft)] transition-colors touch-manipulation">
        <CardContent>
          {/* Time & Favorite */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isActuallyLive ? (
                <Badge variant="live" size="sm">{formatTime()}</Badge>
              ) : (
                <div className="flex items-center gap-1.5 text-[var(--mute)] text-xs">
                  <Clock className="w-3.5 h-3.5" />
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

          {/* League */}
          <div className="text-[11px] text-[var(--mute)] mb-3 truncate font-medium">
            {translateLeague(match.league_name, translateEnabled)}
          </div>

          {/* Teams & Score */}
          <Link href={`/match/${match.id}`} className="block">
            <div className="space-y-2.5 mb-4 cursor-pointer hover:opacity-80 transition-opacity active:opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[var(--canvas-soft)] flex items-center justify-center flex-shrink-0">
                    {match.team1.logo ? (
                      <img src={match.team1.logo} alt="" className="w-5 h-5" />
                    ) : (
                      <span className="text-xs font-bold text-[var(--mute)]">{match.team1.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-[var(--ink)] truncate">
                    {translateTeam(match.team1.name, translateEnabled)}
                  </span>
                </div>
                {match.score && (
                  <span className="text-xl font-[800] text-[var(--ink)] ml-2 flex-shrink-0">
                    {match.score.team1}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[var(--canvas-soft)] flex items-center justify-center flex-shrink-0">
                    {match.team2.logo ? (
                      <img src={match.team2.logo} alt="" className="w-5 h-5" />
                    ) : (
                      <span className="text-xs font-bold text-[var(--mute)]">{match.team2.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-[var(--ink)] truncate">
                    {translateTeam(match.team2.name, translateEnabled)}
                  </span>
                </div>
                {match.score && (
                  <span className="text-xl font-[800] text-[var(--ink)] ml-2 flex-shrink-0">
                    {match.score.team2}
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* Odds */}
          {hasValidOdds ? (
            <div className="grid grid-cols-3 gap-2">
              <OddButton label="П1" value={displayOdds.p1} outcome="home" matchData={betSlipMatchData} changed={oddsChanged} />
              {displayOdds.x > 0 && (
                <OddButton label="X" value={displayOdds.x} outcome="draw" matchData={betSlipMatchData} changed={oddsChanged} />
              )}
              <OddButton label="П2" value={displayOdds.p2} outcome="away" matchData={betSlipMatchData} changed={oddsChanged} />
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-[var(--mute)]">
              Коэффициенты недоступны
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
})
