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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium mb-3">
            Ошибка загрузки матчей
          </p>
          <p className="text-sm text-red-600 mb-4">
            {error instanceof Error ? error.message : 'Не удалось загрузить данные'}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Повторить загрузку
          </button>
        </div>
      )}

      {/* Нет данных */}
      {!isLoading && !error && filteredMatches.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-600 text-lg">
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {currentMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </LiveOddsProvider>

          {/* Навигация */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 0}
                className="p-2 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed shadow rounded-full transition-colors"
                aria-label="Предыдущая страница"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>

              <span className="text-sm text-gray-600 font-medium">
                {currentPage + 1} / {totalPages}
              </span>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                className="p-2 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed shadow rounded-full transition-colors"
                aria-label="Следующая страница"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
