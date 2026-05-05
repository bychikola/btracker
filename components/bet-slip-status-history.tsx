'use client'

import { useState, useEffect } from 'react'
import { getBetSlipStatusHistory } from '@/lib/api/bet-slip-history'
import { BetSlipStatusHistory } from '@/lib/types/bet-slip-history'
import { BET_SLIP_STATUS_LABELS } from '@/lib/types/bet-slip'
import { Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'

interface BetSlipStatusHistoryProps {
  betSlipId: string
}

export function BetSlipStatusHistoryComponent({ betSlipId }: BetSlipStatusHistoryProps) {
  const [history, setHistory] = useState<BetSlipStatusHistory[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isExpanded && history.length === 0) {
      loadHistory()
    }
  }, [isExpanded])

  const loadHistory = async () => {
    setIsLoading(true)
    try {
      const data = await getBetSlipStatusHistory(betSlipId)
      setHistory(data)
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (history.length === 0 && !isExpanded) {
    return null
  }

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-foreground transition-colors"
      >
        <Clock className="w-4 h-4" />
        <span>История изменений</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {isLoading ? (
              <div className="mt-3 space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-12 bg-card-hover rounded animate-pulse" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="mt-3 text-sm text-text-secondary">
                История изменений пуста
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-card-hover rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {item.old_status && (
                          <>
                            <span className="text-sm text-text-secondary">
                              {BET_SLIP_STATUS_LABELS[item.old_status as keyof typeof BET_SLIP_STATUS_LABELS]}
                            </span>
                            <span className="text-text-secondary">→</span>
                          </>
                        )}
                        <span
                          className={`text-sm font-medium ${
                            item.new_status === 'won'
                              ? 'text-green-500'
                              : item.new_status === 'lost'
                              ? 'text-red-500'
                              : item.new_status === 'cancelled'
                              ? 'text-gray-500'
                              : 'text-blue-500'
                          }`}
                        >
                          {BET_SLIP_STATUS_LABELS[item.new_status as keyof typeof BET_SLIP_STATUS_LABELS]}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-text-secondary">
                      {format(new Date(item.changed_at), 'dd MMM, HH:mm', { locale: ru })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
