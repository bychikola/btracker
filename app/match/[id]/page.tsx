'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { fetchFullMatchById, fetchPrematchOdds } from '@/lib/api/sstats'
import { transformApiMatch } from '@/lib/api/transformers'
import {
  ApiSaGameFull, ApiSaStatistics, ApiSaLineupPlayer,
  ApiSaEvent, ApiSaBookmakerOdds, ApiSaBet, Price
} from '@/lib/types/api'
import { Match } from '@/lib/types'
import { MatchDetailHeader } from '@/components/match-detail-header'
import { MainBets } from '@/components/main-bets'
import { useTranslation } from '@/lib/contexts/translation-context'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/axios'
import { ApiResponseOfApiSaGame, ApiSaGame } from '@/lib/types/api'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { AllBookmakerOdds } from '@/components/all-bookmaker-odds'

type PageState = 'loading' | 'error' | 'not_found' | 'ready'

// Группировка статистики по категориям для отображения
const STAT_GROUPS: { label: string; keys: [string, string][] }[] = [
  {
    label: 'Удары',
    keys: [['totalShotsHome', 'totalShotsAway'], ['shotsOnGoalHome', 'shotsOnGoalAway'],
           ['shotsOffGoalHome', 'shotsOffGoalAway'], ['blockedShotsHome', 'blockedShotsAway'],
           ['shotsInsideBoxHome', 'shotsInsideBoxAway'], ['shotsOutsideBoxHome', 'shotsOutsideBoxAway']]
  },
  {
    label: 'xG',
    keys: [['expectedGoalsHome', 'expectedGoalsAway'], ['expectedAssistsHome', 'expectedAssistsAway'],
           ['bigChancesHome', 'bigChancesAway'], ['hitTheWoodworkHome', 'hitTheWoodworkAway']]
  },
  {
    label: 'Владение и пасы',
    keys: [['ballPossessionHome', 'ballPossessionAway'], ['totalPassesHome', 'totalPassesAway'],
           ['passesAccurateHome', 'passesAccurateAway'], ['longPassesHome', 'longPassesAway'],
           ['crossesHome', 'crossesAway'], ['passesInFinalThirdHome', 'passesInFinalThirdAway']]
  },
  {
    label: 'Защита',
    keys: [['totalTacklesHome', 'totalTacklesAway'], ['successTacklesHome', 'successTacklesAway'],
           ['duelsWonHome', 'duelsWonAway'], ['clearancesHome', 'clearancesAway'],
           ['interceptionsHome', 'interceptionsAway'], ['goalkeeperSavesHome', 'goalkeeperSavesAway']]
  },
  {
    label: 'Дисциплина',
    keys: [['yellowCardsHome', 'yellowCardsAway'], ['redCardsHome', 'redCardsAway'],
           ['foulsHome', 'foulsAway'], ['offsidesHome', 'offsidesAway']]
  },
]

const STAT_LABELS: Record<string, string> = {
  totalShotsHome: 'Всего ударов', shotsOnGoalHome: 'В створ', shotsOffGoalHome: 'Мимо',
  blockedShotsHome: 'Заблокировано', shotsInsideBoxHome: 'Из штрафной', shotsOutsideBoxHome: 'Из-за штрафной',
  expectedGoalsHome: 'xG', expectedAssistsHome: 'xA', bigChancesHome: 'Голевые моменты',
  hitTheWoodworkHome: 'В каркас', ballPossessionHome: 'Владение %',
  totalPassesHome: 'Пасы', passesAccurateHome: 'Точные пасы', longPassesHome: 'Длинные передачи',
  crossesHome: 'Кроссы', passesInFinalThirdHome: 'Пасы в финальной трети',
  totalTacklesHome: 'Отборы', successTacklesHome: 'Успешные отборы', duelsWonHome: 'Выиграно единоборств',
  clearancesHome: 'Выносы', interceptionsHome: 'Перехваты', goalkeeperSavesHome: 'Сейвы',
  yellowCardsHome: 'ЖК', redCardsHome: 'КК', foulsHome: 'Фолы', offsidesHome: 'Офсайды',
  events: 'События', glicko: 'Прогноз Glicko', odds: 'Коэффициенты'
}

function getStatLabel(key: string): string {
  const cleaned = key.replace(/Home$/, '').replace(/Away$/, '')
  return STAT_LABELS[cleaned] || STAT_LABELS[key] || cleaned
}

function getStatValue(stats: ApiSaStatistics | null | undefined, key: string): string {
  if (!stats) return '-'
  const val = (stats as any)[key]
  if (val === null || val === undefined) return '-'
  if (key.includes('ballPossession')) return `${val}%`
  if (key.includes('expectedGoals') || key.includes('expectedAssists')) return Number(val).toFixed(2)
  return String(val)
}

function getEventIcon(type: number) {
  switch (type) {
    case 1: return '⚽'
    case 2:
    case 3: return '🔄'
    case 4: return '📺'
    default: return '•'
  }
}

function getEventColor(type: number, name: string) {
  if (name.includes('Goal') || type === 1) return 'text-[var(--positive)]'
  if (name.includes('Yellow')) return 'text-yellow-500'
  if (name.includes('Red')) return 'text-[var(--negative)]'
  return 'text-[var(--mute)]'
}

export default function MatchDetailPage() {
  const params = useParams()
  const matchId = params.id as string
  const [fullData, setFullData] = useState<ApiSaGameFull | null>(null)
  const [match, setMatch] = useState<Match | null>(null)
  const [pageState, setPageState] = useState<PageState>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'stats' | 'lineups' | 'events' | 'odds'>('stats')
  const [allOdds, setAllOdds] = useState<ApiSaBookmakerOdds[]>([])
  const { translateEnabled } = useTranslation()
  const queryClient = useQueryClient()

  const loadMatch = useCallback(async () => {
    setPageState('loading')
    setErrorMessage('')

    try {
      // 1. Кэш
      const cachedMatch = findMatchInCache()
      if (cachedMatch) {
        setMatch(cachedMatch)
      }

      // 2. Полные данные одним запросом: матч + статистика + составы + события + игроки
      const full = await fetchFullMatchById(matchId)
      if (full) {
        setFullData(full)
        const gameData = full.game
        const transformed = transformApiMatch(gameData)
        setMatch(transformed)
        setPageState('ready')

        // 3. Подгружаем все коэффициенты всех букмекеров (параллельно, не блокируем)
        fetchPrematchOdds(matchId).then(setAllOdds).catch(() => {})
        return
      }

      // 4. Fallback: ищем через списки
      const apiMatch = await searchMatchInLists()
      if (apiMatch) {
        setMatch(transformApiMatch(apiMatch))
        setPageState('ready')
        return
      }

      setPageState('not_found')
    } catch (error) {
      console.error('Error loading match:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Ошибка загрузки матча')
      setPageState('error')
    }
  }, [matchId])

  useEffect(() => { loadMatch() }, [loadMatch])

  const findMatchInCache = (): Match | null => {
    const queryCache = queryClient.getQueryCache()
    const queries = queryCache.findAll({ queryKey: ['matches'] })
    for (const query of queries) {
      const data = query.state.data as any
      if (data?.matches) {
        const found = data.matches.find((m: Match) => String(m.id) === String(matchId))
        if (found) return found
      }
    }
    return null
  }

  const searchMatchInLists = async (): Promise<ApiSaGame | null> => {
    for (const source of [{ Live: true }, { Upcoming: true }, { Today: true }]) {
      try {
        const response = await apiClient.get<ApiResponseOfApiSaGame>('/Games/list', {
          params: { ...source, Limit: 500 }
        })
        if (response.data.status === 'OK' && response.data.data) {
          const found = response.data.data.find((m: ApiSaGame) => String(m.id) === String(matchId))
          if (found) return found
        }
      } catch { continue }
    }
    return null
  }

  // ─── Loading ───
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[var(--canvas)] rounded-[var(--radius-md)] w-1/4" />
            <div className="h-64 bg-[var(--canvas)] rounded-[var(--radius-xl)]" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-48 bg-[var(--canvas)] rounded-[var(--radius-xl)]" />
              <div className="h-48 bg-[var(--canvas)] rounded-[var(--radius-xl)]" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Error ───
  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-[800] text-[var(--ink)] mb-2">Ошибка загрузки</h1>
          <p className="text-[var(--body)] mb-6">{errorMessage}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={loadMatch} className="wise-btn-primary px-6 py-3">
              <RefreshCw className="w-4 h-4" /> Повторить
            </button>
            <Link href="/" className="wise-btn-outline px-6 py-3">
              <ArrowLeft className="w-4 h-4" /> На главную
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── Not Found ───
  if (pageState === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-[800] text-[var(--ink)] mb-2">Матч не найден</h1>
          <p className="text-[var(--body)] mb-6">Возможно, матч был удалён или ещё не добавлен</p>
          <Link href="/" className="wise-btn-primary px-6 py-3">
            <ArrowLeft className="w-4 h-4" /> На главную
          </Link>
        </div>
      </div>
    )
  }

  // ─── Ready ───
  const stats = fullData?.statistics
  const lineups = fullData?.lineups
  const lineupPlayers = fullData?.lineupPlayers
  const playerStats = fullData?.playerStats
  const events = fullData?.events
  const venue = fullData?.venue
  const referee = fullData?.refereeName

  // Разделение игроков на домашних/гостевых
  const homePlayers = lineupPlayers?.filter(p => p.teamId === Number(match?.team1?.id)) || []
  const awayPlayers = lineupPlayers?.filter(p => p.teamId === Number(match?.team2?.id)) || []

  return (
    <div className="min-h-screen pb-20">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--body)] hover:text-[var(--ink)] transition-colors mb-4 text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Назад к матчам
        </Link>

        {/* Match Header */}
        <div className="mb-6">
          <MatchDetailHeader match={match!} translateEnabled={translateEnabled} />
        </div>

        {/* Bet buttons */}
        <div className="mb-6">
          <MainBets match={match!} />
        </div>

        {/* Venue + Referee */}
        {(venue?.name || referee) && (
          <div className="flex items-center gap-4 text-xs text-[var(--mute)] mb-6">
            {venue?.name && <span>🏟 {[venue.name, venue.city].filter(Boolean).join(', ')}{venue.capacity ? ` (${venue.capacity.toLocaleString()})` : ''}</span>}
            {referee && <span>👨‍⚖️ {referee}</span>}
          </div>
        )}

        {/* Tabs: Stats / Lineups / Events / Odds */}
        <div className="flex gap-1 mb-4 bg-[var(--canvas-soft)] rounded-[var(--radius-xl)] p-1 overflow-x-auto">
          {[
            ['stats', '📊 Статистика'],
            ['lineups', '👥 Составы'],
            ['events', '⏱ События'],
            ['odds', '💰 Коэффициенты'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === key
                  ? 'bg-[var(--canvas)] text-[var(--ink)] shadow-sm'
                  : 'text-[var(--body)] hover:text-[var(--ink)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* ─── STATISTICS ─── */}
          {activeTab === 'stats' && (
            stats ? (
              <div className="space-y-4">
                {STAT_GROUPS.map(group => {
                  const hasData = group.keys.some(([h]) => (stats as any)[h] !== undefined && (stats as any)[h] !== null)
                  if (!hasData) return null
                  return (
                    <Card key={group.label} padding="md">
                      <h3 className="text-sm font-[800] text-[var(--ink)] mb-3 uppercase tracking-wide">{group.label}</h3>
                      <div className="space-y-2">
                        {group.keys.map(([homeKey, awayKey]) => {
                          const homeVal = getStatValue(stats, homeKey)
                          const awayVal = getStatValue(stats, awayKey)
                          if (homeVal === '-' && awayVal === '-') return null
                          const hNum = parseFloat(homeVal) || 0
                          const aNum = parseFloat(awayVal) || 0
                          const total = hNum + aNum
                          const hPct = total > 0 ? (hNum / total) * 100 : 50
                          return (
                            <div key={homeKey} className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-[var(--ink)] w-12 text-right tabular-nums">{homeVal}</span>
                              <div className="flex-1 h-2 bg-[var(--canvas-soft)] rounded-full overflow-hidden flex">
                                <div className="h-full bg-[var(--primary)] rounded-full transition-all" style={{ width: `${hPct}%` }} />
                              </div>
                              <span className="text-sm font-semibold text-[var(--ink)] w-12 tabular-nums">{awayVal}</span>
                              <span className="text-[10px] text-[var(--mute)] w-24 text-center hidden sm:block">{getStatLabel(homeKey)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card padding="md" className="text-center text-[var(--mute)] text-sm">Нет данных статистики для этого матча</Card>
            )
          )}

          {/* ─── LINEUPS ─── */}
          {activeTab === 'lineups' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { players: homePlayers, name: match?.team1?.name || 'Хозяева', formation: lineups?.homeFormation, coach: lineups?.homeCoach },
                { players: awayPlayers, name: match?.team2?.name || 'Гости', formation: lineups?.awayFormation, coach: lineups?.awayCoach },
              ].map(({ players, name, formation, coach }) => (
                <Card key={name} padding="md">
                  <h3 className="text-base font-[800] text-[var(--ink)] mb-1 truncate">{name}</h3>
                  {formation && <p className="text-xs text-[var(--mute)] mb-3">Схема: {formation}</p>}
                  {coach && <p className="text-xs text-[var(--body)] mb-3">Тренер: {coach.name}</p>}

                  {players.length > 0 ? (
                    <div className="space-y-1">
                      {['G', 'D', 'M', 'F'].map(pos => {
                        const posPlayers = players.filter(p => p.position === pos)
                        if (posPlayers.length === 0) return null
                        const posLabel = { G: 'Вратари', D: 'Защитники', M: 'Полузащитники', F: 'Нападающие' }[pos]
                        return (
                          <div key={pos} className="mb-2">
                            <span className="text-[10px] font-semibold text-[var(--mute)] uppercase">{posLabel}</span>
                            {posPlayers.map(p => {
                              const pStats = playerStats?.find(s => s.playerId === p.playerId)
                              return (
                                <div key={p.playerId} className="flex items-center gap-2 py-1.5 border-b border-[var(--border)] last:border-0">
                                  <span className="text-xs font-semibold text-[var(--mute)] w-6">{p.number || '-'}</span>
                                  <span className="text-sm font-medium text-[var(--ink)] flex-1">{p.playerName}</span>
                                  {pStats?.rating && (
                                    <span className="text-xs font-[800] text-[var(--primary)]">{pStats.rating.toFixed(1)}</span>
                                  )}
                                  {!p.startXI && p.startXI !== null && (
                                    <Badge variant="neutral" size="sm">Запасной</Badge>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--mute)]">Нет данных о составе</p>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* ─── EVENTS ─── */}
          {activeTab === 'events' && (
            events && events.length > 0 ? (
              <Card padding="md">
                <div className="space-y-1">
                  {events.map(evt => {
                    const isHome = evt.teamId === Number(match?.team1?.id)
                    return (
                      <div key={evt.id} className={`flex items-center gap-3 py-2 px-3 rounded-[var(--radius-md)] ${isHome ? 'flex-row' : 'flex-row-reverse text-right'}`}>
                        <span className="text-lg">{getEventIcon(evt.type)}</span>
                        <div className={isHome ? '' : 'text-right'}>
                          <span className={`text-sm font-semibold ${getEventColor(evt.type, evt.name)}`}>
                            {evt.name}
                          </span>
                          <span className="text-xs text-[var(--body)] ml-2">{evt.player?.name}</span>
                          {evt.assistPlayer && (
                            <span className="text-xs text-[var(--mute)] ml-1">({evt.assistPlayer.name})</span>
                          )}
                        </div>
                        <span className="text-xs font-[800] text-[var(--mute)] ml-auto">{evt.elapsed}'{evt.extra ? `+${evt.extra}` : ''}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            ) : (
              <Card padding="md" className="text-center text-[var(--mute)] text-sm">Нет данных о событиях матча</Card>
            )
          )}

          {/* ─── ODDS ─── */}
          {activeTab === 'odds' && (
            <AllBookmakerOdds match={match!} bookmakerOdds={allOdds} />
          )}
        </div>
      </div>
    </div>
  )
}
