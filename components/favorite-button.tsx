'use client'

import { Star } from 'lucide-react'
import { useState } from 'react'
import { useFavorites } from '@/lib/contexts/favorites-context'
import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { AddFavoriteParams } from '@/lib/types/favorites'
import toast from 'react-hot-toast'

interface FavoriteButtonProps {
  favoriteData: AddFavoriteParams
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function FavoriteButton({ favoriteData, className = '', size = 'md' }: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [isLoading, setIsLoading] = useState(false)

  const isInFavorites = isFavorite(favoriteData.favorite_type, favoriteData.item_id)

  const sizeClasses: Record<string, string> = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast.error('Войдите в систему, чтобы добавить в избранное')
      return
    }

    setIsLoading(true)
    try {
      await toggleFavorite(favoriteData)
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('Ошибка при добавлении в избранное')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`p-1.5 rounded-[var(--radius-full)] transition-all hover:bg-[var(--canvas-soft)] disabled:opacity-50 touch-manipulation ${className}`}
      title={isInFavorites ? 'Удалить из избранного' : 'Добавить в избранное'}
      aria-label={isInFavorites ? 'Удалить из избранного' : 'Добавить в избранное'}
    >
      <Star
        className={`${sizeClasses[size]} transition-all ${
          isInFavorites
            ? 'fill-[var(--primary)] text-[var(--primary)] stroke-[var(--primary)]'
            : 'text-[var(--mute)] hover:text-[var(--primary)] fill-none'
        } ${isLoading ? 'animate-pulse' : ''}`}
        strokeWidth={2}
      />
    </button>
  )
}
