'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { favoritesApi, betsApi } from '../supabase/database'
import { useAuth } from '../contexts/auth-context-supabase'

// ==================== Избранные матчи ====================

export function useFavorites() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesApi.getFavorites,
    enabled: isAuthenticated,
  })
}

export function useAddFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (matchId: string) => favoritesApi.addFavorite(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (matchId: string) => favoritesApi.removeFavorite(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}

export function useIsFavorite(matchId: string) {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['favorite', matchId],
    queryFn: () => favoritesApi.isFavorite(matchId),
    enabled: isAuthenticated && !!matchId,
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()

  return async (matchId: string, isFavorite: boolean) => {
    if (isFavorite) {
      await removeFavorite.mutateAsync(matchId)
    } else {
      await addFavorite.mutateAsync(matchId)
    }
    queryClient.invalidateQueries({ queryKey: ['favorite', matchId] })
  }
}

// ==================== История ставок ====================

export function useBetHistory() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['betHistory'],
    queryFn: betsApi.getBetHistory,
    enabled: isAuthenticated,
  })
}

export function useCreateBet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      matchId,
      betType,
      odds,
      amount,
    }: {
      matchId: string
      betType: 'p1' | 'x' | 'p2'
      odds: number
      amount: number
    }) => betsApi.createBet(matchId, betType, odds, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['betHistory'] })
      queryClient.invalidateQueries({ queryKey: ['betStats'] })
    },
  })
}

export function useBetStats() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['betStats'],
    queryFn: betsApi.getBetStats,
    enabled: isAuthenticated,
  })
}
