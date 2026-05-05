import { apiClient } from './axios'
import {
  GetMatchesParams,
  ApiResponseOfApiSaGame,
  ApiSaGame,
  ApiResponseOfLiveOdds,
  ApiResponseOfLiveOddsUpdates,
  getClientTimeZone
} from '../types/api'
import { Match } from '../types'

// Rate limiter для предотвращения 429 ошибок
class RateLimiter {
  private queue: Array<() => Promise<any>> = []
  private processing = false
  private lastRequestTime = 0
  private minDelay = 500 // минимальная задержка между запросами в мс (увеличено до 500мс)
  private requestCount = 0
  private windowStart = Date.now()
  private maxRequestsPerWindow = 10 // максимум 10 запросов
  private windowDuration = 5000 // за 5 секунд

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    while (this.queue.length > 0) {
      const now = Date.now()

      // Сброс счетчика окна если прошло достаточно времени
      if (now - this.windowStart >= this.windowDuration) {
        this.requestCount = 0
        this.windowStart = now
      }

      // Если достигли лимита запросов в окне, ждем до конца окна
      if (this.requestCount >= this.maxRequestsPerWindow) {
        const waitTime = this.windowDuration - (now - this.windowStart)
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
        this.requestCount = 0
        this.windowStart = Date.now()
      }

      // Проверяем минимальную задержку между запросами
      const timeSinceLastRequest = now - this.lastRequestTime
      if (timeSinceLastRequest < this.minDelay) {
        await new Promise(resolve => setTimeout(resolve, this.minDelay - timeSinceLastRequest))
      }

      const task = this.queue.shift()
      if (task) {
        this.lastRequestTime = Date.now()
        this.requestCount++
        await task()
      }
    }

    this.processing = false
  }
}

const rateLimiter = new RateLimiter()

/**
 * Трансформация данных из API в формат приложения
 */
function transformApiMatch(apiMatch: ApiSaGame): Match {
  // Определяем вид спорта из названия лиги
  const leagueName = apiMatch.season?.league?.name || 'Unknown League'
  const sportType = determineSportType(leagueName)

  // Определяем, идет ли матч Live
  // Согласно документации API:
  // Live статусы: 3 (1-й тайм), 4 (перерыв), 5 (2-й тайм), 6 (доп. время), 7 (пенальти), 11 (перерыв в доп. времени), 18 (победа без игры), 19 (матч в процессе)
  const statusNum = parseInt(apiMatch.status)
  const isLive = [3, 4, 5, 6, 7, 11, 18, 19].includes(statusNum)

  // Извлекаем коэффициенты 1X2
  const odds = extractOdds(apiMatch.odds)

  // Парсим минуту матча
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
    is_favorite: false,
  }
}

/**
 * Определение вида спорта по названию лиги
 */
function determineSportType(leagueName: string): string {
  const name = leagueName.toLowerCase()

  if (name.includes('hockey') || name.includes('nhl') || name.includes('khl')) {
    return 'hockey'
  }
  if (name.includes('tennis') || name.includes('atp') || name.includes('wta')) {
    return 'tennis'
  }
  if (name.includes('basketball') || name.includes('nba') || name.includes('euroleague')) {
    return 'basketball'
  }
  if (name.includes('volleyball')) {
    return 'volleyball'
  }
  if (name.includes('esport') || name.includes('dota') || name.includes('cs:go') || name.includes('lol')) {
    return 'esports'
  }

  // По умолчанию футбол
  return 'football'
}

/**
 * Извлечение коэффициентов 1X2 из массива ставок
 */
function extractOdds(bets: any[]): { p1: number; x: number; p2: number } {
  console.log('extractOdds called with bets:', bets)

  if (!bets || bets.length === 0) {
    console.log('No bets data')
    return { p1: 0, x: 0, p2: 0 }
  }

  // Ищем рынок "Fulltime Result", "1X2" или "Match Winner"
  const mainMarket = bets.find(bet =>
    bet.marketName === 'Fulltime Result' ||
    bet.marketName === '1X2' ||
    bet.marketName === 'Match Winner' ||
    bet.marketId === '1'
  )

  console.log('Main market found:', mainMarket)

  if (!mainMarket || !mainMarket.odds) {
    console.log('Main market not found, trying first market with odds')
    // Если не нашли, пробуем взять первый рынок с коэффициентами
    const firstMarketWithOdds = bets.find(bet => bet.odds && bet.odds.length >= 2)
    console.log('First market with odds:', firstMarketWithOdds)

    if (!firstMarketWithOdds) {
      return { p1: 0, x: 0, p2: 0 }
    }

    // Используем первый рынок
    const odds = { p1: 0, x: 0, p2: 0 }
    if (firstMarketWithOdds.odds[0]) odds.p1 = parseFloat(firstMarketWithOdds.odds[0].value) || 0
    if (firstMarketWithOdds.odds[1]) odds.x = parseFloat(firstMarketWithOdds.odds[1].value) || 0
    if (firstMarketWithOdds.odds[2]) odds.p2 = parseFloat(firstMarketWithOdds.odds[2].value) || 0

    console.log('Extracted odds from first market:', odds)
    return odds
  }

  const odds = { p1: 0, x: 0, p2: 0 }

  mainMarket.odds.forEach((price: any) => {
    const value = parseFloat(price.value) || 0
    const name = price.name?.toLowerCase() || ''

    if (name === '1' || name === 'home') {
      odds.p1 = value
    } else if (name === 'x' || name === 'draw') {
      odds.x = value
    } else if (name === '2' || name === 'away') {
      odds.p2 = value
    }
  })

  console.log('Extracted odds from main market:', odds)
  return odds
}

/**
 * Получение списка матчей с API sstats.net
 */
export async function fetchMatches(params: GetMatchesParams = {}): Promise<{
  matches: Match[]
  total: number
  hasMore: boolean
}> {
  // Устанавливаем дефолтные значения
  const requestParams: any = {
    TimeZone: params.TimeZone ?? getClientTimeZone(),
    Limit: params.Limit ?? 1000,
    Offset: params.Offset ?? 0,
  }

  // Добавляем Today только если не указаны Live или Upcoming
  if (!params.Live && !params.Upcoming) {
    requestParams.Today = params.Today ?? true
  }

  // Добавляем Live или Upcoming если указаны
  if (params.Live !== undefined) {
    requestParams.Live = params.Live
  }
  if (params.Upcoming !== undefined) {
    requestParams.Upcoming = params.Upcoming
  }

  try {
    const response = await apiClient.get<ApiResponseOfApiSaGame>('/Games/list', {
      params: requestParams,
    })

    const matches = response.data.data.map(transformApiMatch)
    const total = parseInt(response.data.TotalCount) || 0
    const offset = parseInt(response.data.offset) || 0
    const hasMore = (offset + matches.length) < total

    return {
      matches,
      total,
      hasMore,
    }
  } catch (error) {
    console.error('Error fetching matches:', error)
    throw error
  }
}

/**
 * Получение всех матчей с автоматической пагинацией
 * Используется когда нужно загрузить все матчи за день (если их больше 1000)
 */
export async function fetchAllMatches(params: GetMatchesParams = {}): Promise<Match[]> {
  const allMatches: Match[] = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const result = await fetchMatches({
      ...params,
      Offset: offset,
    })

    allMatches.push(...result.matches)
    hasMore = result.hasMore
    offset += result.matches.length

    // Защита от бесконечного цикла
    if (offset > 10000) {
      console.warn('Reached maximum offset limit (10000)')
      break
    }
  }

  return allMatches
}

/**
 * Получение только Live матчей
 */
export async function fetchLiveMatches(): Promise<Match[]> {
  const result = await fetchMatches({
    Today: true,
    Live: true,
  })
  return result.matches
}

/**
 * Получение только предстоящих матчей
 */
export async function fetchUpcomingMatches(): Promise<Match[]> {
  const result = await fetchMatches({
    Today: true,
    Upcoming: true,
  })
  return result.matches
}

/**
 * Получение Live-коэффициентов для конкретного матча
 */
export async function fetchLiveOdds(gameId: string | number): Promise<{
  elapsed: string
  odds: { p1: number; x: number; p2: number }
} | null> {
  return rateLimiter.add(async () => {
    try {
      const response = await apiClient.get<ApiResponseOfLiveOdds>(`/Odds/live/${gameId}`)

      if (response.data.status !== 'OK' || !response.data.data) {
        return null
      }

      const liveData = response.data.data

      // Извлекаем коэффициенты 1X2
      const odds = extractOdds(liveData.odds)

      return {
        elapsed: liveData.elapsed,
        odds: odds,
      }
    } catch (error) {
      // Игнорируем 429 ошибки в консоли, они обрабатываются rate limiter
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } }
        if (axiosError.response?.status !== 429) {
          console.error(`Error fetching live odds for game ${gameId}:`, error)
        }
      } else {
        console.error(`Error fetching live odds for game ${gameId}:`, error)
      }
      return null
    }
  })
}

/**
 * Проверка обновлений Live-коэффициентов для списка матчей
 * Возвращает только те матчи, у которых изменились коэффициенты
 * Разбивает запросы на батчи для предотвращения timeout
 */
export async function checkLiveOddsUpdates(gameIds: (string | number)[]): Promise<string[]> {
  if (gameIds.length === 0) return []

  try {
    const batchSize = 20 // Проверяем по 20 матчей за раз
    const allUpdatedIds: string[] = []

    for (let i = 0; i < gameIds.length; i += batchSize) {
      const batch = gameIds.slice(i, i + batchSize)
      const idsString = batch.join(',')

      const response = await apiClient.get<ApiResponseOfLiveOddsUpdates>(
        '/Odds/live-changes/updates-only',
        {
          params: { gameId: idsString }
        }
      )

      if (response.data.status === 'OK' && response.data.data) {
        allUpdatedIds.push(...response.data.data.map(update => update.gameId))
      }

      // Небольшая задержка между батчами
      if (i + batchSize < gameIds.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    return allUpdatedIds
  } catch (error) {
    console.error('Error checking live odds updates:', error)
    return []
  }
}

/**
 * Получение Live-коэффициентов для нескольких матчей
 * Сначала проверяет, какие матчи обновились, затем запрашивает только их
 * Использует батчинг для уменьшения количества запросов
 */
export async function fetchMultipleLiveOdds(gameIds: (string | number)[]): Promise<Map<string, {
  elapsed: string
  odds: { p1: number; x: number; p2: number }
}>> {
  const result = new Map()

  if (gameIds.length === 0) return result

  try {
    // Ограничиваем количество матчей для запроса (максимум 50)
    const limitedIds = gameIds.slice(0, 50)

    // Проверяем, какие матчи обновились
    const updatedIds = await checkLiveOddsUpdates(limitedIds)

    if (updatedIds.length === 0) return result

    // Ограничиваем количество запросов коэффициентов (максимум 20)
    const limitedUpdatedIds = updatedIds.slice(0, 20)

    // Обрабатываем запросы последовательно с небольшими батчами
    const batchSize = 2 // обрабатываем по 2 запроса одновременно
    const batchDelay = 1000 // задержка между батчами 1 секунда

    for (let i = 0; i < limitedUpdatedIds.length; i += batchSize) {
      const batch = limitedUpdatedIds.slice(i, i + batchSize)
      const promises = batch.map(async (gameId) => {
        const odds = await fetchLiveOdds(gameId)
        if (odds) {
          result.set(gameId.toString(), odds)
        }
      })

      await Promise.all(promises)

      // Добавляем задержку между батчами (кроме последнего)
      if (i + batchSize < limitedUpdatedIds.length) {
        await new Promise(resolve => setTimeout(resolve, batchDelay))
      }
    }
  } catch (error) {
    console.error('Error fetching multiple live odds:', error)
  }

  return result
}
