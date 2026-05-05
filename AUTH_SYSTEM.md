# Система авторизации и регистрации

## 📋 Обзор

Реализована полноценная система авторизации с JWT токенами, включающая:
- ✅ Регистрацию новых пользователей
- ✅ Вход в систему
- ✅ Выход из системы
- ✅ Автоматическое обновление токенов
- ✅ Защищенные маршруты
- ✅ Профиль пользователя

## 🏗️ Архитектура

### Компоненты

```
lib/
├── api/
│   ├── auth.ts              # API методы авторизации
│   └── axios.ts             # HTTP клиент с interceptors
├── contexts/
│   └── auth-context.tsx     # React Context для авторизации
└── types/
    └── auth.ts              # TypeScript типы

components/
└── auth/
    ├── login-modal.tsx      # Модальное окно входа
    └── register-modal.tsx   # Модальное окно регистрации

app/
└── profile/
    └── page.tsx             # Страница профиля
```

## 🔐 Как это работает

### 1. Регистрация

**Компонент**: `components/auth/register-modal.tsx`

**Поля формы**:
- Email (обязательно)
- Имя пользователя (обязательно)
- Пароль (обязательно, минимум 6 символов)
- Подтверждение пароля (обязательно)
- Имя (опционально)
- Фамилия (опционально)

**Процесс**:
1. Пользователь заполняет форму
2. Валидация на клиенте (совпадение паролей, длина)
3. POST запрос на `/api/proxy/auth/register`
4. Получение токенов (access + refresh)
5. Сохранение в localStorage
6. Автоматический вход

### 2. Вход

**Компонент**: `components/auth/login-modal.tsx`

**Поля формы**:
- Email
- Пароль

**Процесс**:
1. Пользователь вводит данные
2. POST запрос на `/api/proxy/auth/login`
3. Получение токенов
4. Сохранение в localStorage
5. Загрузка данных пользователя

### 3. Автоматическая авторизация

При загрузке приложения:
1. Проверяется наличие токена в localStorage
2. Если токен есть → запрос `/api/proxy/auth/me`
3. Загрузка данных пользователя
4. Установка состояния авторизации

### 4. Обновление токенов

**Автоматическое обновление** (axios interceptor):
- При получении 401 ошибки
- Автоматический запрос на `/api/proxy/auth/refresh`
- Обновление токена
- Повторный запрос с новым токеном

## 🔧 Использование

### В компонентах

```tsx
import { useAuth } from '@/lib/contexts/auth-context'

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()

  if (!isAuthenticated) {
    return <div>Войдите в систему</div>
  }

  return (
    <div>
      <p>Привет, {user.username}!</p>
      <button onClick={logout}>Выйти</button>
    </div>
  )
}
```

### Защищенные страницы

```tsx
'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) return <div>Загрузка...</div>
  if (!isAuthenticated) return null

  return <div>Защищенный контент</div>
}
```

### API запросы с авторизацией

Токен автоматически добавляется ко всем запросам через axios interceptor:

```tsx
import { apiClient } from '@/lib/api/axios'

// Токен добавится автоматически
const response = await apiClient.get('/user/favorites')
```

## 📡 API Endpoints

### Регистрация
```
POST /api/proxy/auth/register

Body:
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "firstName": "Иван",      // опционально
  "lastName": "Иванов"      // опционально
}

Response:
{
  "user": {
    "id": "123",
    "email": "user@example.com",
    "username": "username",
    "firstName": "Иван",
    "lastName": "Иванов",
    "createdAt": "2026-04-29T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Вход
```
POST /api/proxy/auth/login

Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response: (такой же как при регистрации)
```

### Получение текущего пользователя
```
GET /api/proxy/auth/me

Headers:
Authorization: Bearer <token>

Response:
{
  "id": "123",
  "email": "user@example.com",
  "username": "username",
  "firstName": "Иван",
  "lastName": "Иванов",
  "createdAt": "2026-04-29T12:00:00Z"
}
```

### Обновление токена
```
POST /api/proxy/auth/refresh

Body:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Выход
```
POST /api/proxy/auth/logout

Headers:
Authorization: Bearer <token>

Response: 200 OK
```

## 🎨 UI Компоненты

### LoginModal

**Особенности**:
- Валидация email
- Показ ошибок
- Состояние загрузки
- Переключение на регистрацию
- Ссылка "Забыли пароль?"

### RegisterModal

**Особенности**:
- Валидация всех полей
- Проверка совпадения паролей
- Минимальная длина пароля (6 символов)
- Показ ошибок
- Состояние загрузки
- Переключение на вход

### Header

**Для неавторизованных**:
- Кнопка "Войти"
- Кнопка "Регистрация"

**Для авторизованных**:
- Аватар пользователя
- Имя пользователя
- Выпадающее меню:
  - Профиль
  - Выйти

## 🔒 Безопасность

### Хранение токенов

Токены хранятся в `localStorage`:
- `auth_token` - access token (короткий срок жизни)
- `refresh_token` - refresh token (длинный срок жизни)

**Важно**: В production рекомендуется использовать httpOnly cookies для refresh токенов.

### Автоматическое обновление

При истечении access токена:
1. Перехватывается 401 ошибка
2. Автоматический запрос с refresh токеном
3. Получение нового access токена
4. Повторение оригинального запроса

### Очистка при выходе

При выходе:
1. Запрос на сервер для инвалидации токенов
2. Удаление токенов из localStorage
3. Очистка состояния пользователя

## 🧪 Тестирование (Mock режим)

Для тестирования без реального API создайте mock endpoints:

```typescript
// lib/api/auth.ts (mock версия)
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Имитация задержки
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock данные
    return {
      user: {
        id: '1',
        email: credentials.email,
        username: 'testuser',
        firstName: 'Тест',
        lastName: 'Пользователь',
        createdAt: new Date().toISOString(),
      },
      token: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
    }
  },
  // ... остальные методы
}
```

## 📝 Интеграция с реальным API

### Шаг 1: Проверьте структуру API

Убедитесь, что ваш API возвращает данные в ожидаемом формате. Если структура отличается, обновите типы в `lib/types/auth.ts`.

### Шаг 2: Настройте endpoints

Если пути API отличаются, обновите их в `lib/api/auth.ts`:

```typescript
export const authApi = {
  login: async (credentials: LoginCredentials) => {
    // Измените путь если нужно
    const response = await apiClient.post('/auth/signin', credentials)
    return response.data
  },
}
```

### Шаг 3: Обработка ошибок

Добавьте обработку специфичных ошибок вашего API:

```typescript
try {
  await login(email, password)
} catch (err: any) {
  if (err.response?.status === 400) {
    setError('Неверный email или пароль')
  } else if (err.response?.status === 429) {
    setError('Слишком много попыток. Попробуйте позже')
  } else {
    setError('Ошибка сервера')
  }
}
```

## 🚀 Дальнейшие улучшения

### Приоритет 1
- [ ] Восстановление пароля
- [ ] Подтверждение email
- [ ] Редактирование профиля

### Приоритет 2
- [ ] OAuth (Google, Facebook)
- [ ] Двухфакторная аутентификация (2FA)
- [ ] История входов

### Приоритет 3
- [ ] Смена пароля
- [ ] Удаление аккаунта
- [ ] Экспорт данных

## 🐛 Отладка

### Проблема: Токен не сохраняется

**Решение**: Проверьте консоль браузера на ошибки localStorage. Убедитесь, что приложение работает по http/https (не file://).

### Проблема: 401 ошибка после входа

**Решение**: Проверьте формат токена в заголовке Authorization. Должно быть: `Bearer <token>`.

### Проблема: Бесконечный цикл обновления токена

**Решение**: Убедитесь, что флаг `_retry` устанавливается в axios interceptor.

## 📞 Поддержка

Если возникли вопросы по системе авторизации:
1. Проверьте консоль браузера (F12)
2. Проверьте Network tab для API запросов
3. Убедитесь, что токены сохраняются в localStorage
4. Проверьте формат ответов от API

---

**Статус**: ✅ Готово к интеграции с реальным API
**Дата**: 2026-04-29
