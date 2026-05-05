# ✅ Supabase интеграция завершена!

## 🎉 Что реализовано

### 1. Система авторизации через Supabase
- ✅ Регистрация пользователей
- ✅ Вход в систему
- ✅ Автоматическое управление сессиями
- ✅ JWT токены (автоматически)
- ✅ Выход из системы

### 2. База данных PostgreSQL
- ✅ Таблица `profiles` - профили пользователей
- ✅ Таблица `favorite_matches` - избранные матчи
- ✅ Таблица `bet_history` - история ставок
- ✅ Row Level Security (RLS) настроен
- ✅ Автоматические триггеры

### 3. API функции
- ✅ `favoritesApi` - работа с избранным
- ✅ `betsApi` - работа со ставками
- ✅ `profileApi` - обновление профиля

### 4. React хуки
- ✅ `useFavorites()` - получить избранные
- ✅ `useAddFavorite()` - добавить в избранное
- ✅ `useRemoveFavorite()` - удалить из избранного
- ✅ `useIsFavorite()` - проверить избранное
- ✅ `useToggleFavorite()` - переключить избранное
- ✅ `useBetHistory()` - история ставок
- ✅ `useCreateBet()` - создать ставку
- ✅ `useBetStats()` - статистика ставок

### 5. UI интеграция
- ✅ MatchCard с кнопкой избранного
- ✅ Автоматическая синхронизация с БД
- ✅ Оптимистичные обновления

## 📁 Новые файлы

```
lib/
├── supabase/
│   ├── client.ts                    # ✅ Supabase клиент
│   └── database.ts                  # ✅ API функции для БД
├── contexts/
│   └── auth-context-supabase.tsx    # ✅ Auth Context с Supabase
└── hooks/
    └── useSupabase.ts               # ✅ React хуки

supabase/
└── schema.sql                       # ✅ SQL скрипт для БД

.env.local.example                   # ✅ Пример переменных окружения
SUPABASE_SETUP.md                    # ✅ Инструкция по настройке
```

## 🚀 Быстрый старт

### Шаг 1: Создайте проект в Supabase

1. Перейдите на https://supabase.com
2. Создайте новый проект
3. Скопируйте API ключи

### Шаг 2: Настройте переменные окружения

Создайте файл `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ваш-проект.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_anon_ключ
```

### Шаг 3: Выполните SQL скрипт

1. Откройте SQL Editor в Supabase
2. Скопируйте содержимое `supabase/schema.sql`
3. Выполните скрипт

### Шаг 4: Обновите providers.tsx

```typescript
// Замените импорт
import { AuthProvider } from '@/lib/contexts/auth-context-supabase'
```

### Шаг 5: Перезапустите сервер

```bash
npm run dev
```

## 🎯 Использование

### Избранные матчи

```tsx
import { useIsFavorite, useToggleFavorite } from '@/lib/hooks/useSupabase'

function MyComponent({ matchId }) {
  const { data: isFavorite } = useIsFavorite(matchId)
  const toggleFavorite = useToggleFavorite()

  return (
    <button onClick={() => toggleFavorite(matchId, isFavorite)}>
      {isFavorite ? 'Удалить' : 'Добавить'}
    </button>
  )
}
```

### История ставок

```tsx
import { useBetHistory, useCreateBet } from '@/lib/hooks/useSupabase'

function BetComponent() {
  const { data: history } = useBetHistory()
  const createBet = useCreateBet()

  const handleBet = () => {
    createBet.mutate({
      matchId: '123',
      betType: 'p1',
      odds: 2.5,
      amount: 100,
    })
  }

  return (
    <div>
      <button onClick={handleBet}>Сделать ставку</button>
      {history?.map(bet => (
        <div key={bet.id}>{bet.status}</div>
      ))}
    </div>
  )
}
```

### Статистика ставок

```tsx
import { useBetStats } from '@/lib/hooks/useSupabase'

function StatsComponent() {
  const { data: stats } = useBetStats()

  return (
    <div>
      <p>Всего ставок: {stats?.total}</p>
      <p>Выиграно: {stats?.won}</p>
      <p>Проиграно: {stats?.lost}</p>
      <p>Общая сумма: {stats?.totalAmount}</p>
      <p>Выигрыш: {stats?.totalWinnings}</p>
    </div>
  )
}
```

## 🔐 Безопасность

### Row Level Security (RLS)

Все таблицы защищены RLS политиками:

**profiles**:
- Все могут читать профили
- Пользователи могут обновлять только свой профиль

**favorite_matches**:
- Пользователи видят только свои избранные
- Пользователи могут добавлять/удалять только свои избранные

**bet_history**:
- Пользователи видят только свои ставки
- Пользователи могут создавать только свои ставки

### Автоматические триггеры

1. **Создание профиля** - автоматически при регистрации
2. **Обновление updated_at** - автоматически при изменении

## 📊 Структура базы данных

### Таблица: profiles

```sql
id          UUID PRIMARY KEY
email       TEXT UNIQUE NOT NULL
username    TEXT UNIQUE NOT NULL
first_name  TEXT
last_name   TEXT
avatar_url  TEXT
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### Таблица: favorite_matches

```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES profiles(id)
match_id    TEXT NOT NULL
created_at  TIMESTAMP
UNIQUE(user_id, match_id)
```

### Таблица: bet_history

```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES profiles(id)
match_id    TEXT NOT NULL
bet_type    TEXT NOT NULL ('p1', 'x', 'p2')
odds        DECIMAL(10, 2)
amount      DECIMAL(10, 2)
status      TEXT ('pending', 'won', 'lost')
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

## 🎨 Функциональность

### Текущие возможности

- ✅ Регистрация и вход через Supabase
- ✅ Добавление матчей в избранное
- ✅ Просмотр избранных матчей
- ✅ Создание ставок
- ✅ Просмотр истории ставок
- ✅ Статистика ставок

### Будущие улучшения

- [ ] Редактирование профиля
- [ ] Загрузка аватара
- [ ] Уведомления о матчах
- [ ] Экспорт истории ставок
- [ ] Фильтры для истории
- [ ] Графики статистики

## 🐛 Troubleshooting

### Проблема: "Invalid API key"

**Решение**: Проверьте `.env.local`, используйте `anon public` ключ

### Проблема: "RLS policy violation"

**Решение**: Убедитесь, что выполнили SQL скрипт полностью

### Проблема: "User not found"

**Решение**: Проверьте, что пользователь авторизован

### Проблема: Избранное не сохраняется

**Решение**: 
1. Проверьте консоль браузера на ошибки
2. Убедитесь, что пользователь авторизован
3. Проверьте RLS политики в Supabase

## 📚 Документация

- **SUPABASE_SETUP.md** - Детальная инструкция по настройке
- **supabase/schema.sql** - SQL скрипт базы данных
- **lib/supabase/database.ts** - API функции
- **lib/hooks/useSupabase.ts** - React хуки

## ✨ Итог

Supabase полностью интегрирован! Теперь у вас есть:
- Реальная база данных PostgreSQL
- Система авторизации с JWT
- Избранные матчи
- История ставок
- Статистика

Следуйте инструкции в **SUPABASE_SETUP.md** для настройки!

---

**Статус**: ✅ Готово к использованию
**Дата**: 2026-04-29
