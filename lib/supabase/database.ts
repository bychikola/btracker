import { supabase } from './client'

export interface FavoriteMatch {
  id: string
  user_id: string
  match_id: string
  created_at: string
}

export interface BetHistory {
  id: string
  user_id: string
  match_id: string
  bet_type: 'p1' | 'x' | 'p2'
  odds: number
  amount: number
  status: 'pending' | 'won' | 'lost'
  created_at: string
  updated_at: string
}

// ==================== Избранные матчи ====================

export const favoritesApi = {
  // Получить все избранные матчи пользователя
  getFavorites: async (): Promise<FavoriteMatch[]> => {
    const { data, error } = await supabase
      .from('favorite_matches')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Добавить матч в избранное
  addFavorite: async (matchId: string): Promise<FavoriteMatch> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('favorite_matches')
      .insert({
        user_id: user.id,
        match_id: matchId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Удалить матч из избранного
  removeFavorite: async (matchId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('favorite_matches')
      .delete()
      .eq('user_id', user.id)
      .eq('match_id', matchId)

    if (error) throw error
  },

  // Проверить, находится ли матч в избранном
  isFavorite: async (matchId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('favorite_matches')
      .select('id')
      .eq('user_id', user.id)
      .eq('match_id', matchId)
      .maybeSingle()

    if (error && error.message) {
      console.error('Error checking favorite:', error.message)
      return false
    }
    return !!data
  },
}

// ==================== История ставок ====================

export const betsApi = {
  // Получить историю ставок пользователя
  getBetHistory: async (): Promise<BetHistory[]> => {
    const { data, error } = await supabase
      .from('bet_history')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Создать новую ставку
  createBet: async (
    matchId: string,
    betType: 'p1' | 'x' | 'p2',
    odds: number,
    amount: number
  ): Promise<BetHistory> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('bet_history')
      .insert({
        user_id: user.id,
        match_id: matchId,
        bet_type: betType,
        odds,
        amount,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Обновить статус ставки
  updateBetStatus: async (
    betId: string,
    status: 'won' | 'lost'
  ): Promise<void> => {
    const { error } = await supabase
      .from('bet_history')
      .update({ status })
      .eq('id', betId)

    if (error) throw error
  },

  // Получить статистику ставок
  getBetStats: async (): Promise<{
    total: number
    won: number
    lost: number
    pending: number
    totalAmount: number
    totalWinnings: number
  }> => {
    const { data, error } = await supabase
      .from('bet_history')
      .select('status, amount, odds')

    if (error) throw error

    const stats = {
      total: data.length,
      won: 0,
      lost: 0,
      pending: 0,
      totalAmount: 0,
      totalWinnings: 0,
    }

    data.forEach((bet) => {
      stats.totalAmount += bet.amount

      if (bet.status === 'won') {
        stats.won++
        stats.totalWinnings += bet.amount * bet.odds
      } else if (bet.status === 'lost') {
        stats.lost++
      } else if (bet.status === 'pending') {
        stats.pending++
      }
    })

    return stats
  },
}

// ==================== Профиль пользователя ====================

export const profileApi = {
  // Обновить профиль
  updateProfile: async (updates: {
    username?: string
    first_name?: string
    last_name?: string
    avatar_url?: string
  }): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) throw error
  },

  // Загрузить аватар
  uploadAvatar: async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return data.publicUrl
  },
}
