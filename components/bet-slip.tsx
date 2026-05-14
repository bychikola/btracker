'use client'

import { X, Trash2, ShoppingCart, History, ChevronDown, ChevronUp } from 'lucide-react'
import { useBetSlip } from '@/lib/contexts/bet-slip-context'
import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { BET_OUTCOME_LABELS, BET_TYPE_LABELS, BetSlipWithItems, BET_SLIP_STATUS_LABELS } from '@/lib/types/bet-slip'
import { translateTeam, translateLeague } from '@/lib/translations'
import { useTranslation } from '@/lib/contexts/translation-context'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { getBetSlipHistory } from '@/lib/api/bet-slip'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card } from './ui/card'

interface BetSlipProps {
  className?: string
  isModal?: boolean
}

type TabType = 'coupon' | 'history'

export function BetSlip({ className, isModal = false }: BetSlipProps) {
  const { isAuthenticated } = useAuth()
  const { betSlip, itemsCount, removeItem, updateStake, placeBet, clearSlip, changeBetType } = useBetSlip()
  const { translateEnabled } = useTranslation()
  const [stakeInput, setStakeInput] = useState('')
  const [isPlacing, setIsPlacing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('coupon')
  const [history, setHistory] = useState<BetSlipWithItems[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [expandedSlipId, setExpandedSlipId] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab === 'history' && isAuthenticated) {
      loadHistory()
    }
  }, [activeTab, isAuthenticated])

  const loadHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const data = await getBetSlipHistory()
      setHistory(data.slice(0, 10))
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleStakeChange = (value: string) => {
    const sanitized = value.replace(/[^\d.]/g, '')
    setStakeInput(sanitized)
    const amount = parseFloat(sanitized)
    if (!isNaN(amount) && amount >= 0) {
      updateStake(amount)
    }
  }

  const handlePlaceBet = async () => {
    if (!betSlip || betSlip.items.length === 0) return
    setIsPlacing(true)
    try {
      await placeBet()
      setStakeInput('')
      toast.success('Ставка успешно размещена!')
      setActiveTab('history')
      loadHistory()
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при размещении ставки')
    } finally {
      setIsPlacing(false)
    }
  }

  const handleClear = async () => {
    if (confirm('Очистить купон?')) {
      await clearSlip()
      setStakeInput('')
      toast.success('Купон очищен')
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId)
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-[var(--canvas)] border-l border-[var(--border)] flex flex-col h-full rounded-none">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <ShoppingCart className="w-10 h-10 text-[var(--mute)] mx-auto mb-3" />
            <p className="text-[var(--mute)] text-sm font-medium">
              Войдите в систему, чтобы делать ставки
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-[var(--canvas)] border-l border-[var(--border)] flex flex-col h-full ${className || ''}`}>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'coupon' ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-[800] text-[var(--ink)]">Купон</h3>
              {itemsCount > 0 && (
                <button
                  onClick={handleClear}
                  className="p-1.5 hover:bg-[var(--canvas-soft)] rounded-[var(--radius-full)] transition-colors text-[var(--mute)] hover:text-[var(--negative)]"
                  title="Очистить купон"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Bet type toggle */}
            {itemsCount > 1 && (
              <div className="flex gap-1 mb-4 bg-[var(--canvas-soft)] rounded-[var(--radius-xl)] p-1">
                <button
                  onClick={() => changeBetType('single')}
                  className={`flex-1 py-2 px-3 rounded-[var(--radius-lg)] text-xs font-semibold transition-all ${
                    betSlip?.bet_type === 'single'
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                      : 'text-[var(--body)] hover:text-[var(--ink)]'
                  }`}
                >
                  Ординар
                </button>
                <button
                  onClick={() => changeBetType('express')}
                  className={`flex-1 py-2 px-3 rounded-[var(--radius-lg)] text-xs font-semibold transition-all ${
                    betSlip?.bet_type === 'express'
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                      : 'text-[var(--body)] hover:text-[var(--ink)]'
                  }`}
                >
                  Экспресс
                </button>
              </div>
            )}

            {/* Items */}
            {itemsCount === 0 ? (
              <div className="text-center py-10">
                <ShoppingCart className="w-10 h-10 text-[var(--mute)] mx-auto mb-3" />
                <div className="text-[var(--mute)] text-sm font-medium">Купон пуст</div>
                <p className="text-[var(--mute)] text-xs mt-1">Выберите исходы для добавления</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {betSlip?.items.map((item) => (
                  <div key={item.id} className="bg-[var(--canvas-soft)] rounded-[var(--radius-lg)] p-3 relative group">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="absolute top-2 right-2 p-0.5 text-[var(--mute)] hover:text-[var(--negative)] transition-colors opacity-0 group-hover:opacity-100"
                      title="Удалить"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    <div className="text-[10px] text-[var(--mute)] mb-1.5 pr-5 font-medium truncate">
                      {translateLeague(item.match_data.league_name, translateEnabled)}
                    </div>

                    <div className="space-y-1 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[var(--canvas)] flex items-center justify-center flex-shrink-0">
                          {item.match_data.team1.logo ? (
                            <img src={item.match_data.team1.logo} alt="" className="w-3.5 h-3.5" />
                          ) : (
                            <span className="text-[8px] font-bold text-[var(--mute)]">{item.match_data.team1.name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-[var(--ink)] truncate">
                          {translateTeam(item.match_data.team1.name, translateEnabled)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[var(--canvas)] flex items-center justify-center flex-shrink-0">
                          {item.match_data.team2.logo ? (
                            <img src={item.match_data.team2.logo} alt="" className="w-3.5 h-3.5" />
                          ) : (
                            <span className="text-[8px] font-bold text-[var(--mute)]">{item.match_data.team2.name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-[var(--ink)] truncate">
                          {translateTeam(item.match_data.team2.name, translateEnabled)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--primary)]">
                        {BET_OUTCOME_LABELS[item.bet_outcome]}
                      </span>
                      <span className="text-sm font-[800] text-[var(--ink)]">{item.odds.toFixed(2)}</span>
                    </div>

                    <div className="text-[10px] text-[var(--mute)] mt-1">
                      {item.match_data.is_live ? (
                        <Badge variant="live" size="sm">LIVE</Badge>
                      ) : (
                        format(new Date(item.match_data.start_time), 'dd MMM, HH:mm', { locale: ru })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stake & Calculation */}
            {itemsCount > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--body)]">Общий коэффициент:</span>
                  <span className="font-[800] text-[var(--ink)]">{betSlip?.total_odds.toFixed(2) || '0.00'}</span>
                </div>

                <div>
                  <label className="text-xs text-[var(--body)] mb-1.5 block font-semibold">Сумма ставки</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={stakeInput}
                    onChange={(e) => handleStakeChange(e.target.value)}
                    placeholder="0"
                    className="wise-input text-center text-lg font-[800]"
                  />
                </div>

                {betSlip && betSlip.stake_amount > 0 && (
                  <div className="bg-[var(--primary-pale)] rounded-[var(--radius-lg)] p-3 text-center">
                    <span className="text-xs text-[var(--ink-deep)]">Возможный выигрыш</span>
                    <div className="text-xl font-[800] text-[var(--ink)] mt-0.5">
                      {betSlip.potential_win.toFixed(2)} ₽
                    </div>
                  </div>
                )}

                <Button
                  variant="primary"
                  onClick={handlePlaceBet}
                  disabled={!betSlip || betSlip.stake_amount <= 0 || isPlacing}
                  isLoading={isPlacing}
                  className="w-full"
                >
                  {isPlacing ? 'Размещение...' : 'Сделать ставку'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <h3 className="text-lg font-[800] text-[var(--ink)] mb-4">Мои ставки</h3>
            {isLoadingHistory ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-[var(--canvas-soft)] rounded-[var(--radius-lg)] p-3 animate-pulse">
                    <div className="h-3 bg-[var(--canvas)] rounded w-2/3 mb-2" />
                    <div className="h-2 bg-[var(--canvas)] rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-10">
                <History className="w-10 h-10 text-[var(--mute)] mx-auto mb-3" />
                <div className="text-[var(--mute)] text-sm font-medium">Нет размещенных ставок</div>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((slip) => (
                  <div key={slip.id} className="bg-[var(--canvas-soft)] rounded-[var(--radius-lg)] overflow-hidden">
                    <button
                      onClick={() => setExpandedSlipId(expandedSlipId === slip.id ? null : slip.id)}
                      className="w-full p-3 text-left"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--ink)]">{BET_TYPE_LABELS[slip.bet_type]}</span>
                          {expandedSlipId === slip.id ? (
                            <ChevronUp className="w-3 h-3 text-[var(--mute)]" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-[var(--mute)]" />
                          )}
                        </div>
                        <Badge
                          variant={slip.status === 'won' ? 'positive' : slip.status === 'lost' ? 'negative' : 'neutral'}
                          size="sm"
                        >
                          {BET_SLIP_STATUS_LABELS[slip.status]}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-[var(--mute)] mb-1.5">
                        {format(new Date(slip.placed_at || slip.created_at), 'dd MMM, HH:mm', { locale: ru })}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--body)]">Коэф: {slip.total_odds.toFixed(2)}</span>
                        <span className="font-[800] text-[var(--ink)]">{slip.stake_amount.toFixed(0)} ₽</span>
                      </div>
                    </button>

                    {expandedSlipId === slip.id && slip.items && slip.items.length > 0 && (
                      <div className="border-t border-[var(--border)] px-3 pb-3 space-y-1.5 pt-2">
                        {slip.items.map((item) => (
                          <div key={item.id} className="bg-[var(--canvas)] rounded-[var(--radius-md)] p-2">
                            <div className="text-[9px] text-[var(--mute)] mb-1 truncate">
                              {translateLeague(item.match_data.league_name, translateEnabled)}
                            </div>
                            <div className="text-[10px] text-[var(--ink)] mb-1 font-medium truncate">
                              {translateTeam(item.match_data.team1.name, translateEnabled)} — {translateTeam(item.match_data.team2.name, translateEnabled)}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-[var(--primary)]">
                                {BET_OUTCOME_LABELS[item.bet_outcome]}
                              </span>
                              <span className="text-[10px] font-[800] text-[var(--ink)]">{item.odds.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="border-t border-[var(--border)] flex">
        <button
          onClick={() => setActiveTab('coupon')}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors relative ${
            activeTab === 'coupon' ? 'text-[var(--primary)]' : 'text-[var(--mute)] hover:text-[var(--ink)]'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Купон</span>
          {itemsCount > 0 && (
            <span className="absolute top-1.5 right-1/3 bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold rounded-[var(--radius-full)] w-4 h-4 flex items-center justify-center">
              {itemsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors relative ${
            activeTab === 'history' ? 'text-[var(--primary)]' : 'text-[var(--mute)] hover:text-[var(--ink)]'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Мои ставки</span>
        </button>
      </div>
    </div>
  )
}
