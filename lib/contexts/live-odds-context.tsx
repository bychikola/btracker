'use client'

import { createContext, useContext, ReactNode, useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { useMultipleLiveOdds } from '../hooks/useSstatsMatches'
import { fetchMultipleLiveOdds } from '../api/sstats'
import { Match } from '../types'

interface LiveOddsEntry {
  elapsed: string
  odds: { p1: number; x: number; p2: number }
}

interface LiveOddsContextValue {
  getOdds: (gameId: string | number) => LiveOddsEntry | null
  isLoading: boolean
  changedIds: Set<string>
}

const LiveOddsContext = createContext<LiveOddsContextValue | null>(null)

interface LiveOddsProviderProps {
  children: ReactNode
  matches: Match[]
}

export function LiveOddsProvider({ children, matches }: LiveOddsProviderProps) {
  const liveGameIds = useMemo(
    () => matches.filter(match => match.is_live).map(match => match.id),
    [matches]
  )

  // Быстрый опрос: каждые 30 секунд
  const { data: oddsMap, isLoading, dataUpdatedAt } = useMultipleLiveOdds(liveGameIds, {
    enabled: liveGameIds.length > 0,
    refetchInterval: 30000,
  })

  // Храним предыдущие коэффициенты для сравнения
  const prevOddsRef = useRef<Map<string, LiveOddsEntry>>(new Map())
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set())

  // Определяем изменившиеся коэффициенты при каждом обновлении
  useEffect(() => {
    if (!oddsMap || oddsMap.size === 0) return

    const newChanged = new Set<string>()

    oddsMap.forEach((newOdds, gameId) => {
      const prev = prevOddsRef.current.get(gameId)
      if (!prev) {
        // Первое получение — не считаем изменением
        prevOddsRef.current.set(gameId, newOdds)
        return
      }

      // Сравниваем коэффициенты с погрешностью 0.01
      const delta = 0.01
      if (
        Math.abs(prev.odds.p1 - newOdds.odds.p1) > delta ||
        Math.abs(prev.odds.x - newOdds.odds.x) > delta ||
        Math.abs(prev.odds.p2 - newOdds.odds.p2) > delta
      ) {
        newChanged.add(gameId)
      }

      prevOddsRef.current.set(gameId, newOdds)
    })

    if (newChanged.size > 0) {
      setChangedIds(new Set(newChanged))

      // Через 4 секунды убираем подсветку
      const timer = setTimeout(() => setChangedIds(new Set()), 4000)
      return () => clearTimeout(timer)
    }
  }, [dataUpdatedAt])

  const getOdds = useCallback((gameId: string | number) => {
    if (!oddsMap) return null
    return oddsMap.get(gameId.toString()) || null
  }, [oddsMap])

  const contextValue = useMemo(
    () => ({ getOdds, isLoading, changedIds }),
    [getOdds, isLoading, changedIds]
  )

  return (
    <LiveOddsContext.Provider value={contextValue}>
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
