'use client'

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { fetchMatches, fetchLiveMatches, fetchUpcomingMatches, fetchLiveOdds, fetchMultipleLiveOdds } from '../api/sstats'
import { GetMatchesParams } from '../types/api'

/**
 * Хук для получения матчей за сегодня
 *
 * @param params - параметры фильтрации
 * @param options - дополнительные опции React Query
 */
export function useTodayMatches(
  params: Omit<GetMatchesParams, 'Today' | 'TimeZone'> = {},
  options: {
    enabled?: boolean
    refetchInterval?: number | false
  } = {}
) {
  const isLive = params.Live === true

  return useQuery({
    queryKey: ['matches', 'today', params],
    queryFn: () => fetchMatches({
      Today: true,
      ...params,
    }),
    // Автоматическое обновление для Live матчей
    refetchInterval: isLive ? (options.refetchInterval ?? 30000) : false,
    // Live матчи свежие 20 сек, обычные - 3 минуты
    staleTime: isLive ? 20000 : 3 * 60 * 1000,
    // Кэш Live матчей 1 мин, обычных - 5 минут
    gcTime: isLive ? 60000 : 5 * 60 * 1000,
    enabled: options.enabled ?? true,
  })
}

/**
 * Хук для получения только Live матчей
 * Автоматически обновляется каждые 30 секунд
 */
export function useLiveMatches(
  options: {
    enabled?: boolean
    refetchInterval?: number
  } = {}
) {
  return useQuery({
    queryKey: ['matches', 'live'],
    queryFn: async () => {
      const matches = await fetchLiveMatches()
      return { matches, total: matches.length, hasMore: false }
    },
    refetchInterval: options.refetchInterval ?? 30000,
    staleTime: 20000,
    gcTime: 60000, // Кэш 1 минута для live
    enabled: options.enabled ?? true,
  })
}

/**
 * Хук для получения предстоящих матчей
 */
export function useUpcomingMatches(
  options: {
    enabled?: boolean
  } = {}
) {
  return useQuery({
    queryKey: ['matches', 'upcoming'],
    queryFn: fetchUpcomingMatches,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // Кэш 10 минут
    enabled: options.enabled ?? true,
  })
}

/**
 * Хук для бесконечной прокрутки матчей
 * Используется когда нужна пагинация на UI
 */
export function useInfiniteMatches(
  params: Omit<GetMatchesParams, 'Today' | 'TimeZone' | 'Offset'> = {}
) {
  const isLive = params.Live === true

  return useInfiniteQuery({
    queryKey: ['matches', 'infinite', params],
    queryFn: ({ pageParam = 0 }) => fetchMatches({
      Today: true,
      Offset: pageParam,
      ...params,
    }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined
      return allPages.reduce((acc, page) => acc + page.matches.length, 0)
    },
    initialPageParam: 0,
    refetchInterval: isLive ? 30000 : false,
    staleTime: isLive ? 20000 : 3 * 60 * 1000,
    gcTime: isLive ? 60000 : 5 * 60 * 1000,
  })
}

/**
 * Хук для получения матчей с фильтрацией по виду спорта
 */
export function useMatchesBySport(
  sportType: string | null,
  params: Omit<GetMatchesParams, 'Today' | 'TimeZone'> = {}
) {
  const { data, ...rest } = useTodayMatches(params)

  // Фильтрация на клиенте по виду спорта
  const filteredMatches = sportType && sportType !== 'all' && data?.matches
    ? data.matches.filter(match => match.sport_type === sportType)
    : data?.matches

  return {
    data: filteredMatches ? {
      ...data,
      matches: filteredMatches,
    } : data,
    ...rest,
  }
}

/**
 * Хук для получения Live-коэффициентов конкретного матча
 * Автоматически обновляется каждые 2 минуты
 */
export function useLiveOdds(
  gameId: string | number | null,
  options: {
    enabled?: boolean
    refetchInterval?: number
  } = {}
) {
  return useQuery({
    queryKey: ['odds', 'live', gameId],
    queryFn: () => fetchLiveOdds(gameId!),
    refetchInterval: options.refetchInterval ?? 120000, // Обновление каждые 2 минуты (увеличено)
    staleTime: 60000,
    enabled: (options.enabled ?? true) && !!gameId,
    retry: 1, // Только одна повторная попытка
    retryDelay: 5000, // Задержка перед повтором 5 секунд
  })
}

/**
 * Хук для получения Live-коэффициентов для нескольких матчей
 * Использует оптимизированный подход: сначала проверяет обновления, затем запрашивает только изменившиеся
 * Автоматически обновляется каждые 2 минуты
 */
export function useMultipleLiveOdds(
  gameIds: (string | number)[],
  options: {
    enabled?: boolean
    refetchInterval?: number
  } = {}
) {
  return useQuery({
    queryKey: ['odds', 'live', 'multiple', gameIds.sort().join(',')],
    queryFn: () => fetchMultipleLiveOdds(gameIds),
    refetchInterval: options.refetchInterval ?? 120000, // Обновление каждые 2 минуты (увеличено)
    staleTime: 60000,
    enabled: (options.enabled ?? true) && gameIds.length > 0,
    retry: 1, // Только одна повторная попытка
    retryDelay: 5000, // Задержка перед повтором 5 секунд
  })
}
