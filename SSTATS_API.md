# 🎯 Интеграция с API sstats.net

## ✅ Что реализовано

### 1. Типизация API (lib/types/api.ts)

**Интерфейсы:**
- `GetMatchesParams` - параметры запроса к API
- `ApiMatch` - структура матча из API
- `ApiMatchesResponse` - ответ от API
- `ApiTeam`, `ApiOdds`, `ApiScore` - вспомогательные типы

**Функция:**
- `getClientTimeZone()` - автоматическое определение часового пояса клиента

### 2. API функции (lib/api/sstats.ts)

**Основные функции:**
- `fetchMatches()` - получение матчей с параметрами
- `fetchAllMatches()` - получение всех матчей с автоматической пагинацией
- `fetchLiveMatches()` - только Live матчи
- `fetchUpcomingMatches()` - только предстоящие матчи

**Трансформация данных:**
- `transformApiMatch()` - преобразование из формата API в формат приложения

### 3. React Query хуки (lib/hooks/useSstatsMatches.ts)

**Хуки:**
- `useTodayMatches()` - матчи за сегодня с фильтрацией
- `useLiveMatches()` - только Live матчи (автообновление каждые 30 сек)
- `useUpcomingMatches()` - только предстоящие матчи
- `useInfiniteMatches()` - бесконечная прокрутка с пагинацией
- `useMatchesBySport()` - фильтрация по виду спорта

## 📡 API Endpoint

**URL**: `https://api.sstats.net/Games/list`

**Метод**: GET

**Query параметры:**

| Параметр | Тип | Описание | По умолчанию |
|----------|-----|----------|--------------|
| `Today` | boolean | Матчи за сегодня | `true` |
| `TimeZone` | number | Часовой пояс клиента | Авто-определение |
| `Limit` | number | Максимум матчей за запрос | `1000` |
| `Offset` | number | Пропустить N матчей | `0` |
| `Live` | boolean | Только Live матчи | - |
| `Upcoming` | boolean | Только предстоящие | - |

## 🔧 Использование

### Базовое использование

```typescript
import { useTodayMatches } from '@/lib/hooks/useSstatsMatches'

function MatchesList() {
  const { data, isLoading, error } = useTodayMatches()

  if (isLoading) return <div>Загрузка...</div>
  if (error) return <div>Ошибка: {error.message}</div>

  return (
    <div>
      <p>Всего матчей: {data?.total}</p>
      {data?.matches.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  )
}
```

### Только Live матчи

```typescript
import { useLiveMatches } from '@/lib/hooks/useSstatsMatches'

function LiveMatches() {
  const { data: matches } = useLiveMatches()

  return (
    <div>
      {matches?.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  )
}
```

### С фильтрацией

```typescript
const { data } = useTodayMatches({
  Live: true,  // Только Live
  Limit: 50,   // Первые 50
})
```

### Бесконечная прокрутка

```typescript
import { useInfiniteMatches } from '@/lib/hooks/useSstatsMatches'

function InfiniteMatchesList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteMatches()

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.matches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ))}
      
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Загрузка...' : 'Загрузить еще'}
        </button>
      )}
    </div>
  )
}
```

### Фильтрация по виду спорта

```typescript
import { useMatchesBySport } from '@/lib/hooks/useSstatsMatches'

function FootballMatches() {
  const { data } = useMatchesBySport('football')

  return (
    <div>
      {data?.matches.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  )
}
```

## ⚙️ Конфигурация

### Автообновление Live матчей

По умолчанию Live матчи обновляются каждые 30 секунд. Можно изменить:

```typescript
const { data } = useLiveMatches({
  refetchInterval: 60000, // 60 секунд
})
```

### Отключение автообновления

```typescript
const { data } = useTodayMatches(
  { Live: true },
  { refetchInterval: false }
)
```

### Условная загрузка

```typescript
const [enabled, setEnabled] = useState(false)

const { data } = useTodayMatches({}, {
  enabled: enabled, // Запрос выполнится только когда enabled = true
})
```

## 🔄 Трансформация данных

API возвращает данные в своем формате, которые автоматически преобразуются в формат приложения:

**Из API:**
```json
{
  "id": "123",
  "sportType": "Football",
  "homeTeam": { "id": "1", "name": "Team A" },
  "awayTeam": { "id": "2", "name": "Team B" },
  "startTime": "2026-04-29T19:00:00Z",
  "isLive": true,
  "score": { "home": 2, "away": 1 },
  "odds": { "home": 2.5, "draw": 3.2, "away": 2.8 }
}
```

**В приложение:**
```typescript
{
  id: "123",
  sport_type: "football",
  team1: { id: "1", name: "Team A" },
  team2: { id: "2", name: "Team B" },
  start_time: "2026-04-29T19:00:00Z",
  is_live: true,
  score: { team1: 2, team2: 1 },
  odds: { p1: 2.5, x: 3.2, p2: 2.8 }
}
```

## 🌍 Часовые пояса

Приложение автоматически определяет часовой пояс клиента:

```typescript
import { getClientTimeZone } from '@/lib/types/api'

const timezone = getClientTimeZone()
// Для UTC+3 вернет: 3
// Для UTC-5 вернет: -5
```

API использует этот параметр для правильного определения границы "сегодня".

## 📊 Пагинация

Если матчей больше 1000, используйте пагинацию:

### Вариант 1: Автоматическая (fetchAllMatches)

```typescript
import { fetchAllMatches } from '@/lib/api/sstats'

const allMatches = await fetchAllMatches()
// Загрузит ВСЕ матчи автоматически
```

### Вариант 2: Ручная

```typescript
const { data: page1 } = useTodayMatches({ Offset: 0, Limit: 1000 })
const { data: page2 } = useTodayMatches({ Offset: 1000, Limit: 1000 })
```

### Вариант 3: Бесконечная прокрутка

```typescript
const { data, fetchNextPage } = useInfiniteMatches()
// Автоматически управляет Offset
```

## 🔍 Кэширование

React Query автоматически кэширует данные:

**Ключи кэша:**
- `['matches', 'today', params]` - матчи за сегодня
- `['matches', 'live']` - Live матчи
- `['matches', 'upcoming']` - предстоящие матчи
- `['matches', 'infinite', params]` - бесконечная прокрутка

**Время жизни кэша:**
- Live матчи: 20 секунд (`staleTime`)
- Обычные матчи: 60 секунд

## 🐛 Обработка ошибок

```typescript
const { data, error, isError } = useTodayMatches()

if (isError) {
  console.error('Ошибка загрузки:', error)
  // Показать уведомление пользователю
}
```

## 📝 Примеры интеграции в UI

### Замена mock-данных

**Было (app/page.tsx):**
```typescript
import { mockMatches } from '@/lib/mock-data'

const matches = mockMatches
```

**Стало:**
```typescript
import { useTodayMatches } from '@/lib/hooks/useSstatsMatches'

const { data, isLoading } = useTodayMatches()
const matches = data?.matches || []
```

### С фильтром Live

```typescript
const [showLiveOnly, setShowLiveOnly] = useState(false)

const { data, isLoading } = useTodayMatches({
  Live: showLiveOnly || undefined,
})
```

### С фильтром по спорту

```typescript
const [selectedSport, setSelectedSport] = useState('all')

const { data, isLoading } = useMatchesBySport(
  selectedSport === 'all' ? null : selectedSport
)
```

## ✅ Готово к использованию

Интеграция полностью готова! Теперь можно:

1. Заменить mock-данные на реальные из API
2. Использовать любой из хуков в компонентах
3. Настроить автообновление для Live матчей
4. Добавить пагинацию при необходимости

---

**Дата**: 2026-04-29
**API**: https://api.sstats.net/Games/list
**Статус**: ✅ Production Ready
