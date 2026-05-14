'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { getBetSlipHistory } from '@/lib/api/bet-slip'
import { BetSlipWithItems, BetSlipStatus, BET_OUTCOME_LABELS, BET_TYPE_LABELS, BET_SLIP_STATUS_LABELS } from '@/lib/types/bet-slip'
import { BetStatusActions } from '@/components/bet-status-actions'
import { BetSlipStatusHistoryComponent } from '@/components/bet-slip-status-history'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { translateTeam, translateLeague } from '@/lib/translations'
import { useTranslation } from '@/lib/contexts/translation-context'
import Link from 'next/link'
import { ShoppingCart, Clock, ArrowUpDown, CheckSquare, Square } from 'lucide-react'
import { PendingBetsBadge } from '@/components/pending-bets-badge'
import { LiveAnalytics } from '@/components/live-analytics'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { updateBetSlipStatus } from '@/lib/api/bet-slip'
import { Badge } from '@/components/ui/badge'
import { BetSlipShare } from '@/components/bet-slip-share'

type SortOption = 'date-desc' | 'date-asc' | 'stake-desc' | 'stake-asc' | 'odds-desc' | 'odds-asc' | 'win-desc' | 'win-asc'

export default function BetsPage() {
  const { isAuthenticated } = useAuth()
  const { translateEnabled } = useTranslation()
  const [betSlips, setBetSlips] = useState<BetSlipWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<BetSlipStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [selectedBets, setSelectedBets] = useState<Set<string>>(new Set())
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory()
    }
  }, [isAuthenticated])

  const loadHistory = async () => {
    setIsLoading(true)
    try {
      const data = await getBetSlipHistory()
      setBetSlips(data)
    } catch (error) {
      console.error('Error loading bet slip history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredBetSlips = selectedStatus === 'all'
    ? betSlips
    : betSlips.filter(slip => slip.status === selectedStatus)

  const sortedBetSlips = [...filteredBetSlips].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.placed_at || b.created_at).getTime() - new Date(a.placed_at || a.created_at).getTime()
      case 'date-asc':
        return new Date(a.placed_at || a.created_at).getTime() - new Date(b.placed_at || b.created_at).getTime()
      case 'stake-desc': return b.stake_amount - a.stake_amount
      case 'stake-asc': return a.stake_amount - b.stake_amount
      case 'odds-desc': return b.total_odds - a.total_odds
      case 'odds-asc': return a.total_odds - b.total_odds
      case 'win-desc': return b.potential_win - a.potential_win
      case 'win-asc': return a.potential_win - b.potential_win
      default: return 0
    }
  })

  const stats = {
    total: betSlips.length,
    placed: betSlips.filter(s => s.status === 'placed').length,
    won: betSlips.filter(s => s.status === 'won').length,
    lost: betSlips.filter(s => s.status === 'lost').length,
  }

  const toggleBetSelection = (betId: string) => {
    const newSelected = new Set(selectedBets)
    if (newSelected.has(betId)) {
      newSelected.delete(betId)
    } else {
      newSelected.add(betId)
    }
    setSelectedBets(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedBets.size === filteredBetSlips.filter(b => b.status === 'placed').length) {
      setSelectedBets(new Set())
    } else {
      setSelectedBets(new Set(filteredBetSlips.filter(b => b.status === 'placed').map(b => b.id)))
    }
  }

  const handleBulkStatusUpdate = async (status: 'won' | 'lost' | 'cancelled') => {
    if (selectedBets.size === 0) return
    const statusLabel = status === 'won' ? 'выигранными' : status === 'lost' ? 'проигранными' : 'отмененными'
    if (!confirm(`Отметить ${selectedBets.size} ставок как ${statusLabel}?`)) return

    setIsBulkUpdating(true)
    let successCount = 0
    let errorCount = 0

    try {
      for (const betId of selectedBets) {
        try {
          await updateBetSlipStatus(betId, status)
          successCount++
        } catch (error) {
          errorCount++
        }
      }
      if (successCount > 0) {
        toast.success(`Обновлено ставок: ${successCount}`)
        setSelectedBets(new Set())
        await loadHistory()
      }
      if (errorCount > 0) toast.error(`Ошибок: ${errorCount}`)
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'won': return 'positive' as const
      case 'lost': return 'negative' as const
      case 'placed': return 'live' as const
      default: return 'neutral' as const
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-4">
          <ShoppingCart className="w-16 h-16 text-[var(--mute)] mx-auto mb-4" />
          <h1 className="text-[32px] font-[800] text-[var(--ink)] mb-2 tracking-tight">Мои ставки</h1>
          <p className="text-[var(--body)] mb-6">Войдите в систему, чтобы просматривать историю ставок</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius-xl)] font-semibold transition-colors hover:bg-[var(--primary-hover)]"
          >
            На главную
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Заголовок */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-[32px] sm:text-[40px] font-[900] text-[var(--ink)] tracking-tight">
              Мои ставки
            </h1>
            <PendingBetsBadge />
          </div>
          <p className="text-[var(--body)] text-sm">
            {betSlips.length === 0
              ? 'У вас пока нет размещенных ставок'
              : `Всего ставок: ${betSlips.length}`
            }
          </p>
        </div>

        {/* Live аналитика */}
        <LiveAnalytics />

        {/* Статистика */}
        {betSlips.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-[var(--canvas)] rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-card)]">
              <div className="text-[var(--body)] text-sm mb-1">Всего</div>
              <div className="text-[28px] font-[800] text-[var(--ink)]">{stats.total}</div>
            </div>
            <div className="bg-[var(--canvas)] rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-card)]">
              <div className="text-[var(--body)] text-sm mb-1">В ожидании</div>
              <div className="text-[28px] font-[800] text-blue-500">{stats.placed}</div>
            </div>
            <div className="bg-[var(--canvas)] rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-card)]">
              <div className="text-[var(--body)] text-sm mb-1">Выиграно</div>
              <div className="text-[28px] font-[800] text-[var(--positive)]">{stats.won}</div>
            </div>
            <div className="bg-[var(--canvas)] rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-card)]">
              <div className="text-[var(--body)] text-sm mb-1">Проиграно</div>
              <div className="text-[28px] font-[800] text-[var(--negative)]">{stats.lost}</div>
            </div>
          </div>
        )}

        {/* Фильтры и сортировка */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex gap-1.5 overflow-x-auto pb-2 sm:pb-0 bg-[var(--canvas-soft)] rounded-[var(--radius-xl)] p-1">
            {([
              ['all', 'Все', betSlips.length],
              ['placed', 'В ожидании', stats.placed],
              ['won', 'Выиграно', stats.won],
              ['lost', 'Проиграно', stats.lost],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setSelectedStatus(key)}
                className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedStatus === key
                    ? 'bg-[var(--canvas)] text-[var(--ink)] shadow-sm'
                    : 'text-[var(--body)] hover:text-[var(--ink)]'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <ArrowUpDown className="w-4 h-4 text-[var(--mute)]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 bg-[var(--canvas)] text-[var(--ink)] rounded-[var(--radius-xl)] border border-[var(--border)] text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="date-desc">Сначала новые</option>
              <option value="date-asc">Сначала старые</option>
              <option value="stake-desc">По сумме (больше)</option>
              <option value="stake-asc">По сумме (меньше)</option>
              <option value="odds-desc">По коэф. (выше)</option>
              <option value="odds-asc">По коэф. (ниже)</option>
              <option value="win-desc">По выигрышу (больше)</option>
              <option value="win-asc">По выигрышу (меньше)</option>
            </select>
          </div>
        </div>

        {/* Массовые действия */}
        {selectedStatus === 'placed' && filteredBetSlips.filter(b => b.status === 'placed').length > 0 && (
          <div className="mb-6 p-4 bg-[var(--canvas)] rounded-[var(--radius-xl)] shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={toggleSelectAll} className="p-1 hover:bg-[var(--canvas-soft)] rounded transition-colors">
                  {selectedBets.size > 0 ? (
                    <CheckSquare className="w-5 h-5 text-[var(--primary)]" />
                  ) : (
                    <Square className="w-5 h-5 text-[var(--mute)]" />
                  )}
                </button>
                <span className="text-sm font-semibold text-[var(--ink)]">
                  {selectedBets.size > 0 ? `Выбрано: ${selectedBets.size}` : 'Выбрать все'}
                </span>
              </div>
              {selectedBets.size > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkStatusUpdate('won')}
                    disabled={isBulkUpdating}
                    className="px-4 py-2 bg-[var(--positive)] text-white text-sm font-semibold rounded-[var(--radius-xl)] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Выиграли
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('lost')}
                    disabled={isBulkUpdating}
                    className="px-4 py-2 bg-[var(--negative)] text-white text-sm font-semibold rounded-[var(--radius-xl)] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Проиграли
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('cancelled')}
                    disabled={isBulkUpdating}
                    className="px-4 py-2 bg-[var(--canvas-soft)] text-[var(--ink)] text-sm font-semibold rounded-[var(--radius-xl)] hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    Отменить
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Список ставок — обычный скролл страницы */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[var(--canvas)] rounded-[var(--radius-xl)] p-6 animate-pulse shadow-[var(--shadow-card)]">
                <div className="h-5 bg-[var(--canvas-soft)] rounded w-1/3 mb-4" />
                <div className="h-7 bg-[var(--canvas-soft)] rounded w-1/2 mb-3" />
                <div className="h-5 bg-[var(--canvas-soft)] rounded w-2/3 mb-4" />
                <div className="h-4 bg-[var(--canvas-soft)] rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : filteredBetSlips.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-12 h-12 text-[var(--mute)] mx-auto mb-4" />
            <p className="text-[var(--body)]">
              {selectedStatus === 'all'
                ? 'У вас пока нет размещенных ставок'
                : `Нет ставок со статусом "${BET_SLIP_STATUS_LABELS[selectedStatus]}"`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedBetSlips.map((betSlip) => (
              <motion.div
                key={betSlip.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-[var(--canvas)] rounded-[var(--radius-xl)] p-5 sm:p-6 shadow-[var(--shadow-card)] border transition-colors ${
                  betSlip.status === 'won'
                    ? 'border-[var(--positive)]/30'
                    : betSlip.status === 'lost'
                    ? 'border-[var(--negative)]/30'
                    : 'border-[var(--border)] hover:bg-[var(--canvas-soft)]'
                }`}
              >
                {/* Заголовок */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    {betSlip.status === 'placed' && (
                      <button
                        onClick={() => toggleBetSelection(betSlip.id)}
                        className="mt-1 p-1 hover:bg-[var(--canvas-soft)] rounded transition-colors"
                      >
                        {selectedBets.has(betSlip.id) ? (
                          <CheckSquare className="w-5 h-5 text-[var(--primary)]" />
                        ) : (
                          <Square className="w-5 h-5 text-[var(--mute)]" />
                        )}
                      </button>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg font-[800] text-[var(--ink)]">
                          {BET_TYPE_LABELS[betSlip.bet_type]}
                        </span>
                        <Badge variant={getStatusBadgeVariant(betSlip.status)} size="sm">
                          {BET_SLIP_STATUS_LABELS[betSlip.status]}
                        </Badge>
                        <BetSlipShare betSlip={betSlip} translateEnabled={translateEnabled} />
                      </div>
                      <div className="text-sm text-[var(--body)] flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {format(new Date(betSlip.placed_at || betSlip.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[var(--body)] mb-1">Коэффициент</div>
                    <div className="text-2xl font-[800] text-[var(--primary)]">{betSlip.total_odds.toFixed(2)}</div>
                  </div>
                </div>

                {/* Исходы */}
                <div className="space-y-2 mb-4">
                  {betSlip.items.map((item) => (
                    <div key={item.id} className="bg-[var(--canvas-soft)] rounded-[var(--radius-lg)] p-3 sm:p-4">
                      <div className="text-xs text-[var(--body)] mb-1.5 font-medium">
                        {translateLeague(item.match_data.league_name, translateEnabled)}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[var(--ink)]">
                            {translateTeam(item.match_data.team1.name, translateEnabled)} — {translateTeam(item.match_data.team2.name, translateEnabled)}
                          </div>
                          <div className="text-xs text-[var(--mute)] mt-1">
                            {format(new Date(item.match_data.start_time), 'dd MMM, HH:mm', { locale: ru })}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                          <span className="text-sm font-semibold text-[var(--primary)]">
                            {BET_OUTCOME_LABELS[item.bet_outcome]}
                          </span>
                          <span className="text-base font-[800] text-[var(--ink)] tabular-nums">
                            {item.odds.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Финансы */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                  <div>
                    <div className="text-sm text-[var(--body)]">Сумма ставки</div>
                    <div className="text-xl font-[800] text-[var(--ink)]">{betSlip.stake_amount.toFixed(2)} ₽</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[var(--body)]">
                      {betSlip.status === 'won' ? 'Выигрыш' : 'Возможный выигрыш'}
                    </div>
                    <div className={`text-xl font-[800] ${
                      betSlip.status === 'won' ? 'text-[var(--positive)]' : 'text-[var(--ink)]'
                    }`}>
                      {betSlip.potential_win.toFixed(2)} ₽
                    </div>
                  </div>
                </div>

                {/* Кнопки управления */}
                {betSlip.status === 'placed' && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <BetStatusActions
                      betSlipId={betSlip.id}
                      potentialWin={betSlip.potential_win}
                      stakeAmount={betSlip.stake_amount}
                      onStatusChanged={loadHistory}
                    />
                  </div>
                )}

                {/* История изменений */}
                {(betSlip.status === 'won' || betSlip.status === 'lost' || betSlip.status === 'cancelled') && (
                  <BetSlipStatusHistoryComponent betSlipId={betSlip.id} />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
