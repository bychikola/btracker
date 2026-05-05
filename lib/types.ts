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

export interface Match {
  id: string
  sport_type: string
  sport_icon?: string
  league_name: string
  team1: Team
  team2: Team
  start_time: string
  is_live: boolean
  elapsed?: number // Текущая минута матча для Live
  score?: Score
  odds: Odds
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
