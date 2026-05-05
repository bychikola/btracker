'use client'

import { useTodayMatches } from '@/lib/hooks/useSstatsMatches'
import { AllMatchesCard } from '@/components/all-matches-card'
import { VirtualizedMatchesList } from '@/components/virtualized-matches-list'
import { Match } from '@/lib/types'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

// Топовые лиги с приоритетом
const TOP_LEAGUES = [
  'UEFA Champions League',
  'Champions League',
  'UEFA Europa League',
  'Europa League',
  'Premier League',
  'English Premier League',
  'La Liga',
  'Spanish La Liga',
  'Serie A',
  'Italian Serie A',
  'Bundesliga',
  'German Bundesliga',
  'Ligue 1',
  'French Ligue 1',
  'Russian Premier League',
  'RPL',
]

// Определение приоритета лиги
function getLeaguePriority(leagueName: string): number {
  const index = TOP_LEAGUES.findIndex(topLeague =>
    leagueName.toLowerCase().includes(topLeague.toLowerCase())
  )
  return index === -1 ? 999 : index
}

// Группировка матчей по лигам
function groupMatchesByLeague(matches: Match[]) {
  const grouped = new Map<string, Match[]>()

  matches.forEach(match => {
    const leagueName = match.league_name
    if (!grouped.has(leagueName)) {
      grouped.set(leagueName, [])
    }
    grouped.get(leagueName)!.push(match)
  })

  return Array.from(grouped.entries())
    .map(([league, matches]) => ({
      league,
      matches: matches.sort((a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      ),
      priority: getLeaguePriority(league)
    }))
    .sort((a, b) => {
      // Сначала сортируем по приоритету
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      // Затем по алфавиту
      return a.league.localeCompare(b.league)
    })
}

function LeagueSection({ league, matches }: { league: string; matches: Match[] }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const useVirtualization = matches.length > 20 // Виртуализация для больших списков

  return (
    <div className="bg-card-bg rounded-xl border border-border overflow-hidden mb-4">
      {/* Заголовок лиги */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-card-hover hover:bg-opacity-80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">{league}</h3>
          <span className="text-xs text-text-secondary">({matches.length})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-text-secondary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-secondary" />
        )}
      </button>

      {/* Список матчей */}
      {isExpanded && (
        useVirtualization ? (
          <VirtualizedMatchesList matches={matches} />
        ) : (
          <div>
            {matches.map(match => (
              <AllMatchesCard key={match.id} match={match} />
            ))}
          </div>
        )
      )}
    </div>
  )
}

function MatchesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card-bg rounded-xl border border-border p-4 animate-pulse">
          <div className="h-6 w-48 bg-card-hover rounded mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-16 bg-card-hover rounded"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AllMatchesPage() {
  const { data, isLoading, error } = useTodayMatches({
    Limit: 1000
  })

  const groupedMatches = data?.matches ? groupMatchesByLeague(data.matches) : []

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">Все матчи</h1>

        {isLoading && <MatchesSkeleton />}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-500">
            Ошибка загрузки матчей. Попробуйте обновить страницу.
          </div>
        )}

        {!isLoading && !error && groupedMatches.length === 0 && (
          <div className="bg-card-bg rounded-xl border border-border p-8 text-center">
            <p className="text-text-secondary">Нет доступных матчей на сегодня</p>
          </div>
        )}

        {!isLoading && !error && groupedMatches.length > 0 && (
          <div>
            {groupedMatches.map(({ league, matches }) => (
              <LeagueSection key={league} league={league} matches={matches} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
