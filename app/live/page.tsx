'use client'

import { useLiveMatches } from '@/lib/hooks/useSstatsMatches'
import { MatchCard } from '@/components/match-card'
import { MatchCardSkeleton } from '@/components/match-card-skeleton'
import { LiveOddsProvider } from '@/lib/contexts/live-odds-context'
import { ArrowLeft, RefreshCw, Zap } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function LivePage() {
  const { data: matchesData, isLoading, error, refetch } = useLiveMatches()
  const matches = matchesData?.matches || []

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 hover:bg-[var(--canvas-soft)] rounded-[var(--radius-full)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--mute)]" />
            </Link>
            <div>
              <h1 className="text-[28px] sm:text-[32px] font-[900] text-[var(--ink)] tracking-tight flex items-center gap-2">
                <Zap className="w-6 h-6 text-[var(--primary)]" />
                Live
              </h1>
              <p className="text-sm text-[var(--body)]">
                {matches.length > 0
                  ? `${matches.length} ${matches.length === 1 ? 'матч' : matches.length < 5 ? 'матча' : 'матчей'} прямо сейчас`
                  : 'Прямые трансляции'}
              </p>
            </div>
          </div>

          {matches.length > 0 && (
            <button
              onClick={() => refetch()}
              className="p-2 hover:bg-[var(--canvas-soft)] rounded-[var(--radius-full)] transition-colors"
              title="Обновить"
            >
              <RefreshCw className="w-5 h-5 text-[var(--mute)]" />
            </button>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <Card padding="lg" className="text-center">
            <p className="text-[var(--primary)] font-semibold mb-2">Ошибка загрузки Live-матчей</p>
            <p className="text-sm text-[var(--body)] mb-4">
              {error instanceof Error ? error.message : 'Не удалось загрузить данные'}
            </p>
            <Button variant="primary" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" /> Повторить
            </Button>
          </Card>
        )}

        {/* Empty */}
        {!isLoading && !error && matches.length === 0 && (
          <Card padding="lg" className="text-center">
            <div className="w-16 h-16 bg-[var(--canvas-soft)] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚽</span>
            </div>
            <h3 className="text-xl font-[800] text-[var(--ink)] mb-2">Сейчас нет Live-матчей</h3>
            <p className="text-sm text-[var(--body)] mb-6">Все матчи завершены или ещё не начались</p>
            <Link href="/">
              <Button variant="primary">
                <ArrowLeft className="w-4 h-4" /> Вернуться на главную
              </Button>
            </Link>
          </Card>
        )}

        {/* Matches grid with live odds */}
        {!isLoading && !error && matches.length > 0 && (
          <LiveOddsProvider matches={matches}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </LiveOddsProvider>
        )}

        {/* Auto-refresh hint */}
        {!isLoading && matches.length > 0 && (
          <div className="text-center">
            <p className="text-xs text-[var(--mute)]">
              Коэффициенты обновляются каждые 30 секунд с подсветкой изменений
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
