// Типы для истории изменений статусов ставок

export interface BetSlipStatusHistory {
  id: string
  bet_slip_id: string
  old_status: string | null
  new_status: string
  changed_at: string
  changed_by: string | null
  note: string | null
}

export interface BetSlipStatusHistoryWithUser extends BetSlipStatusHistory {
  user?: {
    username: string
    avatar?: string
  }
}
