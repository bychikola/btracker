// Типы для системы купонов ставок

// Статус купона
export type BetSlipStatus = 'active' | 'placed' | 'won' | 'lost' | 'returned' | 'cancelled'

// Тип ставки
export type BetType = 'single' | 'express' | 'system'

// Исход ставки
export type BetOutcome = 'home' | 'draw' | 'away'

// Данные матча для купона
export interface BetSlipMatchData {
  match_id: string
  sport_type: string
  league_name: string
  team1: {
    name: string
    logo?: string
  }
  team2: {
    name: string
    logo?: string
  }
  start_time: string
  is_live: boolean
}

// Элемент купона (один исход)
export interface BetSlipItem {
  id: string
  bet_slip_id: string
  match_id: string
  match_data: BetSlipMatchData
  bet_outcome: BetOutcome
  odds: number
  created_at: string
}

// Купон ставок
export interface BetSlip {
  id: string
  user_id: string
  status: BetSlipStatus
  bet_type: BetType
  total_odds: number
  stake_amount: number
  potential_win: number
  created_at: string
  updated_at: string
  placed_at: string | null
  items?: BetSlipItem[] // Опционально, загружается отдельно
}

// Параметры для добавления исхода в купон
export interface AddToBetSlipParams {
  match_id: string
  match_data: BetSlipMatchData
  bet_outcome: BetOutcome
  odds: number
}

// Параметры для создания купона
export interface CreateBetSlipParams {
  bet_type?: BetType
}

// Параметры для обновления суммы ставки
export interface UpdateStakeParams {
  bet_slip_id: string
  stake_amount: number
}

// Параметры для размещения ставки
export interface PlaceBetSlipParams {
  bet_slip_id: string
}

// Полный купон с элементами
export interface BetSlipWithItems extends BetSlip {
  items: BetSlipItem[]
}

// Названия исходов для отображения
export const BET_OUTCOME_LABELS: Record<BetOutcome, string> = {
  home: 'П1',
  draw: 'X',
  away: 'П2',
}

// Названия типов ставок
export const BET_TYPE_LABELS: Record<BetType, string> = {
  single: 'Ординар',
  express: 'Экспресс',
  system: 'Система',
}

// Названия статусов купонов
export const BET_SLIP_STATUS_LABELS: Record<BetSlipStatus, string> = {
  active: 'Активный',
  placed: 'Размещен',
  won: 'Выигран',
  lost: 'Проигран',
  returned: 'Возврат',
  cancelled: 'Отменен',
}
