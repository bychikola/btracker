'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Match } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { MatchDetailHeader } from '@/components/match-detail-header'
import { MainBets } from '@/components/main-bets'
import { useTranslation } from '@/lib/contexts/translation-context'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/axios'
import { ApiResponseOfApiSaGame, ApiSaGame } from '@/lib/types/api'

export default function MatchDetailPage() {
  const params = useParams()
  const matchId = params.id as string
  const [match, setMatch] = useState<Match | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { translateEnabled } = useTranslation()
  const queryClient = useQueryClient()

  useEffect(() => {
    loadMatchDetails()
  }, [matchId])

  const loadMatchDetails = async () => {
    setIsLoading(true)
    try {
      // Сначала пробуем найти матч в кэше React Query
      const cachedMatch = findMatchInCache()
      console.log('Cached match found:', cachedMatch)

      if (cachedMatch) {
        setMatch(cachedMatch)
        setIsLoading(false)
        return
      }

      // Если не нашли в кэше, пробуем несколько источников
      console.log('Fetching match from API, ID:', matchId)

      // Пробуем Live матчи
      let apiMatch = await fetchMatchFromSource({ Live: true })

      // Если не нашли, пробуем Upcoming
      if (!apiMatch) {
        apiMatch = await fetchMatchFromSource({ Upcoming: true })
      }

      // Если не нашли, пробуем все сегодняшние
      if (!apiMatch) {
        apiMatch = await fetchMatchFromSource({ Today: true })
      }

      if (apiMatch) {
        const transformedMatch = transformApiMatch(apiMatch)
        setMatch(transformedMatch)
      } else {
        console.error('Match not found in any source')
      }
    } catch (error) {
      console.error('Error loading match details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMatchFromSource = async (params: any): Promise<ApiSaGame | null> => {
    try {
      const response = await apiClient.get<ApiResponseOfApiSaGame>('/Games/list', {
        params: {
          ...params,
          Limit: 1000,
        }
      })

      if (response.data.status === 'OK' && response.data.data) {
        const found = response.data.data.find((m: ApiSaGame) => m.id === matchId)
        if (found) {
          console.log('Found match in source:', params, found)
        }
        return found || null
      }
      return null
    } catch (error) {
      console.error('Error fetching from source:', params, error)
      return null
    }
  }

  const findMatchInCache = (): Match | null => {
    // Ищем матч во всех закэшированных запросах матчей
    const queryCache = queryClient.getQueryCache()
    const queries = queryCache.findAll({ queryKey: ['matches'] })

    console.log('Searching in cache, total queries:', queries.length, 'Looking for ID:', matchId, 'Type:', typeof matchId)

    for (const query of queries) {
      const data = query.state.data as any
      if (data?.matches) {
        console.log('Checking query with', data.matches.length, 'matches')
        // Сравниваем как строки, так как ID может быть и строкой и числом
        const found = data.matches.find((m: Match) => String(m.id) === String(matchId))
        if (found) {
          console.log('Found match in cache:', found)
          return found
        }
      }
    }

    console.log('Match not found in cache')
    return null
  }

  const transformApiMatch = (apiMatch: ApiSaGame): Match => {
    const leagueName = apiMatch.season?.league?.name || 'Unknown League'
    const sportType = determineSportType(leagueName)
    const statusNum = parseInt(apiMatch.status)
    const isLive = [3, 4, 5, 6, 7, 11, 18, 19].includes(statusNum)
    const odds = extractOdds(apiMatch.odds)
    const elapsed = apiMatch.elapsed ? parseInt(apiMatch.elapsed) : undefined

    return {
      id: apiMatch.id,
      sport_type: sportType,
      league_name: leagueName,
      team1: {
        id: apiMatch.homeTeam?.id || '0',
        name: apiMatch.homeTeam?.name || 'Team 1',
        logo: apiMatch.homeTeam?.logoUrl || undefined,
      },
      team2: {
        id: apiMatch.awayTeam?.id || '0',
        name: apiMatch.awayTeam?.name || 'Team 2',
        logo: apiMatch.awayTeam?.logoUrl || undefined,
      },
      start_time: apiMatch.date || new Date().toISOString(),
      is_live: isLive,
      elapsed: elapsed,
      score: (apiMatch.homeResult !== undefined && apiMatch.awayResult !== undefined) ? {
        team1: parseInt(apiMatch.homeResult) || 0,
        team2: parseInt(apiMatch.awayResult) || 0,
      } : undefined,
      odds: odds,
      is_favorite: false,
    }
  }

  const determineSportType = (leagueName: string): string => {
    const name = leagueName.toLowerCase()
    if (name.includes('hockey') || name.includes('nhl') || name.includes('khl')) return 'hockey'
    if (name.includes('tennis') || name.includes('atp') || name.includes('wta')) return 'tennis'
    if (name.includes('basketball') || name.includes('nba') || name.includes('euroleague')) return 'basketball'
    if (name.includes('volleyball')) return 'volleyball'
    if (name.includes('esport') || name.includes('dota') || name.includes('cs:go') || name.includes('lol')) return 'esports'
    return 'football'
  }

  const extractOdds = (bets: any[]): { p1: number; x: number; p2: number } => {
    if (!bets || bets.length === 0) return { p1: 0, x: 0, p2: 0 }

    const mainMarket = bets.find(bet =>
      bet.marketName === 'Fulltime Result' ||
      bet.marketName === '1X2' ||
      bet.marketName === 'Match Winner' ||
      bet.marketId === '1'
    )

    if (!mainMarket || !mainMarket.odds) {
      const firstMarketWithOdds = bets.find(bet => bet.odds && bet.odds.length >= 2)
      if (!firstMarketWithOdds) return { p1: 0, x: 0, p2: 0 }

      const odds = { p1: 0, x: 0, p2: 0 }
      if (firstMarketWithOdds.odds[0]) odds.p1 = parseFloat(firstMarketWithOdds.odds[0].value) || 0
      if (firstMarketWithOdds.odds[1]) odds.x = parseFloat(firstMarketWithOdds.odds[1].value) || 0
      if (firstMarketWithOdds.odds[2]) odds.p2 = parseFloat(firstMarketWithOdds.odds[2].value) || 0
      return odds
    }

    const odds = { p1: 0, x: 0, p2: 0 }
    mainMarket.odds.forEach((price: any) => {
      const value = parseFloat(price.value) || 0
      const name = price.name?.toLowerCase() || ''
      if (name === '1' || name === 'home') odds.p1 = value
      else if (name === 'x' || name === 'draw') odds.x = value
      else if (name === '2' || name === 'away') odds.p2 = value
    })
    return odds
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-card-hover rounded w-1/4"></div>
            <div className="h-64 bg-card-hover rounded"></div>
            <div className="h-96 bg-card-hover rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Матч не найден</h1>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-black rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              На главную
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Кнопка назад */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад к матчам</span>
        </Link>

        {/* Header события */}
        <div className="mb-6">
          <MatchDetailHeader match={match} translateEnabled={translateEnabled} />
        </div>

        {/* Секция основных ставок */}
        <MainBets match={match} />
      </div>
    </div>
  )
}
