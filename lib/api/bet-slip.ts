import { supabase } from '@/lib/supabase/client'
import {
  BetSlip,
  BetSlipItem,
  BetSlipWithItems,
  AddToBetSlipParams,
  CreateBetSlipParams,
  UpdateStakeParams,
  PlaceBetSlipParams,
  BetType,
} from '@/lib/types/bet-slip'

/**
 * Получить активный купон текущего пользователя
 */
export async function getActiveBetSlip(): Promise<BetSlipWithItems | null> {
  const { data: betSlip, error: betSlipError } = await supabase
    .from('bet_slips')
    .select('id, user_id, status, bet_type, total_odds, stake_amount, potential_win, created_at, updated_at, placed_at')
    .eq('status', 'active')
    .maybeSingle()

  if (betSlipError) {
    console.error('Error fetching active bet slip:', betSlipError)
    throw betSlipError
  }

  if (!betSlip) {
    return null
  }

  // Загружаем элементы купона
  const { data: items, error: itemsError } = await supabase
    .from('bet_slip_items')
    .select('id, bet_slip_id, match_id, match_data, bet_outcome, odds, created_at')
    .eq('bet_slip_id', betSlip.id)
    .order('created_at', { ascending: true })

  if (itemsError) {
    console.error('Error fetching bet slip items:', itemsError)
    throw itemsError
  }

  return {
    ...betSlip,
    items: items || [],
  }
}

/**
 * Создать новый купон
 */
export async function createBetSlip(params: CreateBetSlipParams = {}): Promise<BetSlip> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('bet_slips')
    .insert({
      user_id: user.id,
      bet_type: params.bet_type || 'single',
      status: 'active',
      total_odds: 0,
      stake_amount: 0,
      potential_win: 0,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating bet slip:', error)
    throw error
  }

  return data
}

/**
 * Добавить исход в купон
 */
export async function addItemToBetSlip(
  betSlipId: string,
  params: AddToBetSlipParams
): Promise<BetSlipItem> {
  const { data, error } = await supabase
    .from('bet_slip_items')
    .insert({
      bet_slip_id: betSlipId,
      match_id: params.match_id,
      match_data: params.match_data,
      bet_outcome: params.bet_outcome,
      odds: params.odds,
    })
    .select()
    .single()

  if (error) {
    // Если элемент уже существует
    if (error.code === '23505') {
      throw new Error('Этот матч уже добавлен в купон')
    }
    console.error('Error adding item to bet slip:', error)
    throw error
  }

  // Пересчитываем общий коэффициент
  await recalculateBetSlip(betSlipId)

  return data
}

/**
 * Удалить исход из купона
 */
export async function removeItemFromBetSlip(itemId: string): Promise<void> {
  // Сначала получаем bet_slip_id для пересчета
  const { data: item } = await supabase
    .from('bet_slip_items')
    .select('bet_slip_id')
    .eq('id', itemId)
    .single()

  const { error } = await supabase
    .from('bet_slip_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error('Error removing item from bet slip:', error)
    throw error
  }

  // Пересчитываем общий коэффициент
  if (item) {
    await recalculateBetSlip(item.bet_slip_id)
  }
}

/**
 * Пересчитать общий коэффициент и потенциальный выигрыш
 */
async function recalculateBetSlip(betSlipId: string): Promise<void> {
  // Получаем все элементы купона
  const { data: items, error: itemsError } = await supabase
    .from('bet_slip_items')
    .select('odds')
    .eq('bet_slip_id', betSlipId)

  if (itemsError) {
    console.error('Error fetching items for recalculation:', itemsError)
    return
  }

  // Получаем текущий купон
  const { data: betSlip, error: betSlipError } = await supabase
    .from('bet_slips')
    .select('bet_type, stake_amount')
    .eq('id', betSlipId)
    .single()

  if (betSlipError || !betSlip) {
    console.error('Error fetching bet slip for recalculation:', betSlipError)
    return
  }

  let totalOdds = 0
  let potentialWin = 0

  if (items && items.length > 0) {
    if (betSlip.bet_type === 'express') {
      // Для экспресса перемножаем коэффициенты
      totalOdds = items.reduce((acc, item) => acc * item.odds, 1)
    } else {
      // Для ординара берем коэффициент первого элемента
      totalOdds = items[0].odds
    }

    // Рассчитываем потенциальный выигрыш
    potentialWin = betSlip.stake_amount * totalOdds
  }

  // Обновляем купон
  const { error: updateError } = await supabase
    .from('bet_slips')
    .update({
      total_odds: totalOdds,
      potential_win: potentialWin,
    })
    .eq('id', betSlipId)

  if (updateError) {
    console.error('Error updating bet slip:', updateError)
  }
}

/**
 * Обновить сумму ставки
 */
export async function updateBetSlipStake(params: UpdateStakeParams): Promise<void> {
  const { error } = await supabase
    .from('bet_slips')
    .update({
      stake_amount: params.stake_amount,
    })
    .eq('id', params.bet_slip_id)

  if (error) {
    console.error('Error updating stake amount:', error)
    throw error
  }

  // Пересчитываем потенциальный выигрыш
  await recalculateBetSlip(params.bet_slip_id)
}

/**
 * Разместить ставку (изменить статус на placed)
 */
export async function placeBetSlip(params: PlaceBetSlipParams): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Закрываем ВСЕ другие купоны со статусом 'active' или 'placed'
  await supabase
    .from('bet_slips')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id)
    .in('status', ['active', 'placed'])
    .neq('id', params.bet_slip_id)

  const { error } = await supabase
    .from('bet_slips')
    .update({
      status: 'placed',
      placed_at: new Date().toISOString(),
    })
    .eq('id', params.bet_slip_id)

  if (error) {
    console.error('Error placing bet slip:', error)
    throw error
  }
}

/**
 * Очистить купон (удалить все элементы)
 */
export async function clearBetSlip(betSlipId: string): Promise<void> {
  const { error } = await supabase
    .from('bet_slip_items')
    .delete()
    .eq('bet_slip_id', betSlipId)

  if (error) {
    console.error('Error clearing bet slip:', error)
    throw error
  }

  // Обнуляем коэффициенты и сумму
  await supabase
    .from('bet_slips')
    .update({
      total_odds: 0,
      stake_amount: 0,
      potential_win: 0,
    })
    .eq('id', betSlipId)
}

/**
 * Получить историю купонов
 */
export async function getBetSlipHistory(): Promise<BetSlipWithItems[]> {
  const { data: betSlips, error: betSlipsError } = await supabase
    .from('bet_slips')
    .select('id, user_id, status, bet_type, total_odds, stake_amount, potential_win, created_at, updated_at, placed_at')
    .neq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(100) // Ограничиваем количество для производительности

  if (betSlipsError) {
    console.error('Error fetching bet slip history:', betSlipsError)
    throw betSlipsError
  }

  if (!betSlips || betSlips.length === 0) {
    return []
  }

  // Загружаем элементы для каждого купона одним запросом
  const betSlipIds = betSlips.map(b => b.id)
  const { data: allItems } = await supabase
    .from('bet_slip_items')
    .select('id, bet_slip_id, match_id, match_data, bet_outcome, odds, created_at')
    .in('bet_slip_id', betSlipIds)
    .order('created_at', { ascending: true })

  // Группируем элементы по bet_slip_id
  const itemsByBetSlipId = (allItems || []).reduce((acc, item) => {
    if (!acc[item.bet_slip_id]) {
      acc[item.bet_slip_id] = []
    }
    acc[item.bet_slip_id].push(item)
    return acc
  }, {} as Record<string, typeof allItems>)

  // Собираем результат
  return betSlips.map(betSlip => ({
    ...betSlip,
    items: itemsByBetSlipId[betSlip.id] || [],
  }))
}

/**
 * Изменить тип ставки (ординар/экспресс)
 */
export async function updateBetType(betSlipId: string, betType: BetType): Promise<void> {
  const { error } = await supabase
    .from('bet_slips')
    .update({
      bet_type: betType,
    })
    .eq('id', betSlipId)

  if (error) {
    console.error('Error updating bet type:', error)
    throw error
  }

  // Пересчитываем коэффициенты
  await recalculateBetSlip(betSlipId)
}

/**
 * Обновить статус ставки (выиграла/проиграла/возврат)
 */
export async function updateBetSlipStatus(
  betSlipId: string,
  status: 'won' | 'lost' | 'cancelled'
): Promise<void> {
  // Сначала проверяем текущий статус
  const { data: currentBetSlip, error: fetchError } = await supabase
    .from('bet_slips')
    .select('status')
    .eq('id', betSlipId)
    .single()

  if (fetchError) {
    console.error('Error fetching bet slip:', fetchError)
    throw new Error('Не удалось получить данные ставки')
  }

  // Проверяем, что ставка в статусе 'placed'
  if (currentBetSlip.status !== 'placed') {
    throw new Error('Можно изменить статус только для размещенных ставок')
  }

  const { error } = await supabase
    .from('bet_slips')
    .update({
      status,
    })
    .eq('id', betSlipId)

  if (error) {
    console.error('Error updating bet slip status:', error)
    throw new Error('Ошибка при обновлении статуса ставки')
  }
}

