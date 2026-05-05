'use client'

import { useLiveMatches } from '@/lib/hooks/useSstatsMatches'
import { MatchCard } from '@/components/match-card'
import { MatchCardSkeleton } from '@/components/match-card-skeleton'
import { LiveOddsProvider } from '@/lib/contexts/live-odds-context'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function LivePage() {
  const { data: matchesData, isLoading, error, refetch } = useLiveMatches()
  const matches = matchesData?.matches || []

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Шапка */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                Live события
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Матчи, которые идут прямо сейчас
              </p>
            </div>
          </div>

          {matches && matches.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {matches.length} {matches.length === 1 ? 'матч' : matches.length < 5 ? 'матча' : 'матчей'}
              </span>
              <button
                onClick={() => refetch()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Обновить"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>

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
              Ошибка загрузки Live-матчей
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

        {/* Нет Live-матчей */}
        {!isLoading && !error && (!matches || matches.length === 0) && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚽</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Сейчас нет Live-матчей
            </h3>
            <p className="text-gray-600 mb-6">
              Все матчи завершены или еще не начались
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Вернуться на главную
            </Link>
          </div>
        )}

        {/* Сетка матчей с провайдером для батч-запросов коэффициентов */}
        {!isLoading && !error && matches && matches.length > 0 && (
          <LiveOddsProvider matches={matches}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </LiveOddsProvider>
        )}

        {/* Информация об автообновлении */}
        {!isLoading && matches && matches.length > 0 && (
          <div className="text-center text-sm text-gray-500">
            Страница автоматически обновляется каждые 30 секунд
          </div>
        )}
      </div>
    </div>
  )
}
