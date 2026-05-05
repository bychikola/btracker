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
      setHistory(data.slice(0, 10)) // Последние 10 ставок
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
      toast.success('Ставка успешно размещена!', {
        icon: '✅',
      })
      // Переключаемся на историю после размещения
      setActiveTab('history')
      loadHistory()
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при размещении ставки', {
        icon: '❌',
      })
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
      <div className="bg-card-bg border-l border-border flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-text-secondary text-sm">
              Войдите в систему, чтобы делать ставки
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card-bg border-l border-border flex flex-col h-full">
        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === 'coupon' ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-foreground">Купон</h3>
                {itemsCount > 0 && (
                  <button
                    onClick={handleClear}
                    className="text-text-secondary hover:text-accent transition-colors"
                    title="Очистить купон"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Переключатель типа ставки */}
              {itemsCount > 1 && (
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => changeBetType('single')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                      betSlip?.bet_type === 'single'
                        ? 'bg-accent text-black'
                        : 'bg-card-hover text-foreground hover:bg-accent hover:text-black'
                    }`}
                  >
                    Ординар
                  </button>
                  <button
                    onClick={() => changeBetType('express')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                      betSlip?.bet_type === 'express'
                        ? 'bg-accent text-black'
                        : 'bg-card-hover text-foreground hover:bg-accent hover:text-black'
                    }`}
                  >
                    Экспресс
                  </button>
                </div>
              )}

              {/* Список исходов */}
              {itemsCount === 0 ? (
                <div className="text-center py-6">
                  <div className="text-text-secondary text-xs mb-1">Купон пуст</div>
                  <p className="text-text-secondary text-[10px]">
                    Выберите исходы для добавления в купон
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mb-3">
                  {betSlip?.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-card-hover rounded-lg p-2 relative group"
                    >
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="absolute top-1 right-1 p-0.5 text-text-secondary hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                        title="Удалить"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      <div className="text-[10px] text-text-secondary mb-1 pr-5 truncate">
                        {translateLeague(item.match_data.league_name, translateEnabled)}
                      </div>

                      <div className="space-y-0.5 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-card-bg flex items-center justify-center flex-shrink-0">
                            {item.match_data.team1.logo ? (
                              <img
                                src={item.match_data.team1.logo}
                                alt={item.match_data.team1.name}
                                className="w-3 h-3"
                              />
                            ) : (
                              <span className="text-[8px] font-bold text-text-secondary">
                                {item.match_data.team1.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-foreground truncate">
                            {translateTeam(item.match_data.team1.name, translateEnabled)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-card-bg flex items-center justify-center flex-shrink-0">
                            {item.match_data.team2.logo ? (
                              <img
                                src={item.match_data.team2.logo}
                                alt={item.match_data.team2.name}
                                className="w-3 h-3"
                              />
                            ) : (
                              <span className="text-[8px] font-bold text-text-secondary">
                                {item.match_data.team2.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-foreground truncate">
                            {translateTeam(item.match_data.team2.name, translateEnabled)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-accent">
                          {BET_OUTCOME_LABELS[item.bet_outcome]}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {item.odds.toFixed(2)}
                        </span>
                      </div>

                      <div className="text-[10px] text-text-secondary mt-0.5">
                        {item.match_data.is_live ? (
                          <span className="text-accent font-semibold">● LIVE</span>
                        ) : (
                          format(new Date(item.match_data.start_time), 'dd MMM, HH:mm', {
                            locale: ru,
                          })
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Сумма ставки и расчет */}
              {itemsCount > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Общий коэффициент:</span>
                    <span className="font-bold text-foreground">
                      {betSlip?.total_odds.toFixed(2) || '0.00'}
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] text-text-secondary mb-0.5 block">
                      Сумма ставки (₽)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={stakeInput}
                      onChange={(e) => handleStakeChange(e.target.value)}
                      placeholder="0"
                      className="w-full px-2 py-1.5 text-sm bg-card-hover border border-border rounded-lg text-foreground focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  {betSlip && betSlip.stake_amount > 0 && (
                    <div className="flex items-center justify-between p-2 bg-accent/10 rounded-lg">
                      <span className="text-xs text-foreground">Возможный выигрыш:</span>
                      <span className="text-sm font-bold text-accent">
                        {betSlip.potential_win.toFixed(2)} ₽
                      </span>
                    </div>
                  )}

                  <button
                    onClick={handlePlaceBet}
                    disabled={!betSlip || betSlip.stake_amount <= 0 || isPlacing}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      betSlip && betSlip.stake_amount > 0 && !isPlacing
                        ? 'bg-accent hover:bg-accent-hover text-black'
                        : 'bg-card-hover text-text-secondary cursor-not-allowed'
                    }`}
                  >
                    {isPlacing ? 'Размещение...' : 'Сделать ставку'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <h3 className="text-base font-bold text-foreground mb-3">Мои ставки</h3>
              {isLoadingHistory ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-card-hover rounded-lg p-2 animate-pulse">
                      <div className="h-3 bg-card-bg rounded w-2/3 mb-2"></div>
                      <div className="h-2 bg-card-bg rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-text-secondary text-xs">Нет размещенных ставок</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((slip) => (
                    <div key={slip.id} className="bg-card-hover rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedSlipId(expandedSlipId === slip.id ? null : slip.id)}
                        className="w-full p-2 text-left"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground">
                              {BET_TYPE_LABELS[slip.bet_type]}
                            </span>
                            {expandedSlipId === slip.id ? (
                              <ChevronUp className="w-3 h-3 text-text-secondary" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-text-secondary" />
                            )}
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              slip.status === 'placed'
                                ? 'bg-blue-500/20 text-blue-500'
                                : slip.status === 'won'
                                ? 'bg-green-500/20 text-green-500'
                                : 'bg-red-500/20 text-red-500'
                            }`}
                          >
                            {BET_SLIP_STATUS_LABELS[slip.status]}
                          </span>
                        </div>
                        <div className="text-[10px] text-text-secondary mb-1">
                          {format(new Date(slip.placed_at || slip.created_at), 'dd MMM, HH:mm', { locale: ru })}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-text-secondary">Коэф: {slip.total_odds.toFixed(2)}</span>
                          <span className="font-bold text-foreground">{slip.stake_amount.toFixed(0)} ₽</span>
                        </div>
                      </button>

                      {expandedSlipId === slip.id && slip.items && slip.items.length > 0 && (
                        <div className="border-t border-border px-2 pb-2 space-y-1.5">
                          {slip.items.map((item) => (
                            <div key={item.id} className="bg-card-bg rounded p-1.5">
                              <div className="text-[9px] text-text-secondary mb-0.5 truncate">
                                {translateLeague(item.match_data.league_name, translateEnabled)}
                              </div>
                              <div className="flex items-center justify-between text-[10px] mb-0.5">
                                <span className="text-foreground truncate">
                                  {translateTeam(item.match_data.team1.name, translateEnabled)} - {translateTeam(item.match_data.team2.name, translateEnabled)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-medium text-accent">
                                  {BET_OUTCOME_LABELS[item.bet_outcome]}
                                </span>
                                <span className="text-[10px] font-bold text-foreground">
                                  {item.odds.toFixed(2)}
                                </span>
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

        {/* Табы внизу */}
        <div className="border-t border-border flex">
          <button
            onClick={() => setActiveTab('coupon')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'coupon'
                ? 'text-accent bg-card-hover'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-[10px] font-medium">Купон</span>
            {itemsCount > 0 && (
              <span className="absolute top-1 right-1/4 bg-accent text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {itemsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors relative ${
              activeTab === 'history'
                ? 'text-accent bg-card-hover'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium">Мои ставки</span>
          </button>
        </div>
      </div>
  )
}
