'use client'

import { useState } from 'react'
import { useFavorites } from '@/lib/contexts/favorites-context'
import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { Star, Trash2 } from 'lucide-react'
import { FavoriteType } from '@/lib/types/favorites'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'
import { translateTeam, translateLeague } from '@/lib/translations'
import { useTranslation } from '@/lib/contexts/translation-context'

export default function FavoritesPage() {
  const { isAuthenticated } = useAuth()
  const { favorites, isLoading, removeFavorite, getFavoritesByType } = useFavorites()
  const { translateEnabled } = useTranslation()
  const [selectedType, setSelectedType] = useState<FavoriteType | 'all'>('all')
  const [removingId, setRemovingId] = useState<string | null>(null)

  const filteredFavorites = selectedType === 'all'
    ? favorites
    : getFavoritesByType(selectedType)

  const handleRemove = async (favoriteType: FavoriteType, itemId: string, favoriteId: string) => {
    setRemovingId(favoriteId)
    try {
      await removeFavorite({ favorite_type: favoriteType, item_id: itemId })
    } catch (error) {
      console.error('Error removing favorite:', error)
    } finally {
      setRemovingId(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <Star className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Избранное</h1>
            <p className="text-text-secondary mb-6">
              Войдите в систему, чтобы просматривать избранные матчи, команды и лиги
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-accent hover:bg-accent-hover text-black rounded-lg font-medium transition-colors"
            >
              На главную
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Избранное</h1>
          <p className="text-text-secondary">
            {favorites.length === 0
              ? 'У вас пока нет избранных элементов'
              : `Всего: ${favorites.length}`
            }
          </p>
        </div>

        {/* Фильтры */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedType === 'all'
                ? 'bg-accent text-black'
                : 'bg-card-bg text-foreground hover:bg-card-hover'
            }`}
          >
            Все ({favorites.length})
          </button>
          <button
            onClick={() => setSelectedType('match')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedType === 'match'
                ? 'bg-accent text-black'
                : 'bg-card-bg text-foreground hover:bg-card-hover'
            }`}
          >
            Матчи ({getFavoritesByType('match').length})
          </button>
          <button
            onClick={() => setSelectedType('team')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedType === 'team'
                ? 'bg-accent text-black'
                : 'bg-card-bg text-foreground hover:bg-card-hover'
            }`}
          >
            Команды ({getFavoritesByType('team').length})
          </button>
          <button
            onClick={() => setSelectedType('league')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedType === 'league'
                ? 'bg-accent text-black'
                : 'bg-card-bg text-foreground hover:bg-card-hover'
            }`}
          >
            Лиги ({getFavoritesByType('league').length})
          </button>
        </div>

        {/* Список избранного */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card-bg rounded-xl p-4 border border-border animate-pulse">
                <div className="h-4 bg-card-hover rounded w-1/3 mb-3"></div>
                <div className="h-6 bg-card-hover rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-card-hover rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <p className="text-text-secondary">
              {selectedType === 'all'
                ? 'У вас пока нет избранных элементов'
                : `Нет избранных ${selectedType === 'match' ? 'матчей' : selectedType === 'team' ? 'команд' : 'лиг'}`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFavorites.map((favorite) => {
              const data = favorite.item_data as any

              return (
                <div
                  key={favorite.id}
                  className="bg-card-bg rounded-xl p-4 border border-border hover:bg-card-hover transition-all"
                >
                  {/* Тип и кнопка удаления */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-text-secondary uppercase">
                      {favorite.favorite_type === 'match' ? 'Матч' :
                       favorite.favorite_type === 'team' ? 'Команда' : 'Лига'}
                    </span>
                    <button
                      onClick={() => handleRemove(favorite.favorite_type, favorite.item_id, favorite.id)}
                      disabled={removingId === favorite.id}
                      className="p-1 text-text-secondary hover:text-accent transition-colors disabled:opacity-50"
                      title="Удалить из избранного"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Контент в зависимости от типа */}
                  {favorite.favorite_type === 'match' && (
                    <>
                      <div className="text-xs text-text-secondary mb-2">
                        {translateLeague(data.league_name, translateEnabled)}
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-card-hover flex items-center justify-center flex-shrink-0">
                            {data.team1.logo ? (
                              <img src={data.team1.logo} alt={data.team1.name} className="w-5 h-5" />
                            ) : (
                              <span className="text-xs font-bold text-text-secondary">
                                {data.team1.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate">
                            {translateTeam(data.team1.name, translateEnabled)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-card-hover flex items-center justify-center flex-shrink-0">
                            {data.team2.logo ? (
                              <img src={data.team2.logo} alt={data.team2.name} className="w-5 h-5" />
                            ) : (
                              <span className="text-xs font-bold text-text-secondary">
                                {data.team2.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate">
                            {translateTeam(data.team2.name, translateEnabled)}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-text-secondary">
                        {data.is_live ? (
                          <span className="text-accent font-semibold">● LIVE</span>
                        ) : (
                          format(new Date(data.start_time), 'dd MMM, HH:mm', { locale: ru })
                        )}
                      </div>
                    </>
                  )}

                  {favorite.favorite_type === 'team' && (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-card-hover flex items-center justify-center flex-shrink-0">
                          {data.logo ? (
                            <img src={data.logo} alt={data.name} className="w-10 h-10" />
                          ) : (
                            <span className="text-xl font-bold text-text-secondary">
                              {data.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {translateTeam(data.name, translateEnabled)}
                          </div>
                          <div className="text-xs text-text-secondary capitalize">
                            {data.sport_type}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {favorite.favorite_type === 'league' && (
                    <>
                      <div className="font-medium text-foreground mb-2">
                        {translateLeague(data.name, translateEnabled)}
                      </div>
                      <div className="text-xs text-text-secondary capitalize">
                        {data.sport_type}
                        {data.country && ` • ${data.country}`}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
