'use client'

import { Match } from '@/lib/types'
import { useLiveOddsContext } from '@/lib/contexts/live-odds-context'
import { translateTeam, translateLeague } from '@/lib/translations'
import { useTranslation } from '@/lib/contexts/translation-context'
import { FavoriteButton } from './favorite-button'
import { FavoriteMatchData } from '@/lib/types/favorites'
import { OddButton } from './odd-button'
import { BetSlipMatchData } from '@/lib/types/bet-slip'
import { Badge } from './ui/badge'

interface LiveMatchCardProps {
  match: Match
}

export function LiveMatchCard({ match }: LiveMatchCardProps) {
  const score1 = match.score?.team1 ?? 0
  const score2 = match.score?.team2 ?? 0
  const { translateEnabled } = useTranslation()

  const isActuallyLive = match.is_live

  const { getOdds, changedIds } = useLiveOddsContext()
  const liveOdds = getOdds(match.id)
  const oddsChanged = changedIds.has(String(match.id))

  const displayOdds = liveOdds?.odds || match.odds || { p1: 0, x: 0, p2: 0 }
  const hasValidOdds = displayOdds.p1 > 0 || displayOdds.x > 0 || displayOdds.p2 > 0

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
    <div className="flex-shrink-0 w-72 sm:w-80 bg-[var(--canvas)] rounded-[var(--radius-xl)] shadow-[var(--shadow-card)] p-4 snap-center hover:bg-[var(--canvas-soft)] transition-all border border-[var(--border)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="live" size="sm">{match.elapsed ? `${match.elapsed}'` : 'LIVE'}</Badge>
          <span className="text-[11px] text-[var(--mute)] truncate max-w-[100px] font-medium">
            {translateLeague(match.league_name, translateEnabled)}
          </span>
        </div>
        <FavoriteButton
          favoriteData={{ favorite_type: 'match', item_id: match.id, item_data: favoriteData }}
          size="sm"
        />
      </div>

      {/* Teams & Score */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[var(--canvas-soft)] flex-shrink-0 flex items-center justify-center">
              {match.team1.logo ? (
                <img src={match.team1.logo} alt="" className="w-4 h-4" />
              ) : (
                <span className="text-[10px] font-bold text-[var(--mute)]">{match.team1.name.charAt(0)}</span>
              )}
            </div>
            <span className="text-sm font-semibold text-[var(--ink)] truncate">
              {translateTeam(match.team1.name, translateEnabled)}
            </span>
          </div>
          <span className="text-xl font-[800] text-[var(--primary)] ml-2">{score1}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[var(--canvas-soft)] flex-shrink-0 flex items-center justify-center">
              {match.team2.logo ? (
                <img src={match.team2.logo} alt="" className="w-4 h-4" />
              ) : (
                <span className="text-[10px] font-bold text-[var(--mute)]">{match.team2.name.charAt(0)}</span>
              )}
            </div>
            <span className="text-sm font-semibold text-[var(--ink)] truncate">
              {translateTeam(match.team2.name, translateEnabled)}
            </span>
          </div>
          <span className="text-xl font-[800] text-[var(--primary)] ml-2">{score2}</span>
        </div>
      </div>

      {/* Odds */}
      <div className="mt-3 pt-3 border-t border-[var(--border)]">
        {hasValidOdds ? (
          <div className="flex gap-2">
            <OddButton label="П1" value={displayOdds.p1} outcome="home" matchData={betSlipMatchData} changed={oddsChanged} />
            {displayOdds.x > 0 && (
              <OddButton label="X" value={displayOdds.x} outcome="draw" matchData={betSlipMatchData} changed={oddsChanged} />
            )}
            <OddButton label="П2" value={displayOdds.p2} outcome="away" matchData={betSlipMatchData} changed={oddsChanged} />
          </div>
        ) : (
          <div className="text-center text-[11px] text-[var(--mute)]">Коэффициенты недоступны</div>
        )}
      </div>
    </div>
  )
}
