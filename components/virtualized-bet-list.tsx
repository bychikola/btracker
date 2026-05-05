'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { BetSlipWithItems, BET_OUTCOME_LABELS, BET_TYPE_LABELS, BET_SLIP_STATUS_LABELS } from '@/lib/types/bet-slip'
import { BetStatusActions } from '@/components/bet-status-actions'
import { BetSlipStatusHistoryComponent } from '@/components/bet-slip-status-history'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { translateTeam, translateLeague } from '@/lib/translations'
import { Clock, CheckSquare, Square } from 'lucide-react'
import { motion } from 'framer-motion'

interface VirtualizedBetListProps {
  betSlips: BetSlipWithItems[]
  selectedBets: Set<string>
  onToggleBetSelection: (betId: string) => void
  onStatusChanged: () => void
  translateEnabled: boolean
}

export function VirtualizedBetList({
  betSlips,
  selectedBets,
  onToggleBetSelection,
  onStatusChanged,
  translateEnabled,
}: VirtualizedBetListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: betSlips.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 400, // Примерная высота карточки
    overscan: 5, // Рендерим 5 дополнительных элементов сверху и снизу
  })

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-500px)] overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const betSlip = betSlips[virtualItem.index]

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="pb-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`bg-card-bg rounded-xl p-6 border transition-all ${
                  betSlip.status === 'won'
                    ? 'border-green-500/50 shadow-lg shadow-green-500/20'
                    : betSlip.status === 'lost'
                    ? 'border-red-500/50 shadow-lg shadow-red-500/20'
                    : 'border-border hover:bg-card-hover'
                }`}
              >
                {/* Заголовок купона */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {/* Чекбокс для массовых действий */}
                    {betSlip.status === 'placed' && (
                      <button
                        onClick={() => onToggleBetSelection(betSlip.id)}
                        className="mt-1 p-1 hover:bg-card-hover rounded transition-colors"
                      >
                        {selectedBets.has(betSlip.id) ? (
                          <CheckSquare className="w-5 h-5 text-accent" />
                        ) : (
                          <Square className="w-5 h-5 text-text-secondary" />
                        )}
                      </button>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-foreground">
                          {BET_TYPE_LABELS[betSlip.bet_type]}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            betSlip.status === 'placed'
                              ? 'bg-blue-500/20 text-blue-500'
                              : betSlip.status === 'won'
                              ? 'bg-green-500/20 text-green-500'
                              : betSlip.status === 'lost'
                              ? 'bg-red-500/20 text-red-500'
                              : 'bg-gray-500/20 text-gray-500'
                          }`}
                        >
                          {BET_SLIP_STATUS_LABELS[betSlip.status]}
                        </span>
                      </div>
                      <div className="text-sm text-text-secondary flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(betSlip.placed_at || betSlip.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-text-secondary mb-1">Коэффициент</div>
                    <div className="text-xl font-bold text-accent">{betSlip.total_odds.toFixed(2)}</div>
                  </div>
                </div>

                {/* Список исходов */}
                <div className="space-y-2 mb-4">
                  {betSlip.items.map((item) => (
                    <div key={item.id} className="bg-card-hover rounded-lg p-3">
                      <div className="text-xs text-text-secondary mb-1">
                        {translateLeague(item.match_data.league_name, translateEnabled)}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm text-foreground">
                            {translateTeam(item.match_data.team1.name, translateEnabled)} -{' '}
                            {translateTeam(item.match_data.team2.name, translateEnabled)}
                          </div>
                          <div className="text-xs text-text-secondary mt-1">
                            {format(new Date(item.match_data.start_time), 'dd MMM, HH:mm', { locale: ru })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-sm font-medium text-accent">
                            {BET_OUTCOME_LABELS[item.bet_outcome]}
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {item.odds.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Финансы */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <div className="text-sm text-text-secondary">Сумма ставки</div>
                    <div className="text-lg font-bold text-foreground">{betSlip.stake_amount.toFixed(2)} ₽</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-text-secondary">
                      {betSlip.status === 'won' ? 'Выигрыш' : 'Возможный выигрыш'}
                    </div>
                    <div className={`text-lg font-bold ${
                      betSlip.status === 'won' ? 'text-green-500' : 'text-foreground'
                    }`}>
                      {betSlip.potential_win.toFixed(2)} ₽
                    </div>
                  </div>
                </div>

                {/* Кнопки управления для активных ставок */}
                {betSlip.status === 'placed' && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <BetStatusActions
                      betSlipId={betSlip.id}
                      potentialWin={betSlip.potential_win}
                      stakeAmount={betSlip.stake_amount}
                      onStatusChanged={onStatusChanged}
                    />
                  </div>
                )}

                {/* История изменений статуса */}
                {betSlip.status !== 'active' && betSlip.status !== 'placed' && (
                  <BetSlipStatusHistoryComponent betSlipId={betSlip.id} />
                )}
              </motion.div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
