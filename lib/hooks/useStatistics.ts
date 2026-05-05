import { useQuery } from '@tanstack/react-query'
import {
  getBetStatistics,
  getSportStatistics,
  getLeagueStatistics,
  getProfitOverTime,
  BetStatistics,
  SportStatistics,
  LeagueStatistics,
  ProfitOverTime,
} from '../api/statistics'
import {
  analyzeBettingTrends,
  generateRecommendations,
  BettingTrend,
  BettingRecommendation,
} from '../api/trends'

/**
 * Хук для получения общей статистики ставок
 */
export function useBetStatistics() {
  return useQuery<BetStatistics>({
    queryKey: ['statistics', 'bets'],
    queryFn: getBetStatistics,
    staleTime: 2 * 60 * 1000, // 2 минуты
    gcTime: 5 * 60 * 1000, // 5 минут
  })
}

/**
 * Хук для получения статистики по видам спорта
 */
export function useSportStatistics() {
  return useQuery<SportStatistics[]>({
    queryKey: ['statistics', 'sports'],
    queryFn: getSportStatistics,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Хук для получения статистики по лигам
 */
export function useLeagueStatistics() {
  return useQuery<LeagueStatistics[]>({
    queryKey: ['statistics', 'leagues'],
    queryFn: getLeagueStatistics,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Хук для получения динамики прибыли
 */
export function useProfitOverTime() {
  return useQuery<ProfitOverTime[]>({
    queryKey: ['statistics', 'profit-over-time'],
    queryFn: getProfitOverTime,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Хук для получения трендов
 */
export function useBettingTrends() {
  return useQuery<BettingTrend[]>({
    queryKey: ['statistics', 'trends'],
    queryFn: analyzeBettingTrends,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Хук для получения рекомендаций
 */
export function useBettingRecommendations() {
  return useQuery<BettingRecommendation[]>({
    queryKey: ['statistics', 'recommendations'],
    queryFn: generateRecommendations,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
