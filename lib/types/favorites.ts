// Типы для системы избранного

export type FavoriteType = 'match' | 'team' | 'league'

// Базовый интерфейс избранного элемента
export interface Favorite {
  id: string
  user_id: string
  favorite_type: FavoriteType
  item_id: string
  item_data: FavoriteItemData
  created_at: string
}

// Данные для разных типов избранного
export type FavoriteItemData = FavoriteMatchData | FavoriteTeamData | FavoriteLeagueData

// Данные избранного матча
export interface FavoriteMatchData {
  type: 'match'
  sport_type: string
  league_name: string
  team1: {
    name: string
    logo?: string
  }
  team2: {
    name: string
    logo?: string
  }
  start_time: string
  is_live?: boolean
}

// Данные избранной команды
export interface FavoriteTeamData {
  type: 'team'
  name: string
  logo?: string
  sport_type: string
}

// Данные избранной лиги
export interface FavoriteLeagueData {
  type: 'league'
  name: string
  sport_type: string
  country?: string
}

// Для добавления в избранное
export interface AddFavoriteParams {
  favorite_type: FavoriteType
  item_id: string
  item_data: FavoriteItemData
}

// Для удаления из избранного
export interface RemoveFavoriteParams {
  favorite_type: FavoriteType
  item_id: string
}

// Для проверки, находится ли элемент в избранном
export interface IsFavoriteParams {
  favorite_type: FavoriteType
  item_id: string
}
