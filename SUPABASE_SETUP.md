# 🚀 Настройка Supabase для bTracker

## Что такое Supabase?

Supabase - это open-source альтернатива Firebase, предоставляющая:
- ✅ PostgreSQL база данных
- ✅ Готовая система авторизации (JWT токены)
- ✅ REST API (автоматически генерируется)
- ✅ Realtime подписки
- ✅ Storage для файлов
- ✅ Row Level Security (RLS)

## 📋 Шаг 1: Создание проекта в Supabase

### 1.1 Регистрация

1. Перейдите на https://supabase.com
2. Нажмите "Start your project"
3. Войдите через GitHub или создайте аккаунт

### 1.2 Создание проекта

1. Нажмите "New Project"
2. Заполните форму:
   - **Name**: btracker (или любое имя)
   - **Database Password**: создайте надежный пароль (сохраните его!)
   - **Region**: выберите ближайший регион (например, Europe West)
   - **Pricing Plan**: Free (для начала)
3. Нажмите "Create new project"
4. Подождите 2-3 минуты пока проект создается

## 📋 Шаг 2: Получение API ключей

### 2.1 Найдите настройки API

1. В левом меню выберите **Settings** (⚙️)
2. Перейдите в **API**
3. Найдите секцию **Project API keys**

### 2.2 Скопируйте ключи

Вам нужны два значения:

**Project URL**:
```
https://ваш-проект-id.supabase.co
```

**anon public** (API Key):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Важно**: Не путайте с `service_role` ключом! Используйте только `anon public`.

## 📋 Шаг 3: Настройка переменных окружения

### 3.1 Создайте файл .env.local

В корне проекта `btracker/` создайте файл `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ваш-проект-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_anon_public_ключ
```

### 3.2 Замените значения

Вставьте ваши реальные значения из Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xyzabcdefg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiY2RlZmciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NjY0NjY0NiwiZXhwIjoxOTYyMjIyNjQ2fQ.ваш_токен
```

⚠️ **Важно**: Файл `.env.local` уже добавлен в `.gitignore` и не будет закоммичен в git.

## 📋 Шаг 4: Настройка базы данных

### 4.1 Откройте SQL Editor

1. В левом меню Supabase выберите **SQL Editor**
2. Нажмите **New query**

### 4.2 Выполните SQL скрипт

1. Откройте файл `supabase/schema.sql` в вашем проекте
2. Скопируйте весь SQL код
3. Вставьте в SQL Editor в Supabase
4. Нажмите **Run** (или Ctrl+Enter)

### 4.3 Проверьте результат

Вы должны увидеть сообщение "Success. No rows returned".

### 4.4 Проверьте созданные таблицы

1. В левом меню выберите **Table Editor**
2. Вы должны увидеть таблицы:
   - `profiles` - профили пользователей
   - `favorite_matches` - избранные матчи
   - `bet_history` - история ставок

## 📋 Шаг 5: Настройка Email провайдера (опционально)

По умолчанию Supabase использует встроенный email сервис (ограничен 3 письма в час).

### Для production рекомендуется настроить свой SMTP:

1. Перейдите в **Settings** → **Auth**
2. Прокрутите до **SMTP Settings**
3. Включите **Enable Custom SMTP**
4. Заполните данные вашего SMTP провайдера (Gmail, SendGrid, etc.)

## 📋 Шаг 6: Обновление кода приложения

### 6.1 Обновите providers.tsx

Замените импорт AuthProvider:

```typescript
// Было:
import { AuthProvider } from '@/lib/contexts/auth-context'

// Стало:
import { AuthProvider } from '@/lib/contexts/auth-context-supabase'
```

**Файл**: `components/providers.tsx`

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { AuthProvider } from '@/lib/contexts/auth-context-supabase'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}
```

### 6.2 Перезапустите dev-сервер

```bash
# Остановите текущий сервер (Ctrl+C)
npm run dev
```

## 📋 Шаг 7: Тестирование

### 7.1 Откройте приложение

```
http://localhost:3000
```

### 7.2 Тестируйте регистрацию

1. Нажмите "Регистрация" в Header
2. Заполните форму:
   - Email: test@example.com
   - Username: testuser
   - Пароль: password123
   - Подтверждение: password123
3. Нажмите "Зарегистрироваться"

### 7.3 Проверьте email

⚠️ **Важно**: Supabase отправит письмо с подтверждением на указанный email.

**Для разработки** можно отключить подтверждение email:
1. Перейдите в **Authentication** → **Settings**
2. Найдите **Email Confirmations**
3. Отключите "Enable email confirmations"

### 7.4 Проверьте базу данных

1. Перейдите в **Table Editor** → **profiles**
2. Вы должны увидеть нового пользователя

### 7.5 Тестируйте вход

1. Нажмите "Войти"
2. Введите email и пароль
3. Вы должны войти в систему

## 🎯 Что дальше?

### Проверьте функциональность:

- ✅ Регистрация работает
- ✅ Вход работает
- ✅ Профиль отображается
- ✅ Выход работает
- ✅ Данные сохраняются в Supabase

### Дополнительные фичи:

1. **Избранные матчи**
   - Таблица `favorite_matches` уже создана
   - Нужно добавить UI для добавления/удаления

2. **История ставок**
   - Таблица `bet_history` уже создана
   - Нужно добавить UI для отображения

3. **Редактирование профиля**
   - Добавить форму редактирования
   - Загрузка аватара в Supabase Storage

## 🔧 Полезные команды Supabase

### Просмотр пользователей

```sql
SELECT * FROM auth.users;
```

### Просмотр профилей

```sql
SELECT * FROM public.profiles;
```

### Удаление пользователя (для тестирования)

```sql
DELETE FROM auth.users WHERE email = 'test@example.com';
```

### Сброс пароля пользователя

В Supabase Dashboard:
1. **Authentication** → **Users**
2. Найдите пользователя
3. Нажмите "..." → **Send password recovery**

## 🐛 Troubleshooting

### Проблема: "Invalid API key"

**Решение**: 
- Проверьте, что скопировали `anon public` ключ, а не `service_role`
- Убедитесь, что нет лишних пробелов в `.env.local`
- Перезапустите dev-сервер

### Проблема: "Failed to fetch"

**Решение**:
- Проверьте URL проекта в `.env.local`
- Убедитесь, что проект Supabase активен
- Проверьте интернет соединение

### Проблема: "User already registered"

**Решение**:
- Email уже используется
- Используйте другой email или удалите пользователя из Supabase

### Проблема: "Email not confirmed"

**Решение**:
- Проверьте почту и подтвердите email
- Или отключите подтверждение email в настройках (см. Шаг 7.3)

### Проблема: RLS policy violation

**Решение**:
- Убедитесь, что выполнили SQL скрипт полностью
- Проверьте политики в **Authentication** → **Policies**

## 📚 Дополнительные ресурсы

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## ✅ Checklist

- [ ] Создан проект в Supabase
- [ ] Скопированы API ключи
- [ ] Создан файл `.env.local`
- [ ] Выполнен SQL скрипт
- [ ] Обновлен `providers.tsx`
- [ ] Перезапущен dev-сервер
- [ ] Протестирована регистрация
- [ ] Протестирован вход
- [ ] Проверен профиль
- [ ] Протестирован выход

---

**Готово!** Теперь ваше приложение использует Supabase для авторизации и хранения данных! 🎉
