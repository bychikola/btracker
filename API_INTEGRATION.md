# Инструкция по интеграции с API sstats.net

## 1. Получение структуры данных от API

Первым делом нужно понять, какую структуру данных возвращает API. Выполните запрос:

```bash
curl https://api.sstats.net/v1/matches
```

Или используйте браузер/Postman для просмотра ответа.

## 2. Пример адаптации типов

Предположим, API возвращает такую структуру:

```json
{
  "data": [
    {
      "match_id": "12345",
      "sport": "football",
      "tournament": "UEFA Champions League",
      "home_team": {
        "id": "t1",
        "name": "Manchester City",
        "logo_url": "https://..."
      },
      "away_team": {
        "id": "t2",
        "name": "Real Madrid",
        "logo_url": "https://..."
      },
      "start_date": "2026-04-29T19:00:00Z",
      "status": "live",
      "current_score": {
        "home": 2,
        "away": 1
      },
      "betting_odds": {
        "home_win": 2.15,
        "draw": 3.40,
        "away_win": 3.20
      }
    }
  ]
}
```

### Обновите `lib/types.ts`:

```typescript
export interface Team {
  id: string
  name: string
  logo?: string  // Изменено с logo_url
}

export interface Match {
  id: string  // Маппинг с match_id
  sport_type: string  // Маппинг с sport
  league_name: string  // Маппинг с tournament
  team1: Team  // Маппинг с home_team
  team2: Team  // Маппинг с away_team
  start_time: string  // Маппинг с start_date
  is_live: boolean  // Маппинг с status === 'live'
  score?: Score  // Маппинг с current_score
  odds: Odds  // Маппинг с betting_odds
  is_favorite?: boolean
}
```

### Обновите `lib/api/matches.ts`:

```typescript
import { apiClient } from './axios'
import { Match } from '../types'

interface ApiResponse {
  data: any[]
}

// Функция для преобразования данных API в наш формат
function transformMatch(apiMatch: any): Match {
  return {
    id: apiMatch.match_id,
    sport_type: apiMatch.sport,
    league_name: apiMatch.tournament,
    team1: {
      id: apiMatch.home_team.id,
      name: apiMatch.home_team.name,
      logo: apiMatch.home_team.logo_url,
    },
    team2: {
      id: apiMatch.away_team.id,
      name: apiMatch.away_team.name,
      logo: apiMatch.away_team.logo_url,
    },
    start_time: apiMatch.start_date,
    is_live: apiMatch.status === 'live',
    score: apiMatch.current_score ? {
      team1: apiMatch.current_score.home,
      team2: apiMatch.current_score.away,
    } : undefined,
    odds: {
      p1: apiMatch.betting_odds.home_win,
      x: apiMatch.betting_odds.draw || 0,
      p2: apiMatch.betting_odds.away_win,
    },
  }
}

export interface GetMatchesParams {
  sport?: string
  is_live?: boolean
  limit?: number
}

export const matchesApi = {
  getMatches: async (params?: GetMatchesParams): Promise<Match[]> => {
    const response = await apiClient.get<ApiResponse>('/matches', { params })
    return response.data.data.map(transformMatch)
  },

  getMatchById: async (id: string): Promise<Match> => {
    const response = await apiClient.get<any>(`/matches/${id}`)
    return transformMatch(response.data)
  },
}
```

## 3. Тестирование интеграции

### Шаг 1: Проверьте доступность API

Откройте браузер и перейдите на:
```
http://localhost:3000/api/proxy/matches
```

Если видите данные - proxy работает корректно.

### Шаг 2: Замените mock-данные

```bash
# Сделайте бэкап текущей страницы
Copy-Item app/page.tsx app/page.mock.tsx

# Замените на версию с API
Copy-Item app/page-with-api.tsx.example app/page.tsx
```

Раскомментируйте код в `app/page-with-api.tsx.example` и скопируйте его в `app/page.tsx`.

### Шаг 3: Проверьте в браузере

1. Откройте http://localhost:3000
2. Откройте DevTools (F12) → вкладка Network
3. Проверьте запросы к `/api/proxy/matches`
4. Если есть ошибки - смотрите консоль

## 4. Частые проблемы и решения

### Проблема: CORS ошибка

**Решение**: Убедитесь, что запросы идут через `/api/proxy/`, а не напрямую к `api.sstats.net`.

### Проблема: 404 Not Found

**Решение**: Проверьте правильность эндпоинта. Возможно, API использует другой путь (например, `/events` вместо `/matches`).

### Проблема: Неправильная структура данных

**Решение**: 
1. Выведите в консоль реальный ответ API
2. Обновите функцию `transformMatch` под реальную структуру

### Проблема: Логотипы не загружаются

**Решение**: Проверьте, что URL логотипов корректные. Возможно, нужно добавить базовый URL:

```typescript
logo: apiMatch.home_team.logo_url 
  ? `https://cdn.sstats.net${apiMatch.home_team.logo_url}` 
  : undefined
```

## 5. Отладка

Добавьте логирование в `lib/api/matches.ts`:

```typescript
export const matchesApi = {
  getMatches: async (params?: GetMatchesParams): Promise<Match[]> => {
    console.log('Fetching matches with params:', params)
    const response = await apiClient.get<ApiResponse>('/matches', { params })
    console.log('API Response:', response.data)
    const transformed = response.data.data.map(transformMatch)
    console.log('Transformed matches:', transformed)
    return transformed
  },
}
```

## 6. Оптимизация

После успешной интеграции:

1. **Настройте кэширование**: React Query уже настроен, но можете изменить `staleTime` в `lib/hooks/useMatches.ts`

2. **Добавьте обработку ошибок**: Создайте компонент для отображения ошибок

3. **Оптимизируйте изображения**: Используйте Next.js Image для логотипов команд

4. **Добавьте пагинацию**: Если API возвращает много матчей

## 7. Checklist интеграции

- [ ] Получен доступ к API
- [ ] Изучена документация API (Swagger/OpenAPI)
- [ ] Проверена структура ответа API
- [ ] Обновлены TypeScript типы
- [ ] Создана функция трансформации данных
- [ ] Протестирован proxy в next.config.ts
- [ ] Заменены mock-данные на реальные
- [ ] Проверена работа фильтров
- [ ] Проверено автообновление Live-матчей
- [ ] Протестирована обработка ошибок
- [ ] Проверена загрузка логотипов команд
