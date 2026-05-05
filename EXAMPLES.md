# Примеры использования компонентов

## Использование хука useMatches

### Базовое использование

```typescript
import { useMatches } from '@/lib/hooks/useMatches'

function MatchesList() {
  const { data: matches, isLoading, error } = useMatches()

  if (isLoading) return <div>Загрузка...</div>
  if (error) return <div>Ошибка загрузки</div>

  return (
    <div>
      {matches?.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  )
}
```

### Фильтрация по виду спорта

```typescript
const { data: footballMatches } = useMatches({ sport: 'football' })
```

### Только Live-матчи

```typescript
const { data: liveMatches } = useMatches({ is_live: true })
```

### Комбинированные фильтры

```typescript
const { data: liveFootball } = useMatches({ 
  sport: 'football', 
  is_live: true 
})
```

## Кастомизация компонентов

### MatchCard с обработчиком клика

```typescript
<MatchCard 
  match={match} 
  onClick={() => router.push(`/match/${match.id}`)}
/>
```

Для этого нужно обновить компонент:

```typescript
// components/match-card.tsx
interface MatchCardProps {
  match: Match
  onClick?: () => void
}

export function MatchCard({ match, onClick }: MatchCardProps) {
  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
      onClick={onClick}
    >
      {/* ... остальной код */}
    </div>
  )
}
```

### Кастомные цвета для видов спорта

```typescript
// В components/match-card.tsx
const sportColors: Record<string, string> = {
  football: 'bg-green-500',
  hockey: 'bg-cyan-500',
  tennis: 'bg-yellow-500',
  basketball: 'bg-orange-500',
  esports: 'bg-purple-500',
  volleyball: 'bg-pink-500',
  boxing: 'bg-red-500',
  // Добавьте свои цвета
  mma: 'bg-red-700',
  cricket: 'bg-blue-500',
}
```

## Создание новых страниц

### Страница детального просмотра матча

Создайте `app/match/[id]/page.tsx`:

```typescript
'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { matchesApi } from '@/lib/api/matches'

export default function MatchDetailPage() {
  const params = useParams()
  const matchId = params.id as string

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => matchesApi.getMatchById(matchId),
  })

  if (isLoading) return <div>Загрузка...</div>
  if (!match) return <div>Матч не найден</div>

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">
        {match.team1.name} vs {match.team2.name}
      </h1>
      {/* Добавьте детальную информацию */}
    </div>
  )
}
```

### Страница Live-матчей

Создайте `app/live/page.tsx`:

```typescript
'use client'

import { MatchCard } from '@/components/match-card'
import { useMatches } from '@/lib/hooks/useMatches'

export default function LivePage() {
  const { data: matches, isLoading } = useMatches({ is_live: true })

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
        <h1 className="text-3xl font-bold">Live-матчи</h1>
      </div>

      {isLoading ? (
        <div>Загрузка...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches?.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  )
}
```

## Добавление избранного

### Создайте хук для избранного

Создайте `lib/hooks/useFavorites.ts`:

```typescript
'use client'

import { useState, useEffect } from 'react'

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('favorites')
    if (stored) {
      setFavorites(JSON.parse(stored))
    }
  }, [])

  const toggleFavorite = (matchId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(matchId)
        ? prev.filter(id => id !== matchId)
        : [...prev, matchId]
      
      localStorage.setItem('favorites', JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  const isFavorite = (matchId: string) => favorites.includes(matchId)

  return { favorites, toggleFavorite, isFavorite }
}
```

### Обновите MatchCard

```typescript
// components/match-card.tsx
interface MatchCardProps {
  match: Match
  onToggleFavorite?: (matchId: string) => void
  isFavorite?: boolean
}

export function MatchCard({ match, onToggleFavorite, isFavorite }: MatchCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex items-center justify-between mb-3">
        {/* ... */}
        <button 
          onClick={() => onToggleFavorite?.(match.id)}
          className="text-gray-400 hover:text-yellow-500 transition-colors"
        >
          <Star className={cn('w-4 h-4', isFavorite && 'fill-yellow-500 text-yellow-500')} />
        </button>
      </div>
      {/* ... */}
    </div>
  )
}
```

### Используйте в странице

```typescript
'use client'

import { useFavorites } from '@/lib/hooks/useFavorites'

export default function Home() {
  const { toggleFavorite, isFavorite } = useFavorites()
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches?.map(match => (
        <MatchCard 
          key={match.id} 
          match={match}
          onToggleFavorite={toggleFavorite}
          isFavorite={isFavorite(match.id)}
        />
      ))}
    </div>
  )
}
```

## Добавление поиска

### Создайте компонент поиска

Создайте `components/search-bar.tsx`:

```typescript
'use client'

import { Search, X } from 'lucide-react'
import { useState } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export function SearchBar({ onSearch, placeholder = 'Поиск...' }: SearchBarProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </form>
  )
}
```

### Используйте в странице

```typescript
const [searchQuery, setSearchQuery] = useState('')

const filteredMatches = matches?.filter(match => 
  match.team1.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  match.team2.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  match.league_name.toLowerCase().includes(searchQuery.toLowerCase())
)

return (
  <div>
    <SearchBar onSearch={setSearchQuery} placeholder="Поиск команд или турниров..." />
    {/* Отображение filteredMatches */}
  </div>
)
```

## Добавление уведомлений

### Установите библиотеку

```bash
npm install react-hot-toast
```

### Настройте провайдер

```typescript
// components/providers.tsx
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}
```

### Используйте уведомления

```typescript
import toast from 'react-hot-toast'

const toggleFavorite = (matchId: string) => {
  // ... логика
  toast.success(isFavorite ? 'Удалено из избранного' : 'Добавлено в избранное')
}
```
