# Архитектура проекта

## Обзор

Приложение построено на современном стеке Next.js 16 с использованием App Router, TypeScript и Tailwind CSS. Архитектура следует принципам разделения ответственности и модульности.

## Структура директорий

```
btracker/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Корневой layout
│   ├── page.tsx           # Главная страница
│   └── globals.css        # Глобальные стили
├── components/            # React компоненты
│   ├── header.tsx
│   ├── banner-carousel.tsx
│   ├── sport-filter.tsx
│   ├── match-card.tsx
│   ├── match-card-skeleton.tsx
│   └── providers.tsx
├── lib/                   # Бизнес-логика и утилиты
│   ├── api/              # API клиенты
│   │   ├── axios.ts
│   │   └── matches.ts
│   ├── hooks/            # Custom React hooks
│   │   └── useMatches.ts
│   ├── types.ts          # TypeScript типы
│   ├── utils.ts          # Утилиты
│   └── mock-data.ts      # Тестовые данные
└── next.config.ts        # Конфигурация Next.js
```

## Слои приложения

### 1. Presentation Layer (Компоненты)

**Ответственность**: Отображение UI и обработка пользовательских взаимодействий.

**Компоненты**:
- `Header` - Навигация и действия пользователя
- `BannerCarousel` - Промо-баннеры
- `SportFilter` - Фильтрация по видам спорта
- `MatchCard` - Карточка матча
- `MatchCardSkeleton` - Состояние загрузки

**Принципы**:
- Компоненты не содержат бизнес-логику
- Получают данные через props
- Используют хуки для состояния UI
- Максимально переиспользуемые

### 2. Data Layer (API и хуки)

**Ответственность**: Получение, кэширование и управление данными.

**Компоненты**:
- `axios.ts` - HTTP клиент с базовой конфигурацией
- `matches.ts` - API методы для работы с матчами
- `useMatches.ts` - React Query хук для получения данных

**Принципы**:
- Единая точка доступа к API
- Автоматическое кэширование (React Query)
- Обработка ошибок
- Типобезопасность

### 3. Domain Layer (Типы и модели)

**Ответственность**: Определение структуры данных приложения.

**Файлы**:
- `types.ts` - TypeScript интерфейсы

**Принципы**:
- Строгая типизация
- Независимость от API (трансформация данных)
- Переиспользуемость типов

## Поток данных

```
API (sstats.net)
    ↓
Next.js Proxy (/api/proxy/*)
    ↓
Axios Client (lib/api/axios.ts)
    ↓
API Methods (lib/api/matches.ts)
    ↓
React Query Hook (lib/hooks/useMatches.ts)
    ↓
React Component (app/page.tsx)
    ↓
UI Components (components/*)
```

## Управление состоянием

### Серверное состояние (React Query)

Используется для данных с сервера:
- Список матчей
- Детали матча
- Коэффициенты

**Преимущества**:
- Автоматическое кэширование
- Фоновое обновление
- Оптимистичные обновления
- Retry логика

### Клиентское состояние (React useState)

Используется для UI состояния:
- Выбранный вид спорта
- Фильтр Live/Все
- Открытые модальные окна

### Локальное хранилище (localStorage)

Используется для персистентных данных:
- Избранные матчи
- Настройки пользователя
- Язык интерфейса

## Обработка ошибок

### API ошибки

```typescript
// lib/api/axios.ts
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    // Можно добавить toast уведомления
    return Promise.reject(error)
  }
)
```

### React Query ошибки

```typescript
const { data, error, isError } = useMatches()

if (isError) {
  return <ErrorComponent error={error} />
}
```

## Оптимизация производительности

### 1. Кэширование

React Query автоматически кэширует данные:
- `staleTime: 60000` - данные считаются свежими 1 минуту
- `refetchInterval: 30000` - автообновление Live-матчей каждые 30 секунд

### 2. Code Splitting

Next.js автоматически разделяет код по страницам:
- Каждая страница загружается отдельно
- Компоненты можно загружать динамически

### 3. Image Optimization

Next.js Image компонент для логотипов:
- Автоматическая оптимизация
- Lazy loading
- Responsive images

### 4. CSS Optimization

Tailwind CSS с JIT компилятором:
- Генерируются только используемые классы
- Минимальный размер CSS

## Безопасность

### CORS

Next.js proxy обходит CORS ограничения:
```typescript
// next.config.ts
async rewrites() {
  return [
    {
      source: '/api/proxy/:path*',
      destination: 'https://api.sstats.net/v1/:path*',
    },
  ]
}
```

### XSS Protection

- React автоматически экранирует данные
- Используем TypeScript для типобезопасности
- Валидация данных от API

### Environment Variables

Чувствительные данные в `.env.local`:
```
NEXT_PUBLIC_API_URL=https://api.sstats.net/v1
API_SECRET_KEY=your_secret_key
```

## Тестирование (будущее)

### Unit тесты
- Jest для логики
- React Testing Library для компонентов

### Integration тесты
- Тестирование API интеграции
- Тестирование пользовательских сценариев

### E2E тесты
- Playwright для end-to-end тестов

## Deployment

### Vercel (рекомендуется)

```bash
npm run build
vercel deploy
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## Мониторинг

### Метрики производительности
- Next.js Analytics
- Web Vitals (LCP, FID, CLS)

### Логирование ошибок
- Sentry для production
- Console для development

## Масштабирование

### Горизонтальное
- Next.js легко масштабируется на Vercel
- Можно использовать CDN для статики

### Вертикальное
- Оптимизация запросов к API
- Увеличение кэша React Query
- Использование ISR (Incremental Static Regeneration)

## Best Practices

1. **Компоненты**
   - Один компонент = одна ответственность
   - Props типизированы
   - Используем composition over inheritance

2. **Стили**
   - Tailwind утилиты вместо custom CSS
   - Используем `cn()` для условных классов
   - Responsive-first подход

3. **TypeScript**
   - Строгий режим включен
   - Избегаем `any`
   - Используем интерфейсы для объектов

4. **Git**
   - Conventional commits
   - Feature branches
   - Pull requests для review

5. **Производительность**
   - Lazy loading для тяжелых компонентов
   - Мемоизация дорогих вычислений
   - Оптимизация изображений
