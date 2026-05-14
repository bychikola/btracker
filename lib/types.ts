export interface Team {
  id: string
  name: string
  logo?: string
}

export interface Odds {
  p1: number
  x: number
  p2: number
}

export interface Score {
  team1: number
  team2: number
}

// Все рынки коэффициентов из API
export interface MarketOdds {
  label: string
  outcomes: { name: string; value: number }[]
}

export interface MatchMarkets {
  fullTimeResult: MarketOdds    // 1X2
  doubleChance: MarketOdds | null      // Двойной шанс
  totals: MarketOdds[]          // Тоталы (2.5, 1.5, 0.5, 3.5...)
  other: MarketOdds[]           // Остальные рынки
}

export interface Match {
  id: string
  sport_type: string
  sport_icon?: string
  league_name: string
  team1: Team
  team2: Team
  start_time: string
  is_live: boolean
  elapsed?: number
  score?: Score
  odds: Odds
  markets?: MatchMarkets        // Все рынки для матча
  is_favorite?: boolean
}

export interface Banner {
  id: string
  title: string
  subtitle?: string
  image?: string
  gradient?: string
  icon?: string
  event_count?: number
  link?: string
}

export type SportType = 'all' | 'football' | 'hockey' | 'tennis' | 'basketball' | 'esports' | 'volleyball' | 'boxing'

export interface SportFilter {
  id: SportType
  name: string
  icon: string
}
