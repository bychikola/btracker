'use client'

import { cn } from '@/lib/utils'
import { useBetSlip } from '@/lib/contexts/bet-slip-context'
import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { BetOutcome, BetSlipMatchData } from '@/lib/types/bet-slip'
import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface OddButtonProps {
  label: string
  value: number | null | undefined
  outcome: BetOutcome
  matchData: BetSlipMatchData
  sublabel?: string
  changed?: boolean
  onClick?: () => void
}

export function OddButton({ label, value, outcome, matchData, sublabel, changed = false, onClick }: OddButtonProps) {
  const { isAuthenticated } = useAuth()
  const { addItem, removeItem, isItemInSlip, getItemInSlip } = useBetSlip()
  const [isAdding, setIsAdding] = useState(false)

  const isInSlip = isItemInSlip(matchData.match_id, outcome)
  const itemInSlip = getItemInSlip(matchData.match_id, outcome)
  const isDisabled = !value || value <= 0

  const handleClick = async () => {
    if (onClick) { onClick(); return }
    if (!isAuthenticated) { toast.error('Войдите в систему, чтобы добавить ставку в купон'); return }
    if (isDisabled) return

    setIsAdding(true)
    try {
      if (isInSlip && itemInSlip) {
        await removeItem(itemInSlip.id)
        toast.success('Удалено из купона')
      } else {
        await addItem({
          match_id: matchData.match_id,
          match_data: matchData,
          bet_outcome: outcome,
          odds: value!,
        })
        toast.success('Добавлено в купон')
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при работе с купоном')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      disabled={isDisabled || isAdding}
      animate={changed ? { scale: [1, 1.08, 1] } : {}}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 py-3 px-2 rounded-[var(--radius-xl)] transition-all relative min-h-[52px] touch-manipulation select-none',
        isInSlip
          ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md'
          : changed
            ? 'bg-[var(--primary)]/25 shadow-[0_0_12px_var(--primary)]'
            : 'bg-[var(--canvas-soft)] hover:bg-[var(--primary)]/20 hover:shadow-sm',
        isDisabled && 'opacity-25 cursor-not-allowed',
        isAdding && 'opacity-60'
      )}
    >
      {/* Outcome label (П1 / X / П2) */}
      <span className={cn(
        'text-[11px] font-semibold uppercase tracking-wide',
        isInSlip ? 'text-[var(--primary-foreground)]/60' : 'text-[var(--mute)]'
      )}>
        {label}
      </span>

      {/* Team name (sublabel) — shown on match detail page */}
      {sublabel && (
        <span className={cn(
          'text-xs font-medium truncate max-w-full px-1',
          isInSlip ? 'text-[var(--primary-foreground)]/80' : 'text-[var(--body)]'
        )}>
          {sublabel}
        </span>
      )}

      {/* Odds value */}
      <span className={cn(
        'text-base font-[800] tabular-nums',
        isInSlip ? 'text-[var(--primary-foreground)]' : 'text-[var(--ink)]'
      )}>
        {value && value > 0 ? value.toFixed(2) : '—'}
      </span>
    </motion.button>
  )
}
