import { apiClient } from './axios'
import {
  GetMatchesParams,
  ApiResponseOfApiSaGame,
  ApiResponseOfLiveOdds,
  ApiResponseOfLiveOddsUpdates,
  ApiResponseOfApiSaGameFull,
  ApiSaGameFull,
  ApiSaBookmakerOdds,
  ApiGameGlicko,
  ApiMatchProfit,
  getClientTimeZone
} from '../types/api'
import { Match } from '../types'
import { transformApiMatch, extractOdds } from './transformers'

// Rate limiter для предотвращения 429 ошибок
class RateLimiter {
  private queue: Array<() => Promise<any>> = []
  private processing = false
  private lastRequestTime = 0
  private minDelay = 500
  private requestCount = 0
  private windowStart = Date.now()
  private maxRequestsPerWindow = 10
  private windowDuration = 5000

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

      if (now - this.windowStart >= this.windowDuration) {
        this.requestCount = 0
        this.windowStart = now
      }

      if (this.requestCount >= this.maxRequestsPerWindow) {
        const waitTime = this.windowDuration - (now - this.windowStart)
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
        this.requestCount = 0
        this.windowStart = Date.now()
      }

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
 * Получение ОДНОГО матча с ПОЛНЫМИ данными (статистика, составы, события, игроки)
 * Использует /Games/{id} — самый насыщенный эндпоинт API
 * В одном запросе возвращает: матч + статистика + составы + события + игроки + стадион
 */
export async function fetchFullMatchById(gameId: string): Promise<ApiSaGameFull | null> {
  try {
    const response = await apiClient.get<ApiResponseOfApiSaGameFull>(`/Games/${gameId}`)

    if (response.data.status !== 'OK' || !response.data.data) {
      return null
    }

    return response.data.data
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } }
      if (axiosError.response?.status === 404) {
        return null
      }
    }
    console.error(`Error fetching full match ${gameId}:`, error)
    throw error
  }
}

/**
 * Получение одного матча по ID (короткая форма, для совместимости)
 */
export async function fetchMatchById(gameId: string): Promise<Match | null> {
  try {
    const response = await apiClient.get<{ status: string; data: any }>(`/Games/${gameId}`)

    if (response.data.status !== 'OK' || !response.data.data) {
      return null
    }

    // /Games/{id} может вернуть ApiSaGameFull (с вложенным game) или чистый ApiSaGame
    const data = response.data.data
    const gameData = data.game || data
    return transformApiMatch(gameData)
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } }
      if (axiosError.response?.status === 404) {
        return null
      }
    }
    console.error(`Error fetching match ${gameId}:`, error)
    throw error
  }
}

/**
 * Получение ВСЕХ доматчевых коэффициентов от ВСЕХ букмекеров
 * /Odds/{gameId} — все рынки, все букмекеры
 */
export async function fetchPrematchOdds(gameId: string | number): Promise<ApiSaBookmakerOdds[]> {
  try {
    const response = await apiClient.get<{ status: string; data: ApiSaBookmakerOdds[] }>(`/Odds/${gameId}`)

    if (response.data.status !== 'OK' || !response.data.data) {
      return []
    }

    return response.data.data
  } catch (error) {
    console.error(`Error fetching prematch odds for ${gameId}:`, error)
    return []
  }
}

/**
 * Получение Glicko-2 рейтингов, xG и вероятностей исхода
 * /Games/glicko/{id}
 */
export async function fetchGlicko(gameId: string | number): Promise<ApiGameGlicko | null> {
  try {
    const response = await apiClient.get<{ status: string; data: ApiGameGlicko }>(`/Games/glicko/${gameId}`)

    if (response.data.status !== 'OK' || !response.data.data) {
      return null
    }

    return response.data.data
  } catch (error) {
    console.error(`Error fetching glicko for ${gameId}:`, error)
    return null
  }
}

/**
 * Получение анализа прибыльности по всем рынкам
 * /Games/profits?gameId={id}
 */
export async function fetchProfits(gameId: string | number): Promise<ApiMatchProfit | null> {
  try {
    const response = await apiClient.get<{ status: string; data: ApiMatchProfit }>(`/Games/profits`, {
      params: { gameId }
    })

    if (response.data.status !== 'OK' || !response.data.data) {
      return null
    }

    return response.data.data
  } catch (error) {
    console.error(`Error fetching profits for ${gameId}:`, error)
    return null
  }
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
