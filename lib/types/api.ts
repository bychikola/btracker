// Параметры запроса к API sstats.net
export interface GetMatchesParams {
  Today?: boolean
  TimeZone?: number
  Limit?: number
  Offset?: number
  Live?: boolean
  Upcoming?: boolean
  LeagueId?: number
  Year?: number
}

// ─── Базовая информация ───

export interface ApiSaTeam {
  id: string
  name: string
  flashId?: string | null
  logoUrl?: string | null
  country?: { code: string; name: string } | null
}

export interface ApiSaLeague {
  id: string
  name: string
  country?: { code: string; name: string } | null
}

export interface ApiSaSeason {
  uid: string
  year: string
  league?: ApiSaLeague | null
}

// ─── Коэффициенты ───

export interface Price {
  name: string
  value: string
  openingValue?: string | null
}

export interface ApiSaBet {
  marketId: string
  marketName: string | null
  odds: Price[]
}

export interface ApiSaLiveOdds {
  elapsed: string
  stopped: boolean
  finished: boolean
  lastUpdate: string
  gameStatus: string
  odds: ApiSaBet[]
}

export interface ApiResponseOfLiveOdds {
  status: string; count: string; data: ApiSaLiveOdds
  requestQuery?: string | null; message?: string | null
  offset: string; TotalCount: string; traceId?: string | null
}

export interface LiveOddsUpdate {
  gameId: string
  lastUpdate: string
}

export interface ApiResponseOfLiveOddsUpdates {
  status: string; count: string; data: LiveOddsUpdate[]
  requestQuery?: string | null; message?: string | null
  offset: string; TotalCount: string; traceId?: string | null
}

// ─── Букмекеры и полные коэффициенты ───

export interface ApiSaBookmaker {
  id: number
  bookmakerName: string
}

export interface ApiSaBookmakerOdds {
  bookmakerId: number
  bookmakerName: string
  odds: ApiSaBet[]
}

// ─── Матч (короткая форма — из /Games/list) ───

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
  periods?: string[]
}

export interface ApiResponseOfApiSaGame {
  status: string; count: string; data: ApiSaGame[]
  requestQuery?: string | null; message?: string | null
  offset: string; TotalCount: string; traceId?: string | null
}

// ─── Полная информация о матче (из /Games/{id}) ───

export interface ApiSaStatistics {
  // Shots
  totalShotsHome?: number; totalShotsAway?: number
  shotsOnGoalHome?: number; shotsOnGoalAway?: number
  shotsOffGoalHome?: number; shotsOffGoalAway?: number
  blockedShotsHome?: number; blockedShotsAway?: number
  shotsInsideBoxHome?: number; shotsInsideBoxAway?: number
  shotsOutsideBoxHome?: number; shotsOutsideBoxAway?: number
  // xG
  expectedGoalsHome?: number; expectedGoalsAway?: number
  expectedAssistsHome?: number; expectedAssistsAway?: number
  bigChancesHome?: number; bigChancesAway?: number
  hitTheWoodworkHome?: number; hitTheWoodworkAway?: number
  // Ball
  ballPossessionHome?: number; ballPossessionAway?: number
  // Passing
  totalPassesHome?: number; totalPassesAway?: number
  passesAccurateHome?: number; passesAccurateAway?: number
  accurateThroughPassesHome?: number; accurateThroughPassesAway?: number
  longPassesHome?: number; longPassesAway?: number
  passesInFinalThirdHome?: number; passesInFinalThirdAway?: number
  crossesHome?: number; crossesAway?: number
  crossesCompletedHome?: number; crossesCompletedAway?: number
  // Defense
  totalTacklesHome?: number; totalTacklesAway?: number
  successTacklesHome?: number; successTacklesAway?: number
  duelsWonHome?: number; duelsWonAway?: number
  clearancesHome?: number; clearancesAway?: number
  clearancesCompletedHome?: number; clearancesCompletedAway?: number
  interceptionsHome?: number; interceptionsAway?: number
  // Discipline
  yellowCardsHome?: number; yellowCardsAway?: number
  redCardsHome?: number; redCardsAway?: number
  foulsHome?: number; foulsAway?: number
  // Other
  cornerKicksHome?: number; cornerKicksAway?: number
  offsidesHome?: number; offsidesAway?: number
  goalkeeperSavesHome?: number; goalkeeperSavesAway?: number
  freeKicksHome?: number; freeKicksAway?: number
  throwinsHome?: number; throwinsAway?: number
  attacksHome?: number; attacksAway?: number
  dangerousAttacksHome?: number; dangerousAttacksAway?: number
  touchesInOppositionBoxHome?: number; touchesInOppositionBoxAway?: number
  distanceCoveredHome?: number; distanceCoveredAway?: number
  errorsLeadingToShotHome?: number; errorsLeadingToShotAway?: number
  errorsLeadingToGoalHome?: number; errorsLeadingToGoalAway?: number
  headedGoalsHome?: number; headedGoalsAway?: number
  otherStatsHome?: Record<string, any>
  otherStatsAway?: Record<string, any>
}

export interface ApiSaLineup {
  homeFormation?: string | null
  awayFormation?: string | null
  homeCoach?: { id: number; name: string } | null
  awayCoach?: { id: number; name: string } | null
}

export interface ApiSaLineupPlayer {
  teamId: number
  playerId: number
  playerName: string
  number: number
  position: string // G, D, M, F
  grid?: string | null
  startXI?: boolean | null
}

export interface ApiSaPlayerStats {
  playerId: number
  minutes?: number
  capitan?: boolean
  substitute?: boolean
  shotsTotal?: number; shotsOn?: number
  goalsTotal?: number; goalsConceded?: number
  goalsAssists?: number; goalsSaves?: number
  passesTotal?: number; passesKey?: number; passesAccuracy?: number
  tacklesTotal?: number; tacklesBlocks?: number; tacklesInterceptions?: number
  duelsTotal?: number; duelsWon?: number
  dribblesAttempts?: number; dribblesSuccess?: number; dribblesPast?: number
  foulsDrawn?: number; foulsCommitted?: number
  cardsYellow?: number; cardsRed?: number
  offsides?: number
  penaltyWon?: number; penaltyCommited?: number
  penaltyScored?: number; penaltyMissed?: number; penaltySaved?: number
  rating?: number
}

export interface ApiSaEvent {
  id: number
  teamId: number
  elapsed: number
  extra?: number | null
  type: number // 1=goal, 2=card, 3=substitution, 4=VAR
  name: string
  player: { id: number; name: string }
  assistPlayer?: { id: number; name: string } | null
}

export interface ApiSaVenue {
  name?: string | null
  address?: string | null
  city?: string | null
  capacity?: number | null
}

export interface ApiSaGameFull {
  game: ApiSaGame
  statistics?: ApiSaStatistics | null
  lineups?: ApiSaLineup | null
  lineupPlayers?: ApiSaLineupPlayer[] | null
  playerStats?: ApiSaPlayerStats[] | null
  events?: ApiSaEvent[] | null
  venue?: ApiSaVenue | null
  refereeName?: string | null
}

export interface ApiResponseOfApiSaGameFull {
  status: string; count: string; data: ApiSaGameFull
  requestQuery?: string | null; message?: string | null
  offset: string; TotalCount: string; traceId?: string | null
}

// ─── Glicko 2 / xG ───

export interface ApiGlicko {
  homeRating: number; homeRd: number; homeVolatility: number
  awayRating: number; awayRd: number; awayVolatility: number
  homeXg: number; awayXg: number
  homeWinProbability: number; awayWinProbability: number
  updated?: string
}

export interface ApiGameGlicko {
  fixture: ApiSaGame
  glicko: ApiGlicko
}

// ─── Profits ───

export interface ApiOutcomeProfit {
  name: string; profit: number
  profitHistory: number[]; gamesCount: number; winCount: number
}

export interface ApiMarketProfit {
  market: string; outcomes: ApiOutcomeProfit[]
}

export interface ApiMatchProfit {
  home: ApiMarketProfit[]; away: ApiMarketProfit[]
  homeFirstHalf: ApiMarketProfit[]; awayFirstHalf: ApiMarketProfit[]
  homeSecondHalf: ApiMarketProfit[]; awaySecondHalf: ApiMarketProfit[]
}

// ─── Standings ───

export interface ApiStandingRow {
  teamId: number; rank: number; groupName?: string; description?: string
  points: number; form?: string
  played: number; wins: number; draws: number; loses: number
  goalsFor: number; goalsAgainst: number
}

export interface ApiStandingTable {
  tableNum: number; rows: ApiStandingRow[]
}

export interface ApiStandings {
  season: ApiSaSeason; tables: ApiStandingTable[]
}

// ─── Generic responses ───

export interface ApiResponseOf<T> {
  status: string; count?: number; data: T
  requestQuery?: string | null; message?: string | null
  offset?: number; TotalCount?: number; traceId?: string | null
}

// ─── Client timezone ───

export function getClientTimeZone(): number {
  return -new Date().getTimezoneOffset() / 60
}
