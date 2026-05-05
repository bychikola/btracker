# 🚀 Быстрое переключение на реальное API

## ✅ Интеграция готова!

Все необходимые функции и хуки для работы с API sstats.net созданы.

## 📋 Как переключиться с mock-данных на реальное API

### Шаг 1: Обновите главную страницу

Откройте `app/page.tsx` и замените импорты и логику:

**Было:**
```typescript
import { mockMatches } from '@/lib/mock-data'

const filteredMatches = mockMatches.filter((match) => {
  const sportMatch = selectedSport === 'all' || match.sport_type === selectedSport
  const liveMatch = !showLiveOnly || match.is_live
  return sportMatch && liveMatch
})
```

**Стало:**
```typescript
import { useTodayMatches } from '@/lib/hooks/useSstatsMatches'
import { MatchCardSkeleton } from '@/components/match-card-skeleton'

const { data, isLoading, error } = useTodayMatches({
  Live: showLiveOnly || undefined,
})

const filteredMatches = data?.matches.filter((match) => {
  return selectedSport === 'all' || match.sport_type === selectedSport
}) || []
```

### Шаг 2: Добавьте состояния загрузки

```typescript
{isLoading && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <MatchCardSkeleton key={i} />
    ))}
  </div>
)}

{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
    Ошибка загрузки матчей. Попробуйте обновить страницу.
  </div>
)}

{!isLoading && !error && filteredMatches.length === 0 && (
  <div className="text-center py-12">
    <p className="text-gray-500">Нет доступных событий</p>
  </div>
)}

{!isLoading && !error && filteredMatches.length > 0 && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {filteredMatches.map((match) => (
      <MatchCard key={match.id} match={match} />
    ))}
  </div>
)}
```

## 🎯 Полный пример страницы

```typescript
'use client'

import { useState } from 'react'
import { BannerCarousel } from '@/components/banner-carousel'
import { SportFilter } from '@/components/sport-filter'
import { MatchCard } from '@/components/match-card'
import { MatchCardSkeleton } from '@/components/match-card-skeleton'
import { mockBanners } from '@/lib/mock-data'
import { useTodayMatches } from '@/lib/hooks/useSstatsMatches'

export default function Home() {
  const [selectedSport, setSelectedSport] = useState('all')
  const [showLiveOnly, setShowLiveOnly] = useState(false)

  // Получение данных из API
  const { data, isLoading, error } = useTodayMatches({
    Live: showLiveOnly || undefined,
  })

  // Фильтрация по виду спорта
  const filteredMatches = data?.matches.filter((match) => {
    return selectedSport === 'all' || match.sport_type === selectedSport
  }) || []

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Карусель баннеров */}
        <section>
          <BannerCarousel banners={mockBanners} />
        </section>

        {/* Заголовок с переключателем Live */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Топ-события</h2>
            <button
              onClick={() => setShowLiveOnly(!showLiveOnly)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showLiveOnly
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {showLiveOnly ? '🔴 Live' : 'Все события'}
            </button>
          </div>

          {/* Фильтр по видам спорта */}
          <SportFilter selected={selectedSport} onChange={setSelectedSport} />
        </section>

        {/* Сетка матчей */}
        <section>
          {/* Загрузка */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <MatchCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              Ошибка загрузки матчей. Попробуйте обновить страницу.
            </div>
          )}

          {/* Нет матчей */}
          {!isLoading && !error && filteredMatches.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Нет доступных событий</p>
            </div>
          )}

          {/* Матчи */}
          {!isLoading && !error && filteredMatches.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
```

## 🔄 Альтернативный вариант (с хуком по виду спорта)

Если хотите фильтровать на сервере:

```typescript
import { useMatchesBySport } from '@/lib/hooks/useSstatsMatches'

const { data, isLoading, error } = useMatchesBySport(
  selectedSport === 'all' ? null : selectedSport,
  { Live: showLiveOnly || undefined }
)

const matches = data?.matches || []
```

## 🎯 Что получите

После переключения:
- ✅ Реальные данные из API sstats.net
- ✅ Автообновление Live матчей каждые 30 секунд
- ✅ Правильная работа фильтров
- ✅ Skeleton loaders при загрузке
- ✅ Обработка ошибок
- ✅ Автоматическое определение часового пояса

## 🧪 Тестирование

1. Откройте http://localhost:3000
2. Должны загрузиться реальные матчи
3. Попробуйте фильтр "Live"
4. Попробуйте фильтры по видам спорта
5. Проверьте автообновление (подождите 30 секунд)

## 📝 Откат на mock-данные

Если нужно вернуться к mock-данным:

```typescript
// Закомментируйте реальное API
// const { data, isLoading } = useTodayMatches()

// Раскомментируйте mock
import { mockMatches } from '@/lib/mock-data'
const filteredMatches = mockMatches.filter(...)
```

## 🐛 Если что-то не работает

1. **Проверьте консоль браузера** (F12) на ошибки
2. **Проверьте Network tab** - должны быть запросы к `/api/proxy/Games/list`
3. **Проверьте next.config.ts** - proxy должен быть настроен
4. **Перезапустите dev-сервер** после изменения next.config.ts

---

**Готово!** Теперь приложение работает с реальным API! 🎉
