'use client'

import { Check, X, RotateCcw, Ban } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { updateBetSlipStatus } from '@/lib/api/bet-slip'
import confetti from 'canvas-confetti'

interface BetStatusActionsProps {
  betSlipId: string
  potentialWin: number
  stakeAmount: number
  onStatusChanged: () => void
}

export function BetStatusActions({ betSlipId, potentialWin, stakeAmount, onStatusChanged }: BetStatusActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const triggerConfetti = () => {
    const count = 200
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    }

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      })
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    })

    fire(0.2, {
      spread: 60,
    })

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    })

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    })

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    })
  }

  const handleStatusUpdate = async (status: 'won' | 'lost' | 'cancelled', statusLabel: string) => {
    const confirmMessage =
      status === 'won'
        ? `Подтвердить выигрыш ${potentialWin.toFixed(0)} ₽?`
        : status === 'lost'
        ? `Подтвердить проигрыш ${stakeAmount.toFixed(0)} ₽?`
        : `Подтвердить возврат ${stakeAmount.toFixed(0)} ₽?`

    if (!confirm(confirmMessage)) return

    setIsUpdating(true)
    try {
      await updateBetSlipStatus(betSlipId, status)

      if (status === 'won') {
        triggerConfetti()
        toast.success(`🎉 Поздравляем! Выигрыш ${potentialWin.toFixed(0)} ₽`, {
          duration: 4000,
        })
      } else if (status === 'lost') {
        toast.error(`Ставка проиграла`, {
          icon: '😔',
        })
      } else {
        toast.success(`Возврат ${stakeAmount.toFixed(0)} ₽`, {
          icon: '🔄',
        })
      }

      onStatusChanged()
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при обновлении статуса')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex gap-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleStatusUpdate('won', 'Выиграла')}
        disabled={isUpdating}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Check className="w-4 h-4" />
        <span className="text-sm font-medium">Выиграла</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleStatusUpdate('lost', 'Проиграла')}
        disabled={isUpdating}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <X className="w-4 h-4" />
        <span className="text-sm font-medium">Проиграла</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleStatusUpdate('cancelled', 'Возврат')}
        disabled={isUpdating}
        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-card-hover hover:bg-border text-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RotateCcw className="w-4 h-4" />
        <span className="text-sm font-medium">Возврат</span>
      </motion.button>
    </div>
  )
}
