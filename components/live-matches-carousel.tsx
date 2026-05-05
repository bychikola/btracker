'use client'

import { useTodayMatches } from '@/lib/hooks/useSstatsMatches'
import { LiveMatchCard } from './live-match-card'
import { LiveOddsProvider } from '@/lib/contexts/live-odds-context'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRef } from 'react'
import { Match } from '@/lib/types'

// Топовые лиги
const TOP_LEAGUES = [
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
  'Champions League',
  'UEFA Champions League',
  'Europa League',
  'UEFA Europa League',
  'World Cup',
  'FIFA World Cup',
  'Euro',
  'UEFA European Championship',
  'Copa America',
  'Russian Premier League',
  'RPL',
]

// Топовые команды
const TOP_TEAMS = [
  'Manchester United', 'Manchester City', 'Liverpool', 'Chelsea', 'Arsenal',
  'Real Madrid', 'Barcelona', 'Atletico Madrid',
  'Bayern Munich', 'Bayern', 'Borussia Dortmund', 'Dortmund',
  'Juventus', 'Inter', 'Inter Milan', 'AC Milan', 'Milan', 'Napoli',
  'Paris Saint-Germain', 'PSG',
  'Zenit', 'Spartak Moscow', 'CSKA Moscow', 'Lokomotiv Moscow', 'Dynamo Moscow',
]

// Функция для определения приоритета матча
function getMatchPriority(match: Match): number {
  let priority = 0

  // Топовая лига = +100
  if (TOP_LEAGUES.some(league => match.league_name.includes(league))) {
    priority += 100
  }

  // Топовая команда = +50 за каждую
  if (TOP_TEAMS.some(team => match.team1.name.includes(team))) {
    priority += 50
  }
  if (TOP_TEAMS.some(team => match.team2.name.includes(team))) {
    priority += 50
  }

  // Live матч = +30
  if (match.is_live) {
    priority += 30
  }

  return priority
}

function LiveMatchSkeleton() {
  return (
    <div className="flex-shrink-0 w-80 bg-card-bg rounded-xl shadow-md border border-border p-4 snap-center animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-card-hover rounded-full"></div>
          <div className="h-4 w-12 bg-card-hover rounded"></div>
          <div className="h-4 w-16 bg-card-hover rounded"></div>
        </div>
        <div className="h-4 w-24 bg-card-hover rounded"></div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-full bg-card-hover"></div>
            <div className="h-4 w-32 bg-card-hover rounded"></div>
          </div>
          <div className="h-6 w-8 bg-card-hover rounded"></div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-full bg-card-hover"></div>
            <div className="h-4 w-32 bg-card-hover rounded"></div>
          </div>
          <div className="h-6 w-8 bg-card-hover rounded"></div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-card-hover rounded"></div>
          <div className="flex-1 h-10 bg-card-hover rounded"></div>
          <div className="flex-1 h-10 bg-card-hover rounded"></div>
        </div>
      </div>
    </div>
  )
}

export function LiveMatchesCarousel() {
  const { data: matchesData, isLoading } = useTodayMatches({ Live: true, Limit: 200 })
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Сортируем матчи по приоритету
  const matches = matchesData?.matches
    ? [...matchesData.matches]
        .map(match => ({ match, priority: getMatchPriority(match) }))
        .sort((a, b) => b.priority - a.priority) // От большего к меньшему
        .map(item => item.match)
        .slice(0, 30) // Показываем топ-30 матчей
    : []

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340 // ширина карточки + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  // Если загрузка
  if (isLoading) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Топ события</h2>
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <LiveMatchSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Если нет матчей, не показываем компонент
  if (!matches || matches.length === 0) {
    return null
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Топ события</h2>
        <Link
          href="/live"
          className="flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
        >
          Смотреть все ({matchesData?.matches?.length || 0})
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="relative">
        {/* Стрелка влево */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-card-bg/90 hover:bg-card-bg shadow-lg rounded-full transition-all"
          aria-label="Прокрутить влево"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>

        {/* Стрелка вправо */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-card-bg/90 hover:bg-card-bg shadow-lg rounded-full transition-all"
          aria-label="Прокрутить вправо"
        >
          <ChevronRight className="w-6 h-6 text-foreground" />
        </button>

        <LiveOddsProvider matches={matches}>
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 px-12"
          >
            {matches.map((match) => (
              <LiveMatchCard key={match.id} match={match} />
            ))}
          </div>
        </LiveOddsProvider>
      </div>
    </section>
  )
}
