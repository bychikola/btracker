'use client'

import { cn } from '@/lib/utils'
import { useBetSlip } from '@/lib/contexts/bet-slip-context'
import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { BetOutcome, BetSlipMatchData } from '@/lib/types/bet-slip'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface OddButtonProps {
  label: string
  value: number | null | undefined
  outcome: BetOutcome
  matchData: BetSlipMatchData
  onClick?: () => void
}

export function OddButton({ label, value, outcome, matchData, onClick }: OddButtonProps) {
  const { isAuthenticated } = useAuth()
  const { addItem, removeItem, isItemInSlip, getItemInSlip } = useBetSlip()
  const [isAdding, setIsAdding] = useState(false)

  const isInSlip = isItemInSlip(matchData.match_id, outcome)
  const itemInSlip = getItemInSlip(matchData.match_id, outcome)
  const isDisabled = !value || value <= 0

  const handleClick = async () => {
    if (onClick) {
      onClick()
      return
    }

    if (!isAuthenticated) {
      toast.error('Войдите в систему, чтобы добавить ставку в купон', {
        icon: '🔒',
      })
      return
    }

    if (isDisabled) return

    setIsAdding(true)
    try {
      // Если уже в купоне - удаляем, иначе добавляем
      if (isInSlip && itemInSlip) {
        await removeItem(itemInSlip.id)
        toast.success('Удалено из купона', {
          icon: '🗑️',
        })
      } else {
        await addItem({
          match_id: matchData.match_id,
          match_data: matchData,
          bet_outcome: outcome,
          odds: value!,
        })
        toast.success('Добавлено в купон', {
          icon: '✅',
        })
      }
    } catch (error: any) {
      console.error('Error toggling bet slip item:', error)
      toast.error(error.message || 'Ошибка при работе с купоном', {
        icon: '❌',
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled || isAdding}
      className={cn(
        'py-2.5 px-3 rounded-lg transition-all group relative',
        isInSlip
          ? 'bg-accent text-black font-semibold'
          : 'bg-card-hover hover:bg-accent hover:text-black',
        isDisabled && 'opacity-50 cursor-not-allowed',
        isAdding && 'animate-pulse'
      )}
    >
      <div className={cn(
        'text-xs mb-1',
        isInSlip ? 'text-black' : 'text-text-secondary group-hover:text-black'
      )}>
        {label}
      </div>
      <div className={cn(
        'text-sm font-bold',
        isInSlip ? 'text-black' : 'text-foreground group-hover:text-black'
      )}>
        {value && value > 0 ? value.toFixed(2) : '-'}
      </div>
    </button>
  )
}
