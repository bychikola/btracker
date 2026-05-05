// Параметры запроса к API sstats.net
export interface GetMatchesParams {
  Today?: boolean
  TimeZone?: number
  Limit?: number
  Offset?: number
  Live?: boolean
  Upcoming?: boolean
}

// Базовая информация о команде из API
export interface ApiSaTeam {
  id: string
  name: string
  flashId?: string | null
  logoUrl?: string | null
  country?: {
    code: string
    name: string
  } | null
}

// Лига из API
export interface ApiSaLeague {
  id: string
  name: string
  country?: {
    code: string
    name: string
  } | null
}

// Сезон из API
export interface ApiSaSeason {
  uid: string
  year: string
  league?: ApiSaLeague | null
}

// Коэффициент из API
export interface Price {
  name: string
  value: string
}

// Ставка из API
export interface ApiSaBet {
  marketId: string
  marketName: string
  odds: Price[]
}

// Live коэффициенты из API
export interface ApiSaLiveOdds {
  elapsed: string // Время матча в формате HH:MM:SS
  stopped: boolean
  finished: boolean
  lastUpdate: string
  gameStatus: string
  odds: ApiSaBet[]
}

// Ответ Live коэффициентов
export interface ApiResponseOfLiveOdds {
  status: string
  count: string
  data: ApiSaLiveOdds
  requestQuery?: string | null
  message?: string | null
  offset: string
  TotalCount: string
  traceId?: string | null
}

// Метка обновления Live-коэффициентов
export interface LiveOddsUpdate {
  gameId: string
  lastUpdate: string
}

// Ответ от /Odds/live-changes/updates-only
export interface ApiResponseOfLiveOddsUpdates {
  status: string
  count: string
  data: LiveOddsUpdate[]
  requestQuery?: string | null
  message?: string | null
  offset: string
  TotalCount: string
  traceId?: string | null
}

// Матч из API sstats.net
export interface ApiSaGame {
  id: string
  flashId?: string | null
  date?: string | null
  dateUtc: string
  status: string
  statusName?: string | null
  elapsed?: string
  extraMinutes?: string
  homeResult?: string
  awayResult?: string
  homeHTResult?: string
  awayHTResult?: string
  homeFTResult?: string
  awayFTResult?: string
  homeTeam: ApiSaTeam
  awayTeam: ApiSaTeam
  season: ApiSaSeason
  roundName?: string | null
  odds: ApiSaBet[]
}

// Ответ от API sstats.net
export interface ApiResponseOfApiSaGame {
  status: string
  count: string
  data: ApiSaGame[]
  requestQuery?: string | null
  message?: string | null
  offset: string
  TotalCount: string
  traceId?: string | null
}

// Функция для получения часового пояса клиента
export function getClientTimeZone(): number {
  const offset = new Date().getTimezoneOffset()
  // getTimezoneOffset возвращает разницу в минутах, нужно конвертировать в часы
  // Знак инвертирован: если UTC+3, то getTimezoneOffset вернет -180
  return -offset / 60
}

