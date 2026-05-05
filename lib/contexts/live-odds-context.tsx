'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useMultipleLiveOdds } from '../hooks/useSstatsMatches'
import { Match } from '../types'

interface LiveOddsContextValue {
  getOdds: (gameId: string | number) => { elapsed: string; odds: { p1: number; x: number; p2: number } } | null
  isLoading: boolean
}

const LiveOddsContext = createContext<LiveOddsContextValue | null>(null)

interface LiveOddsProviderProps {
  children: ReactNode
  matches: Match[]
}

export function LiveOddsProvider({ children, matches }: LiveOddsProviderProps) {
  // Собираем ID всех live матчей
  const liveGameIds = matches
    .filter(match => match.is_live)
    .map(match => match.id)

  // Делаем один батч-запрос для всех live матчей
  const { data: oddsMap, isLoading } = useMultipleLiveOdds(liveGameIds, {
    enabled: liveGameIds.length > 0,
  })

  const getOdds = (gameId: string | number) => {
    if (!oddsMap) return null
    return oddsMap.get(gameId.toString()) || null
  }

  return (
    <LiveOddsContext.Provider value={{ getOdds, isLoading }}>
      {children}
    </LiveOddsContext.Provider>
  )
}

export function useLiveOddsContext() {
  const context = useContext(LiveOddsContext)
  if (!context) {
    throw new Error('useLiveOddsContext must be used within LiveOddsProvider')
  }
  return context
}
