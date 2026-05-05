import { supabase } from '@/lib/supabase/client'
import {
  Favorite,
  AddFavoriteParams,
  RemoveFavoriteParams,
  IsFavoriteParams,
  FavoriteType,
} from '@/lib/types/favorites'

/**
 * Получить все избранное текущего пользователя
 */
export async function getFavorites(): Promise<Favorite[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching favorites:', error)
    throw error
  }

  return data || []
}

/**
 * Получить избранное по типу
 */
export async function getFavoritesByType(type: FavoriteType): Promise<Favorite[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('favorite_type', type)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching favorites by type:', error)
    throw error
  }

  return data || []
}

/**
 * Добавить в избранное
 */
export async function addFavorite(params: AddFavoriteParams): Promise<Favorite> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_id: user.id,
      favorite_type: params.favorite_type,
      item_id: params.item_id,
      item_data: params.item_data,
    })
    .select()
    .single()

  if (error) {
    // Если элемент уже в избранном, не бросаем ошибку
    if (error.code === '23505') {
      console.log('Item already in favorites')
      // Получаем существующий элемент
      const { data: existing } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('favorite_type', params.favorite_type)
        .eq('item_id', params.item_id)
        .single()

      if (existing) return existing
    }
    console.error('Error adding favorite:', error)
    throw error
  }

  return data
}

/**
 * Удалить из избранного
 */
export async function removeFavorite(params: RemoveFavoriteParams): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('favorite_type', params.favorite_type)
    .eq('item_id', params.item_id)

  if (error) {
    console.error('Error removing favorite:', error)
    throw error
  }
}

/**
 * Проверить, находится ли элемент в избранном
 */
export async function isFavorite(params: IsFavoriteParams): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('favorite_type', params.favorite_type)
    .eq('item_id', params.item_id)
    .maybeSingle()

  if (error) {
    console.error('Error checking favorite:', error)
    return false
  }

  return !!data
}

/**
 * Получить количество избранных элементов
 */
export async function getFavoritesCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return 0
  }

  const { count, error } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (error) {
    console.error('Error getting favorites count:', error)
    return 0
  }

  return count || 0
}

/**
 * Переключить состояние избранного (добавить/удалить)
 */
export async function toggleFavorite(params: AddFavoriteParams): Promise<boolean> {
  const isInFavorites = await isFavorite({
    favorite_type: params.favorite_type,
    item_id: params.item_id,
  })

  if (isInFavorites) {
    await removeFavorite({
      favorite_type: params.favorite_type,
      item_id: params.item_id,
    })
    return false
  } else {
    await addFavorite(params)
    return true
  }
}
