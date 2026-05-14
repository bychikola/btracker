'use client'

import { useTodayMatches } from '@/lib/hooks/useSstatsMatches'
import { MatchCard } from './match-card'
import { MatchCardSkeleton } from './match-card-skeleton'
import { LiveOddsProvider } from '@/lib/contexts/live-odds-context'
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface TodayMatchesGridProps {
  limit?: number
  showLiveOnly?: boolean
  sportType?: string
}

export function TodayMatchesGrid({
  limit = 20,
  showLiveOnly = false,
  sportType = 'all'
}: TodayMatchesGridProps) {
  const { data, isLoading, error, refetch } = useTodayMatches({
    Limit: limit,
    ...(showLiveOnly ? { Live: true } : { Upcoming: true }), // Либо Live, либо Upcoming
  })

  const [currentPage, setCurrentPage] = useState(0)

  const matchesPerPage = 8

  // Фильтрация по виду спорта на клиенте
  const filteredMatches = data?.matches.filter((match) => {
    return sportType === 'all' || match.sport_type === sportType
  }) || []

  const totalPages = Math.ceil(filteredMatches.length / matchesPerPage)
  const currentMatches = filteredMatches.slice(
    currentPage * matchesPerPage,
    (currentPage + 1) * matchesPerPage
  )

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Сброс страницы при изменении фильтров
  useEffect(() => {
    setCurrentPage(0)
  }, [sportType, showLiveOnly])

  return (
    <div>
      {/* Состояние загрузки */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="glass border border-border rounded-xl p-4 sm:p-6 text-center">
          <p className="text-accent font-medium mb-2 sm:mb-3 text-sm sm:text-base">
            Ошибка загрузки матчей
          </p>
          <p className="text-xs sm:text-sm text-text-secondary mb-3 sm:mb-4">
            {error instanceof Error ? error.message : 'Не удалось загрузить данные'}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-lg hover:bg-accent-hover transition-colors text-sm touch-manipulation"
          >
            <RefreshCw className="w-4 h-4" />
            Повторить загрузку
          </button>
        </div>
      )}

      {/* Нет данных */}
      {!isLoading && !error && filteredMatches.length === 0 && (
        <div className="glass border border-border rounded-xl p-8 sm:p-12 text-center">
          <p className="text-text-secondary text-sm sm:text-base">
            {showLiveOnly
              ? 'Сейчас нет Live матчей'
              : sportType !== 'all'
              ? `Нет матчей по виду спорта "${sportType}"`
              : 'На сегодня матчей не найдено'
            }
          </p>
        </div>
      )}

      {/* Сетка матчей с провайдером для батч-запросов коэффициентов */}
      {!isLoading && !error && filteredMatches.length > 0 && (
        <div>
          <LiveOddsProvider matches={currentMatches}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {currentMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </LiveOddsProvider>

          {/* Навигация */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4 sm:mt-6">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 0}
                className="p-2 bg-card-bg hover:bg-card-hover disabled:opacity-50 disabled:cursor-not-allowed shadow rounded-full transition-colors touch-manipulation"
                aria-label="Предыдущая страница"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>

              <span className="text-xs sm:text-sm text-text-secondary font-medium">
                {currentPage + 1} / {totalPages}
              </span>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                className="p-2 bg-card-bg hover:bg-card-hover disabled:opacity-50 disabled:cursor-not-allowed shadow rounded-full transition-colors touch-manipulation"
                aria-label="Следующая страница"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
