import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Копируем класс RateLimiter для тестирования
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

  // Методы для тестирования
  getQueueLength(): number {
    return this.queue.length
  }

  getRequestCount(): number {
    return this.requestCount
  }
}

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    rateLimiter = new RateLimiter()
    jest.clearAllTimers()
  })

  describe('Базовая функциональность', () => {
    it('должен выполнять одиночный запрос', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')

      const result = await rateLimiter.add(mockFn)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('должен выполнять несколько запросов последовательно', async () => {
      const results: number[] = []
      const mockFn1 = jest.fn().mockResolvedValue(1)
      const mockFn2 = jest.fn().mockResolvedValue(2)
      const mockFn3 = jest.fn().mockResolvedValue(3)

      const promise1 = rateLimiter.add(mockFn1).then(r => results.push(r))
      const promise2 = rateLimiter.add(mockFn2).then(r => results.push(r))
      const promise3 = rateLimiter.add(mockFn3).then(r => results.push(r))

      await Promise.all([promise1, promise2, promise3])

      expect(results).toEqual([1, 2, 3])
      expect(mockFn1).toHaveBeenCalledTimes(1)
      expect(mockFn2).toHaveBeenCalledTimes(1)
      expect(mockFn3).toHaveBeenCalledTimes(1)
    })

    it('должен обрабатывать ошибки в запросах', async () => {
      const error = new Error('Test error')
      const mockFn = jest.fn().mockRejectedValue(error)

      await expect(rateLimiter.add(mockFn)).rejects.toThrow('Test error')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('Минимальная задержка между запросами', () => {
    it('должен соблюдать минимальную задержку 500мс между запросами', async () => {
      const timestamps: number[] = []
      const mockFn = jest.fn().mockImplementation(async () => {
        timestamps.push(Date.now())
        return 'success'
      })

      await rateLimiter.add(mockFn)
      await rateLimiter.add(mockFn)
      await rateLimiter.add(mockFn)

      // Проверяем что между запросами прошло минимум 500мс
      expect(timestamps[1] - timestamps[0]).toBeGreaterThanOrEqual(500)
      expect(timestamps[2] - timestamps[1]).toBeGreaterThanOrEqual(500)
    }, 10000)
  })

  describe('Ограничение количества запросов в окне', () => {
    it('должен ограничивать до 10 запросов за 5 секунд', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')
      const promises: Promise<any>[] = []

      // Добавляем 15 запросов
      for (let i = 0; i < 15; i++) {
        promises.push(rateLimiter.add(mockFn))
      }

      const startTime = Date.now()
      await Promise.all(promises)
      const endTime = Date.now()

      // Первые 10 запросов должны выполниться в первом окне (5 сек + задержки)
      // Следующие 5 должны ждать нового окна
      // Общее время должно быть больше 5 секунд
      expect(endTime - startTime).toBeGreaterThan(5000)
      expect(mockFn).toHaveBeenCalledTimes(15)
    }, 20000)
  })

  describe('Очередь запросов', () => {
    it('должен добавлять запросы в очередь', async () => {
      const slowMockFn = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('slow'), 1000))
      )

      // Добавляем первый запрос который будет выполняться
      const promise1 = rateLimiter.add(slowMockFn)

      // Даем время на начало обработки
      await new Promise(resolve => setTimeout(resolve, 100))

      // Добавляем еще запросы - они должны попасть в очередь
      const promise2 = rateLimiter.add(slowMockFn)
      const promise3 = rateLimiter.add(slowMockFn)

      // Проверяем что в очереди есть запросы
      expect(rateLimiter.getQueueLength()).toBeGreaterThan(0)

      await Promise.all([promise1, promise2, promise3])

      // После выполнения очередь должна быть пуста
      expect(rateLimiter.getQueueLength()).toBe(0)
    }, 15000)
  })

  describe('Параллельные вызовы', () => {
    it('должен корректно обрабатывать параллельные вызовы add()', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')

      // Запускаем несколько add() одновременно
      const promises = Array.from({ length: 5 }, () => rateLimiter.add(mockFn))

      const results = await Promise.all(promises)

      expect(results).toEqual(['success', 'success', 'success', 'success', 'success'])
      expect(mockFn).toHaveBeenCalledTimes(5)
    }, 10000)
  })

  describe('Сброс счетчика окна', () => {
    it('должен сбрасывать счетчик после истечения окна', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')

      // Выполняем 5 запросов
      for (let i = 0; i < 5; i++) {
        await rateLimiter.add(mockFn)
      }

      const countAfterFirst = rateLimiter.getRequestCount()
      expect(countAfterFirst).toBe(5)

      // Ждем больше 5 секунд (окно должно сброситься)
      await new Promise(resolve => setTimeout(resolve, 6000))

      // Выполняем еще один запрос
      await rateLimiter.add(mockFn)

      // Счетчик должен сброситься
      const countAfterReset = rateLimiter.getRequestCount()
      expect(countAfterReset).toBeLessThan(countAfterFirst)
    }, 15000)
  })

  describe('Обработка быстрых последовательных запросов', () => {
    it('должен корректно обрабатывать быстрые последовательные вызовы', async () => {
      const results: string[] = []
      const mockFn = (id: string) => jest.fn().mockResolvedValue(id)

      // Быстро добавляем 3 запроса
      const p1 = rateLimiter.add(mockFn('first')).then(r => results.push(r))
      const p2 = rateLimiter.add(mockFn('second')).then(r => results.push(r))
      const p3 = rateLimiter.add(mockFn('third')).then(r => results.push(r))

      await Promise.all([p1, p2, p3])

      // Все запросы должны выполниться в правильном порядке
      expect(results).toEqual(['first', 'second', 'third'])
    }, 10000)
  })
})
