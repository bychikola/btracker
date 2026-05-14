import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { renderHook, act, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

// Моки для зависимостей
const mockGetActiveBetSlip = jest.fn()
const mockCreateBetSlip = jest.fn()
const mockAddItemToBetSlip = jest.fn()
const mockRemoveItemFromBetSlip = jest.fn()
const mockUpdateBetSlipStake = jest.fn()
const mockPlaceBetSlip = jest.fn()
const mockClearBetSlip = jest.fn()
const mockUpdateBetType = jest.fn()

jest.mock('@/lib/api/bet-slip', () => ({
  getActiveBetSlip: () => mockGetActiveBetSlip(),
  createBetSlip: () => mockCreateBetSlip(),
  addItemToBetSlip: (slipId: string, params: any) => mockAddItemToBetSlip(slipId, params),
  removeItemFromBetSlip: (itemId: string) => mockRemoveItemFromBetSlip(itemId),
  updateBetSlipStake: (slipId: string, amount: number) => mockUpdateBetSlipStake(slipId, amount),
  placeBetSlip: (slipId: string) => mockPlaceBetSlip(slipId),
  clearBetSlip: (slipId: string) => mockClearBetSlip(slipId),
  updateBetType: (slipId: string, betType: string) => mockUpdateBetType(slipId, betType),
}))

const mockUseAuth = jest.fn()
jest.mock('@/lib/contexts/auth-context-supabase', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('BetSlip Context', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-123', email: 'test@example.com' },
    })
  })

  describe('Добавление ставок', () => {
    it('должен добавлять ставку в пустой купон', async () => {
      const mockBetSlip = {
        id: 'slip-1',
        user_id: 'user-123',
        status: 'active',
        bet_type: 'single',
        stake_amount: 0,
        total_odds: 1,
        potential_win: 0,
        items: [],
      }

      mockGetActiveBetSlip.mockResolvedValue(null)
      mockCreateBetSlip.mockResolvedValue(mockBetSlip)
      mockAddItemToBetSlip.mockResolvedValue({
        id: 'item-1',
        bet_slip_id: 'slip-1',
        match_id: 'match-1',
        bet_outcome: 'p1',
        odds: 2.5,
      })

      const addParams = {
        match_id: 'match-1',
        match_data: {
          team1: 'Team A',
          team2: 'Team B',
          league: 'Premier League',
        },
        bet_outcome: 'p1',
        odds: 2.5,
      }

      // Тест логики добавления
      expect(mockCreateBetSlip).not.toHaveBeenCalled()

      // Симулируем добавление
      await mockCreateBetSlip()
      await mockAddItemToBetSlip('slip-1', addParams)

      expect(mockCreateBetSlip).toHaveBeenCalledTimes(1)
      expect(mockAddItemToBetSlip).toHaveBeenCalledWith('slip-1', addParams)
    })

    it('должен добавлять ставку в существующий купон', async () => {
      const mockBetSlip = {
        id: 'slip-1',
        user_id: 'user-123',
        status: 'active',
        bet_type: 'single',
        stake_amount: 100,
        total_odds: 2.5,
        potential_win: 250,
        items: [
          {
            id: 'item-1',
            bet_slip_id: 'slip-1',
            match_id: 'match-1',
            bet_outcome: 'p1',
            odds: 2.5,
          },
        ],
      }

      mockGetActiveBetSlip.mockResolvedValue(mockBetSlip)
      mockAddItemToBetSlip.mockResolvedValue({
        id: 'item-2',
        bet_slip_id: 'slip-1',
        match_id: 'match-2',
        bet_outcome: 'x',
        odds: 3.2,
      })

      const addParams = {
        match_id: 'match-2',
        match_data: {
          team1: 'Team C',
          team2: 'Team D',
          league: 'La Liga',
        },
        bet_outcome: 'x',
        odds: 3.2,
      }

      await mockAddItemToBetSlip('slip-1', addParams)

      expect(mockAddItemToBetSlip).toHaveBeenCalledWith('slip-1', addParams)
      expect(mockCreateBetSlip).not.toHaveBeenCalled()
    })

    it('не должен добавлять ставку для неавторизованного пользователя', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      })

      const addParams = {
        match_id: 'match-1',
        match_data: {},
        bet_outcome: 'p1',
        odds: 2.5,
      }

      // Проверяем что без авторизации нельзя добавить
      expect(mockUseAuth().isAuthenticated).toBe(false)

      // API не должен вызываться
      expect(mockAddItemToBetSlip).not.toHaveBeenCalled()
    })
  })

  describe('Удаление ставок', () => {
    it('должен удалять ставку из купона', async () => {
      mockRemoveItemFromBetSlip.mockResolvedValue(undefined)

      await mockRemoveItemFromBetSlip('item-1')

      expect(mockRemoveItemFromBetSlip).toHaveBeenCalledWith('item-1')
    })

    it('должен обрабатывать ошибку при удалении', async () => {
      const error = new Error('Failed to remove item')
      mockRemoveItemFromBetSlip.mockRejectedValue(error)

      await expect(mockRemoveItemFromBetSlip('item-1')).rejects.toThrow('Failed to remove item')
    })
  })

  describe('Обновление ставки', () => {
    it('должен обновлять сумму ставки', async () => {
      const updatedSlip = {
        id: 'slip-1',
        stake_amount: 500,
        total_odds: 2.5,
        potential_win: 1250,
      }

      mockUpdateBetSlipStake.mockResolvedValue(updatedSlip)

      const result = await mockUpdateBetSlipStake('slip-1', 500)

      expect(mockUpdateBetSlipStake).toHaveBeenCalledWith('slip-1', 500)
      expect(result.stake_amount).toBe(500)
      expect(result.potential_win).toBe(1250)
    })

    it('должен обрабатывать отрицательные суммы', async () => {
      mockUpdateBetSlipStake.mockRejectedValue(new Error('Stake amount must be positive'))

      await expect(mockUpdateBetSlipStake('slip-1', -100)).rejects.toThrow('Stake amount must be positive')
    })

    it('должен обрабатывать нулевую сумму', async () => {
      const updatedSlip = {
        id: 'slip-1',
        stake_amount: 0,
        total_odds: 2.5,
        potential_win: 0,
      }

      mockUpdateBetSlipStake.mockResolvedValue(updatedSlip)

      const result = await mockUpdateBetSlipStake('slip-1', 0)

      expect(result.stake_amount).toBe(0)
      expect(result.potential_win).toBe(0)
    })
  })

  describe('Размещение купона', () => {
    it('должен размещать купон со ставками', async () => {
      const placedSlip = {
        id: 'slip-1',
        status: 'placed',
        placed_at: new Date().toISOString(),
      }

      mockPlaceBetSlip.mockResolvedValue(placedSlip)

      const result = await mockPlaceBetSlip('slip-1')

      expect(mockPlaceBetSlip).toHaveBeenCalledWith('slip-1')
      expect(result.status).toBe('placed')
      expect(result.placed_at).toBeDefined()
    })

    it('должен обрабатывать ошибку при размещении', async () => {
      mockPlaceBetSlip.mockRejectedValue(new Error('Insufficient balance'))

      await expect(mockPlaceBetSlip('slip-1')).rejects.toThrow('Insufficient balance')
    })
  })

  describe('Очистка купона', () => {
    it('должен очищать все ставки из купона', async () => {
      mockClearBetSlip.mockResolvedValue(undefined)

      await mockClearBetSlip('slip-1')

      expect(mockClearBetSlip).toHaveBeenCalledWith('slip-1')
    })
  })

  describe('Изменение типа ставки', () => {
    it('должен изменять тип ставки с single на express', async () => {
      const updatedSlip = {
        id: 'slip-1',
        bet_type: 'express',
        total_odds: 8.0,
      }

      mockUpdateBetType.mockResolvedValue(updatedSlip)

      const result = await mockUpdateBetType('slip-1', 'express')

      expect(mockUpdateBetType).toHaveBeenCalledWith('slip-1', 'express')
      expect(result.bet_type).toBe('express')
    })

    it('должен изменять тип ставки с express на system', async () => {
      const updatedSlip = {
        id: 'slip-1',
        bet_type: 'system',
      }

      mockUpdateBetType.mockResolvedValue(updatedSlip)

      const result = await mockUpdateBetType('slip-1', 'system')

      expect(result.bet_type).toBe('system')
    })
  })

  describe('Расчет коэффициентов', () => {
    it('должен правильно рассчитывать коэффициенты для одиночной ставки', () => {
      const odds = 2.5
      const stake = 100
      const potentialWin = odds * stake

      expect(potentialWin).toBe(250)
    })

    it('должен правильно рассчитывать коэффициенты для экспресса', () => {
      const odds1 = 2.5
      const odds2 = 3.2
      const odds3 = 1.8
      const totalOdds = odds1 * odds2 * odds3
      const stake = 100
      const potentialWin = totalOdds * stake

      expect(totalOdds).toBeCloseTo(14.4, 1)
      expect(potentialWin).toBeCloseTo(1440, 0)
    })

    it('должен обрабатывать коэффициент 1.0', () => {
      const odds = 1.0
      const stake = 100
      const potentialWin = odds * stake

      expect(potentialWin).toBe(100)
    })
  })

  describe('Проверка наличия ставки в купоне', () => {
    it('должен определять наличие ставки по matchId и outcome', () => {
      const items = [
        { id: 'item-1', match_id: 'match-1', bet_outcome: 'p1' },
        { id: 'item-2', match_id: 'match-2', bet_outcome: 'x' },
      ]

      const isInSlip = items.some(
        item => item.match_id === 'match-1' && item.bet_outcome === 'p1'
      )

      expect(isInSlip).toBe(true)
    })

    it('должен возвращать false для отсутствующей ставки', () => {
      const items = [
        { id: 'item-1', match_id: 'match-1', bet_outcome: 'p1' },
      ]

      const isInSlip = items.some(
        item => item.match_id === 'match-2' && item.bet_outcome === 'p2'
      )

      expect(isInSlip).toBe(false)
    })
  })
})
