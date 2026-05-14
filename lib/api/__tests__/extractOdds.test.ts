import { describe, it, expect } from '@jest/globals'

// Импортируем типы для тестирования
type OddsResult = { p1: number; x: number; p2: number }

// Копируем функцию extractOdds для тестирования
// В реальном проекте нужно экспортировать её из sstats.ts
function extractOdds(bets: any[]): OddsResult {
  if (!bets || bets.length === 0) {
    return { p1: 0, x: 0, p2: 0 }
  }

  const mainMarket = bets.find(bet =>
    bet.marketName === 'Fulltime Result' ||
    bet.marketName === '1X2' ||
    bet.marketName === 'Match Winner' ||
    bet.marketId === '1'
  )

  if (!mainMarket || !mainMarket.odds) {
    const firstMarketWithOdds = bets.find(bet => bet.odds && bet.odds.length >= 2)

    if (!firstMarketWithOdds) {
      return { p1: 0, x: 0, p2: 0 }
    }

    const odds = { p1: 0, x: 0, p2: 0 }
    if (firstMarketWithOdds.odds[0]) odds.p1 = parseFloat(firstMarketWithOdds.odds[0].value) || 0
    if (firstMarketWithOdds.odds[1]) odds.x = parseFloat(firstMarketWithOdds.odds[1].value) || 0
    if (firstMarketWithOdds.odds[2]) odds.p2 = parseFloat(firstMarketWithOdds.odds[2].value) || 0

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

  return odds
}

describe('extractOdds', () => {
  describe('Обработка пустых данных', () => {
    it('должен возвращать нулевые коэффициенты для пустого массива', () => {
      const result = extractOdds([])
      expect(result).toEqual({ p1: 0, x: 0, p2: 0 })
    })

    it('должен возвращать нулевые коэффициенты для null', () => {
      const result = extractOdds(null as any)
      expect(result).toEqual({ p1: 0, x: 0, p2: 0 })
    })

    it('должен возвращать нулевые коэффициенты для undefined', () => {
      const result = extractOdds(undefined as any)
      expect(result).toEqual({ p1: 0, x: 0, p2: 0 })
    })
  })

  describe('Извлечение из основного рынка 1X2', () => {
    it('должен извлекать коэффициенты из рынка "Fulltime Result"', () => {
      const bets = [
        {
          marketName: 'Fulltime Result',
          odds: [
            { name: '1', value: '2.50' },
            { name: 'X', value: '3.20' },
            { name: '2', value: '2.80' },
          ],
        },
      ]

      const result = extractOdds(bets)
      expect(result).toEqual({ p1: 2.5, x: 3.2, p2: 2.8 })
    })

    it('должен извлекать коэффициенты из рынка "1X2"', () => {
      const bets = [
        {
          marketName: '1X2',
          odds: [
            { name: 'Home', value: '1.95' },
            { name: 'Draw', value: '3.50' },
            { name: 'Away', value: '3.80' },
          ],
        },
      ]

      const result = extractOdds(bets)
      expect(result).toEqual({ p1: 1.95, x: 3.5, p2: 3.8 })
    })

    it('должен извлекать коэффициенты из рынка "Match Winner"', () => {
      const bets = [
        {
          marketName: 'Match Winner',
          odds: [
            { name: '1', value: '1.50' },
            { name: 'x', value: '4.00' },
            { name: '2', value: '6.50' },
          ],
        },
      ]

      const result = extractOdds(bets)
      expect(result).toEqual({ p1: 1.5, x: 4.0, p2: 6.5 })
    })

    it('должен извлекать коэффициенты по marketId = "1"', () => {
      const bets = [
        {
          marketId: '1',
          odds: [
            { name: '1', value: '2.10' },
            { name: 'X', value: '3.30' },
            { name: '2', value: '3.40' },
          ],
        },
      ]

      const result = extractOdds(bets)
      expect(result).toEqual({ p1: 2.1, x: 3.3, p2: 3.4 })
    })
  })

  describe('Fallback на первый рынок с коэффициентами', () => {
    it('должен использовать первый рынок если основной не найден', () => {
      const bets = [
        {
          marketName: 'Over/Under',
          odds: [
            { value: '1.90' },
            { value: '1.85' },
          ],
        },
        {
          marketName: 'Asian Handicap',
          odds: [
            { value: '2.20' },
            { value: '3.10' },
            { value: '2.90' },
          ],
        },
      ]

      const result = extractOdds(bets)
      expect(result).toEqual({ p1: 1.9, x: 1.85, p2: 0 })
    })

    it('должен пропускать рынки с недостаточным количеством коэффициентов', () => {
      const bets = [
        {
          marketName: 'Some Market',
          odds: [{ value: '1.50' }],
        },
        {
          marketName: 'Another Market',
          odds: [
            { value: '2.00' },
            { value: '3.00' },
            { value: '2.50' },
          ],
        },
      ]

      const result = extractOdds(bets)
      expect(result).toEqual({ p1: 2.0, x: 3.0, p2: 2.5 })
    })
  })

  describe('Обработка некорректных данных', () => {
    it('должен обрабатывать нечисловые значения коэффициентов', () => {
      const bets = [
        {
          marketName: '1X2',
          odds: [
            { name: '1', value: 'invalid' },
            { name: 'X', value: '3.20' },
            { name: '2', value: null },
          ],
        },
      ]

      const result = extractOdds(bets)
      expect(result).toEqual({ p1: 0, x: 3.2, p2: 0 })
    })

    it('должен обрабатывать отсутствующие поля name', () => {
      const bets = [
        {
          marketName: 'Fulltime Result',
          odds: [
            { value: '2.50' },
            { name: 'X', value: '3.20' },
            { value: '2.80' },
          ],
        },
      ]

      const result = extractOdds(bets)
      expect(result).toEqual({ p1: 0, x: 3.2, p2: 0 })
    })

    it('должен обрабатывать рынок без коэффициентов', () => {
      const bets = [
        {
          marketName: 'Fulltime Result',
          odds: null,
        },
        {
          marketName: 'Other Market',
          odds: [
            { value: '1.50' },
            { value: '2.50' },
          ],
        },
      ]

      const result = extractOdds(bets)
      expect(result).toEqual({ p1: 1.5, x: 2.5, p2: 0 })
    })
  })

  describe('Регистронезависимость', () => {
    it('должен обрабатывать названия в разных регистрах', () => {
      const bets = [
        {
          marketName: '1X2',
          odds: [
            { name: 'HOME', value: '2.00' },
            { name: 'DRAW', value: '3.00' },
            { name: 'AWAY', value: '4.00' },
          ],
        },
      ]

      const result = extractOdds(bets)
      expect(result).toEqual({ p1: 2.0, x: 3.0, p2: 4.0 })
    })
  })

  describe('Приоритет рынков', () => {
    it('должен выбирать основной рынок даже если есть другие', () => {
      const bets = [
        {
          marketName: 'Over/Under',
          odds: [
            { value: '1.50' },
            { value: '2.50' },
          ],
        },
        {
          marketName: 'Fulltime Result',
          odds: [
            { name: '1', value: '2.10' },
            { name: 'X', value: '3.20' },
            { name: '2', value: '3.50' },
          ],
        },
      ]

      const result = extractOdds(bets)
      expect(result).toEqual({ p1: 2.1, x: 3.2, p2: 3.5 })
    })
  })
})
