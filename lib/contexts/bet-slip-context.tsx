'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useAuth } from './auth-context-supabase'
import {
  BetSlipWithItems,
  AddToBetSlipParams,
  BetType,
} from '@/lib/types/bet-slip'
import {
  getActiveBetSlip,
  createBetSlip,
  addItemToBetSlip,
  removeItemFromBetSlip,
  updateBetSlipStake,
  placeBetSlip,
  clearBetSlip,
  updateBetType,
} from '@/lib/api/bet-slip'

interface BetSlipContextType {
  betSlip: BetSlipWithItems | null
  isLoading: boolean
  itemsCount: number
  addItem: (params: AddToBetSlipParams) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateStake: (amount: number) => Promise<void>
  placeBet: () => Promise<void>
  clearSlip: () => Promise<void>
  changeBetType: (betType: BetType) => Promise<void>
  refreshBetSlip: () => Promise<void>
  isItemInSlip: (matchId: string, outcome: string) => boolean
  getItemInSlip: (matchId: string, outcome: string) => { id: string } | null
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined)

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const [betSlip, setBetSlip] = useState<BetSlipWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Загрузка активного купона при монтировании и при изменении пользователя
  useEffect(() => {
    if (isAuthenticated && user) {
      loadActiveBetSlip()
    } else {
      setBetSlip(null)
    }
  }, [isAuthenticated, user])

  const loadActiveBetSlip = async () => {
    setIsLoading(true)
    try {
      const data = await getActiveBetSlip()
      setBetSlip(data)
    } catch (error) {
      console.error('Error loading active bet slip:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshBetSlip = useCallback(async () => {
    if (isAuthenticated) {
      await loadActiveBetSlip()
    }
  }, [isAuthenticated])

  const addItem = async (params: AddToBetSlipParams) => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to add items to bet slip')
    }

    // Оптимистичное обновление: сразу обновляем UI
    const previousBetSlip = betSlip

    try {
      // Если нет активного купона, создаем новый
      let currentBetSlip = betSlip
      if (!currentBetSlip) {
        const newBetSlip = await createBetSlip()
        currentBetSlip = { ...newBetSlip, items: [] }
        setBetSlip(currentBetSlip)
      }

      // Создаем временный item для оптимистичного обновления
      const tempItem = {
        id: `temp-${Date.now()}`,
        bet_slip_id: currentBetSlip.id,
        match_id: params.match_id,
        match_data: params.match_data,
        bet_outcome: params.bet_outcome,
        odds: params.odds,
        created_at: new Date().toISOString(),
      }

      // Оптимистично обновляем состояние
      setBetSlip({
        ...currentBetSlip,
        items: [...(currentBetSlip.items || []), tempItem],
      })

      // Отправляем запрос на сервер
      await addItemToBetSlip(currentBetSlip.id, params)

      // Синхронизируем с сервером
      await refreshBetSlip()
    } catch (error) {
      // Откатываем изменения при ошибке
      setBetSlip(previousBetSlip)
      console.error('Error adding item to bet slip:', error)
      throw error
    }
  }

  const removeItem = async (itemId: string) => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to remove items from bet slip')
    }

    // Оптимистичное обновление: сразу удаляем из UI
    const previousBetSlip = betSlip

    try {
      if (betSlip) {
        // Оптимистично обновляем состояние
        setBetSlip({
          ...betSlip,
          items: betSlip.items?.filter(item => item.id !== itemId) || [],
        })
      }

      // Отправляем запрос на сервер
      await removeItemFromBetSlip(itemId)

      // Синхронизируем с сервером
      await refreshBetSlip()
    } catch (error) {
      // Откатываем изменения при ошибке
      setBetSlip(previousBetSlip)
      console.error('Error removing item from bet slip:', error)
      throw error
    }
  }

  const updateStake = async (amount: number) => {
    if (!isAuthenticated || !betSlip) {
      throw new Error('User must be authenticated and have an active bet slip')
    }

    // Оптимистичное обновление: сразу обновляем UI
    const previousBetSlip = betSlip

    try {
      // Вычисляем потенциальный выигрыш
      const potentialWin = amount * betSlip.total_odds

      // Оптимистично обновляем состояние
      setBetSlip({
        ...betSlip,
        stake_amount: amount,
        potential_win: potentialWin,
      })

      // Отправляем запрос на сервер
      await updateBetSlipStake({
        bet_slip_id: betSlip.id,
        stake_amount: amount,
      })

      // Синхронизируем с сервером
      await refreshBetSlip()
    } catch (error) {
      // Откатываем изменения при ошибке
      setBetSlip(previousBetSlip)
      console.error('Error updating stake:', error)
      throw error
    }
  }

  const placeBet = async () => {
    if (!isAuthenticated || !betSlip) {
      throw new Error('User must be authenticated and have an active bet slip')
    }

    if (betSlip.items.length === 0) {
      throw new Error('Купон пуст')
    }

    if (betSlip.stake_amount <= 0) {
      throw new Error('Укажите сумму ставки')
    }

    try {
      await placeBetSlip({ bet_slip_id: betSlip.id })
      setBetSlip(null) // Очищаем текущий купон
      await refreshBetSlip() // Загружаем новый активный купон (если есть)
    } catch (error) {
      console.error('Error placing bet:', error)
      throw error
    }
  }

  const clearSlip = async () => {
    if (!isAuthenticated || !betSlip) {
      return
    }

    try {
      await clearBetSlip(betSlip.id)
      await refreshBetSlip()
    } catch (error) {
      console.error('Error clearing bet slip:', error)
      throw error
    }
  }

  const changeBetType = async (betType: BetType) => {
    if (!isAuthenticated || !betSlip) {
      throw new Error('User must be authenticated and have an active bet slip')
    }

    try {
      await updateBetType(betSlip.id, betType)
      await refreshBetSlip()
    } catch (error) {
      console.error('Error changing bet type:', error)
      throw error
    }
  }

  const isItemInSlip = useCallback(
    (matchId: string, outcome: string): boolean => {
      if (!betSlip || !betSlip.items) return false
      return betSlip.items.some(
        (item) => String(item.match_id) === String(matchId) && item.bet_outcome === outcome
      )
    },
    [betSlip]
  )

  const getItemInSlip = useCallback(
    (matchId: string, outcome: string): { id: string } | null => {
      if (!betSlip || !betSlip.items) return null
      const item = betSlip.items.find(
        (item) => String(item.match_id) === String(matchId) && item.bet_outcome === outcome
      )
      return item ? { id: item.id } : null
    },
    [betSlip]
  )

  const itemsCount = betSlip?.items?.length || 0

  return (
    <BetSlipContext.Provider
      value={{
        betSlip,
        isLoading,
        itemsCount,
        addItem,
        removeItem,
        updateStake,
        placeBet,
        clearSlip,
        changeBetType,
        refreshBetSlip,
        isItemInSlip,
        getItemInSlip,
      }}
    >
      {children}
    </BetSlipContext.Provider>
  )
}

export function useBetSlip() {
  const context = useContext(BetSlipContext)
  if (context === undefined) {
    throw new Error('useBetSlip must be used within a BetSlipProvider')
  }
  return context
}
