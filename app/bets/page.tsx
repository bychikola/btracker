'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { getBetSlipHistory } from '@/lib/api/bet-slip'
import { BetSlipWithItems, BetSlipStatus, BET_OUTCOME_LABELS, BET_TYPE_LABELS, BET_SLIP_STATUS_LABELS } from '@/lib/types/bet-slip'
import { BetStatusActions } from '@/components/bet-status-actions'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { translateTeam, translateLeague } from '@/lib/translations'
import { useTranslation } from '@/lib/contexts/translation-context'
import Link from 'next/link'
import { ShoppingCart, TrendingUp, TrendingDown, Clock, ArrowUpDown, CheckSquare, Square } from 'lucide-react'
import { PendingBetsBadge } from '@/components/pending-bets-badge'
import { BetSlipStatusHistoryComponent } from '@/components/bet-slip-status-history'
import { LiveAnalytics } from '@/components/live-analytics'
import { VirtualizedBetList } from '@/components/virtualized-bet-list'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { updateBetSlipStatus } from '@/lib/api/bet-slip'

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

  // Сортировка
  const sortedBetSlips = [...filteredBetSlips].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.placed_at || b.created_at).getTime() - new Date(a.placed_at || a.created_at).getTime()
      case 'date-asc':
        return new Date(a.placed_at || a.created_at).getTime() - new Date(b.placed_at || b.created_at).getTime()
      case 'stake-desc':
        return b.stake_amount - a.stake_amount
      case 'stake-asc':
        return a.stake_amount - b.stake_amount
      case 'odds-desc':
        return b.total_odds - a.total_odds
      case 'odds-asc':
        return a.total_odds - b.total_odds
      case 'win-desc':
        return b.potential_win - a.potential_win
      case 'win-asc':
        return a.potential_win - b.potential_win
      default:
        return 0
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
    if (selectedBets.size === filteredBetSlips.length) {
      setSelectedBets(new Set())
    } else {
      setSelectedBets(new Set(filteredBetSlips.map(b => b.id)))
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
          console.error(`Error updating bet ${betId}:`, error)
        }
      }

      if (successCount > 0) {
        toast.success(`Обновлено ставок: ${successCount}`)
        setSelectedBets(new Set())
        await loadHistory()
      }

      if (errorCount > 0) {
        toast.error(`Ошибок: ${errorCount}`)
      }
    } finally {
      setIsBulkUpdating(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <ShoppingCart className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Мои ставки</h1>
            <p className="text-text-secondary mb-6">
              Войдите в систему, чтобы просматривать историю ставок
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-accent hover:bg-accent-hover text-black rounded-lg font-medium transition-colors"
            >
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
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Мои ставки</h1>
            <div className="relative">
              <PendingBetsBadge />
            </div>
          </div>
          <p className="text-text-secondary">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card-bg rounded-xl p-4 border border-border">
              <div className="text-text-secondary text-sm mb-1">Всего</div>
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            </div>
            <div className="bg-card-bg rounded-xl p-4 border border-border">
              <div className="text-text-secondary text-sm mb-1">В ожидании</div>
              <div className="text-2xl font-bold text-blue-500">{stats.placed}</div>
            </div>
            <div className="bg-card-bg rounded-xl p-4 border border-border">
              <div className="text-text-secondary text-sm mb-1">Выиграно</div>
              <div className="text-2xl font-bold text-green-500">{stats.won}</div>
            </div>
            <div className="bg-card-bg rounded-xl p-4 border border-border">
              <div className="text-text-secondary text-sm mb-1">Проиграно</div>
              <div className="text-2xl font-bold text-red-500">{stats.lost}</div>
            </div>
          </div>
        )}

        {/* Фильтры */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedStatus === 'all'
                ? 'bg-accent text-black'
                : 'bg-card-bg text-foreground hover:bg-card-hover'
            }`}
          >
            Все ({betSlips.length})
          </button>
          <button
            onClick={() => setSelectedStatus('placed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedStatus === 'placed'
                ? 'bg-accent text-black'
                : 'bg-card-bg text-foreground hover:bg-card-hover'
            }`}
          >
            В ожидании ({stats.placed})
          </button>
          <button
            onClick={() => setSelectedStatus('won')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedStatus === 'won'
                ? 'bg-accent text-black'
                : 'bg-card-bg text-foreground hover:bg-card-hover'
            }`}
          >
            Выиграно ({stats.won})
          </button>
          <button
            onClick={() => setSelectedStatus('lost')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedStatus === 'lost'
                ? 'bg-accent text-black'
                : 'bg-card-bg text-foreground hover:bg-card-hover'
            }`}
          >
            Проиграно ({stats.lost})
          </button>
        </div>

        {/* Сортировка */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 text-text-secondary">
            <ArrowUpDown className="w-4 h-4" />
            <span className="text-sm font-medium">Сортировка:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 bg-card-bg text-foreground rounded-lg border border-border hover:bg-card-hover transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="date-desc">Сначала новые</option>
            <option value="date-asc">Сначала старые</option>
            <option value="stake-desc">По сумме ставки (больше)</option>
            <option value="stake-asc">По сумме ставки (меньше)</option>
            <option value="odds-desc">По коэффициенту (выше)</option>
            <option value="odds-asc">По коэффициенту (ниже)</option>
            <option value="win-desc">По выигрышу (больше)</option>
            <option value="win-asc">По выигрышу (меньше)</option>
          </select>
        </div>

        {/* Панель массовых действий */}
        {selectedStatus === 'placed' && filteredBetSlips.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-card-bg rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="p-1 hover:bg-card-hover rounded transition-colors"
                >
                  {selectedBets.size === filteredBetSlips.length ? (
                    <CheckSquare className="w-5 h-5 text-accent" />
                  ) : (
                    <Square className="w-5 h-5 text-text-secondary" />
                  )}
                </button>
                <span className="text-sm text-foreground">
                  {selectedBets.size > 0 ? `Выбрано: ${selectedBets.size}` : 'Выбрать все'}
                </span>
              </div>

              {selectedBets.size > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkStatusUpdate('won')}
                    disabled={isBulkUpdating}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    Выиграли
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('lost')}
                    disabled={isBulkUpdating}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    Проиграли
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('cancelled')}
                    disabled={isBulkUpdating}
                    className="px-4 py-2 bg-card-hover hover:bg-border text-foreground text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    Отменить
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Список купонов */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card-bg rounded-xl p-6 border border-border animate-pulse">
                <div className="h-4 bg-card-hover rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-card-hover rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-card-hover rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredBetSlips.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <p className="text-text-secondary">
              {selectedStatus === 'all'
                ? 'У вас пока нет размещенных ставок'
                : `Нет ставок со статусом "${BET_SLIP_STATUS_LABELS[selectedStatus]}"`
              }
            </p>
          </div>
        ) : (
          <VirtualizedBetList
            betSlips={sortedBetSlips}
            selectedBets={selectedBets}
            onToggleBetSelection={toggleBetSelection}
            onStatusChanged={loadHistory}
            translateEnabled={translateEnabled}
          />
        )}
      </div>
    </div>
  )
}
