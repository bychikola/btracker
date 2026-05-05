import { supabase } from '../supabase/client'
import { BetSlipStatusHistory } from '../types/bet-slip-history'

/**
 * Получить историю изменений статуса купона
 */
export async function getBetSlipStatusHistory(betSlipId: string): Promise<BetSlipStatusHistory[]> {
  const { data, error } = await supabase
    .from('bet_slip_status_history')
    .select('*')
    .eq('bet_slip_id', betSlipId)
    .order('changed_at', { ascending: false })

  if (error) {
    console.error('Error fetching bet slip status history:', error)
    throw error
  }

  return data || []
}
