# 🔧 Решение проблем с регистрацией

## Проблема 1: 429 Too Many Requests

**Причина**: Supabase ограничивает количество регистраций с одного IP (защита от спама).

**Решение**:
1. Подождите 1-2 минуты
2. Или используйте другой email
3. Или очистите существующих пользователей в Supabase

### Очистка пользователей в Supabase:

1. Откройте Supabase Dashboard
2. Перейдите в **SQL Editor**
3. Выполните:

```sql
-- Удалить всех тестовых пользователей
DELETE FROM auth.users WHERE email LIKE '%test%';
DELETE FROM auth.users WHERE email LIKE '%example%';
```

## Проблема 2: 401 на /profiles

**Причина**: RLS политики блокируют создание профиля или профиль создается до того, как пользователь авторизован.

**Решение**: Обновим SQL скрипт для автоматического создания профиля.

### Выполните в SQL Editor:

```sql
-- 1. Удалите старый триггер
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Создайте новую функцию
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Создайте триггер заново
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Обновите RLS политику для вставки
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);  -- Разрешаем вставку всем (триггер контролирует безопасность)
```

## Проблема 3: Профиль не создается автоматически

**Альтернативное решение**: Создавать профиль вручную в коде.

### Обновите auth-context-supabase.tsx:

Найдите функцию `register` и замените на:

```typescript
const register = async (
  email: string,
  username: string,
  password: string,
  firstName?: string,
  lastName?: string
) => {
  // 1. Регистрация в Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
        first_name: firstName,
        last_name: lastName,
      }
    }
  })

  if (authError) throw authError
  if (!authData.user) throw new Error('Registration failed')

  // 2. Подождем немного для триггера
  await new Promise(resolve => setTimeout(resolve, 1000))

  // 3. Проверим, создался ли профиль
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', authData.user.id)
    .single()

  // 4. Если профиль не создался, создадим вручную
  if (!existingProfile) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        username,
        first_name: firstName,
        last_name: lastName,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Не бросаем ошибку, профиль может создаться триггером позже
    }
  }

  // 5. Загрузка профиля
  await loadUserProfile(authData.user.id)
}
```

## Быстрое решение (рекомендуется)

### Шаг 1: Подождите 2 минуты
Supabase снимет ограничение 429.

### Шаг 2: Выполните улучшенный SQL
Скопируйте SQL из "Проблема 2" выше и выполните в SQL Editor.

### Шаг 3: Попробуйте снова
Используйте новый email (не test@example.com).

## Проверка настроек Supabase

### 1. Проверьте Email Settings

1. **Authentication** → **Settings**
2. Найдите "Email Confirmations"
3. **Отключите** "Enable email confirmations"
4. Сохраните

### 2. Проверьте Rate Limits

1. **Authentication** → **Settings**
2. Прокрутите до "Rate Limits"
3. Убедитесь, что лимиты не слишком строгие

### 3. Проверьте таблицу profiles

1. **Table Editor** → **profiles**
2. Убедитесь, что таблица существует
3. Проверьте RLS политики (должны быть включены)

## Тестирование

После исправлений:

```bash
# 1. Очистите кэш браузера (Ctrl+Shift+Delete)
# 2. Перезагрузите страницу (Ctrl+F5)
# 3. Попробуйте зарегистрироваться с новым email
```

## Если проблема остается

### Временное решение: Отключите RLS

⚠️ **Только для разработки!**

```sql
-- Отключить RLS на время тестирования
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

После тестирования включите обратно:

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

## Логи для отладки

Добавьте в `auth-context-supabase.tsx`:

```typescript
const register = async (...) => {
  console.log('1. Starting registration...')
  
  const { data: authData, error: authError } = await supabase.auth.signUp(...)
  console.log('2. Auth result:', { authData, authError })
  
  if (authError) {
    console.error('3. Auth error:', authError)
    throw authError
  }
  
  console.log('4. Creating profile...')
  // ... остальной код
}
```

Проверьте консоль браузера (F12) для деталей.
