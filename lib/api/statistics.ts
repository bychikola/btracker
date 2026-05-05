import { supabase } from '../supabase/client'

export interface BetStatistics {
  totalBets: number
  wonBets: number
  lostBets: number
  pendingBets: number
  winRate: number
  totalStaked: number
  totalWon: number
  totalProfit: number
  roi: number
  averageOdds: number
  biggestWin: number
  biggestLoss: number
}

export interface SportStatistics {
  sport_type: string
  totalBets: number
  wonBets: number
  winRate: number
  totalStaked: number
  totalProfit: number
  roi: number
}

export interface LeagueStatistics {
  league_name: string
  sport_type: string
  totalBets: number
  wonBets: number
  winRate: number
  totalStaked: number
  totalProfit: number
  roi: number
}

export interface ProfitOverTime {
  date: string
  profit: number
  cumulativeProfit: number
}

/**
 * Получить общую статистику ставок пользователя
 */
export async function getBetStatistics(): Promise<BetStatistics> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Получаем все завершенные ставки
  const { data: betSlips, error } = await supabase
    .from('bet_slips')
    .select('*, bet_slip_items(*)')
    .eq('user_id', user.id)
    .in('status', ['won', 'lost'])

  if (error) throw error

  const totalBets = betSlips?.length || 0
  const wonBets = betSlips?.filter(b => b.status === 'won').length || 0
  const lostBets = betSlips?.filter(b => b.status === 'lost').length || 0

  // Получаем pending ставки
  const { data: pendingSlips } = await supabase
    .from('bet_slips')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'placed')

  const pendingBets = pendingSlips?.length || 0

  const totalStaked = betSlips?.reduce((sum, b) => sum + b.stake_amount, 0) || 0
  const totalWon = betSlips
    ?.filter(b => b.status === 'won')
    .reduce((sum, b) => sum + b.potential_win, 0) || 0

  const totalProfit = totalWon - totalStaked
  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0
  const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0

  const averageOdds = betSlips && betSlips.length > 0
    ? betSlips.reduce((sum, b) => sum + b.total_odds, 0) / betSlips.length
    : 0

  const wonSlips = betSlips?.filter(b => b.status === 'won') || []
  const lostSlips = betSlips?.filter(b => b.status === 'lost') || []

  const biggestWin = wonSlips.length > 0
    ? Math.max(...wonSlips.map(b => b.potential_win - b.stake_amount))
    : 0

  const biggestLoss = lostSlips.length > 0
    ? Math.max(...lostSlips.map(b => b.stake_amount))
    : 0

  return {
    totalBets,
    wonBets,
    lostBets,
    pendingBets,
    winRate,
    totalStaked,
    totalWon,
    totalProfit,
    roi,
    averageOdds,
    biggestWin,
    biggestLoss,
  }
}

/**
 * Получить статистику по видам спорта
 */
export async function getSportStatistics(): Promise<SportStatistics[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: betSlips, error } = await supabase
    .from('bet_slips')
    .select('*, bet_slip_items(*)')
    .eq('user_id', user.id)
    .in('status', ['won', 'lost'])

  if (error) throw error
  if (!betSlips) return []

  // Группируем по видам спорта
  const sportMap = new Map<string, {
    bets: typeof betSlips
    staked: number
    won: number
  }>()

  betSlips.forEach(slip => {
    if (!slip.bet_slip_items || slip.bet_slip_items.length === 0) return

    const sportType = slip.bet_slip_items[0].match_data.sport_type

    if (!sportMap.has(sportType)) {
      sportMap.set(sportType, { bets: [], staked: 0, won: 0 })
    }

    const sport = sportMap.get(sportType)!
    sport.bets.push(slip)
    sport.staked += slip.stake_amount

    if (slip.status === 'won') {
      sport.won += slip.potential_win
    }
  })

  return Array.from(sportMap.entries()).map(([sport_type, data]) => {
    const totalBets = data.bets.length
    const wonBets = data.bets.filter(b => b.status === 'won').length
    const totalProfit = data.won - data.staked

    return {
      sport_type,
      totalBets,
      wonBets,
      winRate: totalBets > 0 ? (wonBets / totalBets) * 100 : 0,
      totalStaked: data.staked,
      totalProfit,
      roi: data.staked > 0 ? (totalProfit / data.staked) * 100 : 0,
    }
  }).sort((a, b) => b.totalBets - a.totalBets)
}

/**
 * Получить статистику по лигам
 */
export async function getLeagueStatistics(): Promise<LeagueStatistics[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: betSlips, error } = await supabase
    .from('bet_slips')
    .select('*, bet_slip_items(*)')
    .eq('user_id', user.id)
    .in('status', ['won', 'lost'])

  if (error) throw error
  if (!betSlips) return []

  // Группируем по лигам
  const leagueMap = new Map<string, {
    sport_type: string
    bets: typeof betSlips
    staked: number
    won: number
  }>()

  betSlips.forEach(slip => {
    if (!slip.bet_slip_items || slip.bet_slip_items.length === 0) return

    const leagueName = slip.bet_slip_items[0].match_data.league_name
    const sportType = slip.bet_slip_items[0].match_data.sport_type

    if (!leagueMap.has(leagueName)) {
      leagueMap.set(leagueName, { sport_type: sportType, bets: [], staked: 0, won: 0 })
    }

    const league = leagueMap.get(leagueName)!
    league.bets.push(slip)
    league.staked += slip.stake_amount

    if (slip.status === 'won') {
      league.won += slip.potential_win
    }
  })

  return Array.from(leagueMap.entries()).map(([league_name, data]) => {
    const totalBets = data.bets.length
    const wonBets = data.bets.filter(b => b.status === 'won').length
    const totalProfit = data.won - data.staked

    return {
      league_name,
      sport_type: data.sport_type,
      totalBets,
      wonBets,
      winRate: totalBets > 0 ? (wonBets / totalBets) * 100 : 0,
      totalStaked: data.staked,
      totalProfit,
      roi: data.staked > 0 ? (totalProfit / data.staked) * 100 : 0,
    }
  }).sort((a, b) => b.totalBets - a.totalBets).slice(0, 10) // Топ 10 лиг
}

/**
 * Получить динамику прибыли по времени
 */
export async function getProfitOverTime(): Promise<ProfitOverTime[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: betSlips, error } = await supabase
    .from('bet_slips')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['won', 'lost'])
    .order('placed_at', { ascending: true })

  if (error) throw error
  if (!betSlips || betSlips.length === 0) return []

  let cumulativeProfit = 0
  const profitByDate = new Map<string, number>()

  betSlips.forEach(slip => {
    const date = new Date(slip.placed_at || slip.created_at).toISOString().split('T')[0]
    const profit = slip.status === 'won'
      ? slip.potential_win - slip.stake_amount
      : -slip.stake_amount

    profitByDate.set(date, (profitByDate.get(date) || 0) + profit)
  })

  return Array.from(profitByDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, profit]) => {
      cumulativeProfit += profit
      return {
        date,
        profit,
        cumulativeProfit,
      }
    })
}
