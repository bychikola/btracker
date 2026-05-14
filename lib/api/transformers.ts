import { ApiSaGame } from '../types/api'
import { Match, MatchMarkets, MarketOdds } from '../types'

/**
 * Определение вида спорта по названию лиги
 */
export function determineSportType(leagueName: string): string {
  const name = leagueName.toLowerCase()
  if (name.includes('hockey') || name.includes('nhl') || name.includes('khl')) return 'hockey'
  if (name.includes('tennis') || name.includes('atp') || name.includes('wta')) return 'tennis'
  if (name.includes('basketball') || name.includes('nba') || name.includes('euroleague')) return 'basketball'
  if (name.includes('volleyball')) return 'volleyball'
  if (name.includes('esport') || name.includes('dota') || name.includes('cs:go') || name.includes('lol') || name.includes('valorant') || name.includes('overwatch')) return 'esports'
  return 'football'
}

/**
 * Определяем читаемое название рынка
 */
function getMarketLabel(marketId: string, outcomes: any[]): string {
  // Пытаемся определить порог тотала из названий исходов
  const firstOutcome = outcomes[0]?.name || ''
  const totalMatch = firstOutcome.match(/(\d+\.?\d*)/)
  if (totalMatch) {
    return `Тотал ${totalMatch[1]}`
  }

  const labels: Record<string, string> = {
    '1': 'Основной исход',
    '2': 'Исход',
    '12': 'Двойной шанс',
  }
  return labels[marketId] || `Рынок ${marketId}`
}

/**
 * Извлечение ВСЕХ рынков коэффициентов из массива ставок API
 */
export function extractAllMarkets(bets: any[]): MatchMarkets {
  const result: MatchMarkets = {
    fullTimeResult: { label: 'Основной исход', outcomes: [] },
    doubleChance: null,
    totals: [],
    other: [],
  }

  if (!bets || bets.length === 0) return result

  const isTotalMarket = (id: string) =>
    ['2', '5', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'].includes(id)

  for (const bet of bets) {
    const marketId = String(bet.marketId)
    const outcomes = (bet.odds || []).map((p: any) => ({
      name: p.name,
      value: parseFloat(p.value) || 0,
    })).filter((o: any) => o.value > 0)

    if (outcomes.length === 0) continue

    const market: MarketOdds = {
      label: bet.marketName || getMarketLabel(marketId, outcomes),
      outcomes,
    }

    if (marketId === '1') {
      result.fullTimeResult = market
    } else if (marketId === '12') {
      result.doubleChance = market
    } else if (isTotalMarket(marketId)) {
      result.totals.push(market)
    } else {
      result.other.push(market)
    }
  }

  // Сортируем тоталы по возрастанию порога
  result.totals.sort((a, b) => {
    const aNum = parseFloat((a.outcomes[0]?.name || '').replace(/[^0-9.]/g, '')) || 0
    const bNum = parseFloat((b.outcomes[0]?.name || '').replace(/[^0-9.]/g, '')) || 0
    return aNum - bNum
  })

  return result
}

/**
 * Извлечение коэффициентов 1X2
 */
export function extractOdds(bets: any[]): { p1: number; x: number; p2: number } {
  if (!bets || bets.length === 0) return { p1: 0, x: 0, p2: 0 }

  const mainMarket = bets.find((bet: any) =>
    bet.marketName === 'Fulltime Result' || bet.marketName === '1X2' ||
    bet.marketName === 'Match Winner' || bet.marketId === '1'
  )

  if (!mainMarket || !mainMarket.odds) {
    const firstMarketWithOdds = bets.find((bet: any) => bet.odds && bet.odds.length >= 2)
    if (!firstMarketWithOdds) return { p1: 0, x: 0, p2: 0 }
    return {
      p1: parseFloat(firstMarketWithOdds.odds[0]?.value) || 0,
      x: parseFloat(firstMarketWithOdds.odds[1]?.value) || 0,
      p2: parseFloat(firstMarketWithOdds.odds[2]?.value) || 0,
    }
  }

  const odds = { p1: 0, x: 0, p2: 0 }
  mainMarket.odds.forEach((price: any) => {
    const value = parseFloat(price.value) || 0
    const name = (price.name || '').toLowerCase()
    if (name === '1' || name === 'home') odds.p1 = value
    else if (name === 'x' || name === 'draw') odds.x = value
    else if (name === '2' || name === 'away') odds.p2 = value
  })
  return odds
}

/**
 * Трансформация данных из API в формат приложения
 */
export function transformApiMatch(apiMatch: ApiSaGame): Match {
  const leagueName = apiMatch.season?.league?.name || 'Unknown League'
  const sportType = determineSportType(leagueName)
  const statusNum = parseInt(apiMatch.status)
  const isLive = [3, 4, 5, 6, 7, 11, 18, 19].includes(statusNum)
  const odds = extractOdds(apiMatch.odds)
  const markets = extractAllMarkets(apiMatch.odds)
  const elapsed = apiMatch.elapsed ? parseInt(apiMatch.elapsed) : undefined

  return {
    id: apiMatch.id,
    sport_type: sportType,
    league_name: leagueName,
    team1: {
      id: apiMatch.homeTeam?.id || '0',
      name: apiMatch.homeTeam?.name || 'Team 1',
      logo: apiMatch.homeTeam?.logoUrl || undefined,
    },
    team2: {
      id: apiMatch.awayTeam?.id || '0',
      name: apiMatch.awayTeam?.name || 'Team 2',
      logo: apiMatch.awayTeam?.logoUrl || undefined,
    },
    start_time: apiMatch.date || new Date().toISOString(),
    is_live: isLive,
    elapsed: elapsed,
    score: (apiMatch.homeResult !== undefined && apiMatch.awayResult !== undefined) ? {
      team1: parseInt(apiMatch.homeResult) || 0,
      team2: parseInt(apiMatch.awayResult) || 0,
    } : undefined,
    odds: odds,
    markets: markets,
    is_favorite: false,
  }
}
