import { Match, Banner } from './types'

export const mockBanners: Banner[] = [
  {
    id: '1',
    title: 'Live',
    subtitle: 'Прямо сейчас',
    gradient: 'from-red-600 to-red-800',
    icon: '🔴',
    event_count: 156,
    link: '/live',
  },
  {
    id: '2',
    title: 'Лига Чемпионов',
    subtitle: 'UEFA',
    gradient: 'from-blue-600 to-blue-800',
    icon: '⚽',
    event_count: 8,
  },
  {
    id: '3',
    title: 'КХЛ',
    subtitle: 'Плей-офф',
    gradient: 'from-cyan-600 to-cyan-800',
    icon: '🏒',
    event_count: 4,
  },
  {
    id: '4',
    title: 'NBA',
    subtitle: 'Регулярный сезон',
    gradient: 'from-orange-600 to-orange-800',
    icon: '🏀',
    event_count: 12,
  },
]

export const mockMatches: Match[] = [
  {
    id: '1',
    sport_type: 'football',
    league_name: 'Лига Чемпионов UEFA',
    team1: {
      id: 't1',
      name: 'Манчестер Сити',
      logo: undefined,
    },
    team2: {
      id: 't2',
      name: 'Реал Мадрид',
      logo: undefined,
    },
    start_time: '2026-04-29T19:00:00Z',
    is_live: true,
    score: {
      team1: 2,
      team2: 1,
    },
    odds: {
      p1: 2.15,
      x: 3.40,
      p2: 3.20,
    },
    is_favorite: false,
  },
  {
    id: '2',
    sport_type: 'hockey',
    league_name: 'КХЛ. Плей-офф',
    team1: {
      id: 't3',
      name: 'ЦСКА',
      logo: undefined,
    },
    team2: {
      id: 't4',
      name: 'СКА',
      logo: undefined,
    },
    start_time: '2026-04-29T16:30:00Z',
    is_live: true,
    score: {
      team1: 3,
      team2: 2,
    },
    odds: {
      p1: 1.85,
      x: 4.20,
      p2: 4.50,
    },
    is_favorite: true,
  },
  {
    id: '3',
    sport_type: 'tennis',
    league_name: 'ATP. Мадрид',
    team1: {
      id: 't5',
      name: 'Новак Джокович',
      logo: undefined,
    },
    team2: {
      id: 't6',
      name: 'Карлос Алькарас',
      logo: undefined,
    },
    start_time: '2026-04-29T21:00:00Z',
    is_live: false,
    odds: {
      p1: 1.95,
      x: 0,
      p2: 1.90,
    },
    is_favorite: false,
  },
  {
    id: '4',
    sport_type: 'basketball',
    league_name: 'NBA',
    team1: {
      id: 't7',
      name: 'Лос-Анджелес Лейкерс',
      logo: undefined,
    },
    team2: {
      id: 't8',
      name: 'Голден Стэйт Уорриорз',
      logo: undefined,
    },
    start_time: '2026-04-30T02:00:00Z',
    is_live: false,
    odds: {
      p1: 2.05,
      x: 0,
      p2: 1.80,
    },
    is_favorite: true,
  },
  {
    id: '5',
    sport_type: 'esports',
    league_name: 'CS2. Major',
    team1: {
      id: 't9',
      name: 'Natus Vincere',
      logo: undefined,
    },
    team2: {
      id: 't10',
      name: 'FaZe Clan',
      logo: undefined,
    },
    start_time: '2026-04-29T18:00:00Z',
    is_live: true,
    score: {
      team1: 1,
      team2: 0,
    },
    odds: {
      p1: 1.65,
      x: 0,
      p2: 2.25,
    },
    is_favorite: false,
  },
  {
    id: '6',
    sport_type: 'football',
    league_name: 'Английская Премьер-Лига',
    team1: {
      id: 't11',
      name: 'Арсенал',
      logo: undefined,
    },
    team2: {
      id: 't12',
      name: 'Челси',
      logo: undefined,
    },
    start_time: '2026-04-29T17:30:00Z',
    is_live: true,
    score: {
      team1: 0,
      team2: 0,
    },
    odds: {
      p1: 1.75,
      x: 3.60,
      p2: 4.80,
    },
    is_favorite: false,
  },
]
