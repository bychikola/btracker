'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useAuth } from './auth-context-supabase'
import {
  Favorite,
  FavoriteType,
  AddFavoriteParams,
  RemoveFavoriteParams,
} from '@/lib/types/favorites'
import {
  getFavorites,
  getFavoritesByType,
  addFavorite as addFavoriteApi,
  removeFavorite as removeFavoriteApi,
  isFavorite as isFavoriteApi,
  getFavoritesCount,
  toggleFavorite as toggleFavoriteApi,
} from '@/lib/api/favorites'

interface FavoritesContextType {
  favorites: Favorite[]
  favoritesCount: number
  isLoading: boolean
  isFavorite: (type: FavoriteType, itemId: string) => boolean
  addFavorite: (params: AddFavoriteParams) => Promise<void>
  removeFavorite: (params: RemoveFavoriteParams) => Promise<void>
  toggleFavorite: (params: AddFavoriteParams) => Promise<boolean>
  getFavoritesByType: (type: FavoriteType) => Favorite[]
  refreshFavorites: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Загрузка избранного при монтировании и при изменении пользователя
  useEffect(() => {
    if (isAuthenticated && user) {
      loadFavorites()
    } else {
      setFavorites([])
    }
  }, [isAuthenticated, user])

  const loadFavorites = async () => {
    setIsLoading(true)
    try {
      const data = await getFavorites()
      setFavorites(data)
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshFavorites = useCallback(async () => {
    if (isAuthenticated) {
      await loadFavorites()
    }
  }, [isAuthenticated])

  const isFavorite = useCallback(
    (type: FavoriteType, itemId: string): boolean => {
      // Приводим к строке для сравнения
      const itemIdStr = String(itemId)
      const result = favorites.some(
        (fav) => fav.favorite_type === type && String(fav.item_id) === itemIdStr
      )
      return result
    },
    [favorites]
  )

  const addFavorite = async (params: AddFavoriteParams) => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to add favorites')
    }

    try {
      await addFavoriteApi(params)
      await refreshFavorites()
    } catch (error) {
      console.error('Error adding favorite:', error)
      throw error
    }
  }

  const removeFavorite = async (params: RemoveFavoriteParams) => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to remove favorites')
    }

    try {
      await removeFavoriteApi(params)
      await refreshFavorites()
    } catch (error) {
      console.error('Error removing favorite:', error)
      throw error
    }
  }

  const toggleFavorite = async (params: AddFavoriteParams): Promise<boolean> => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to toggle favorites')
    }

    try {
      const result = await toggleFavoriteApi(params)
      await refreshFavorites()
      return result
    } catch (error) {
      console.error('Error toggling favorite:', error)
      throw error
    }
  }

  const getFavoritesByTypeLocal = useCallback(
    (type: FavoriteType): Favorite[] => {
      return favorites.filter((fav) => fav.favorite_type === type)
    },
    [favorites]
  )

  const favoritesCount = favorites.length

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoritesCount,
        isLoading,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        getFavoritesByType: getFavoritesByTypeLocal,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
