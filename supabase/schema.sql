-- =====================================================
-- Supabase Database Setup для bTracker
-- =====================================================

-- 1. Создание таблицы профилей пользователей
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Включение Row Level Security (RLS)
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Политики безопасности для profiles
-- =====================================================

-- Пользователи могут читать все профили
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Пользователи могут обновлять только свой профиль
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Пользователи могут вставлять только свой профиль
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Функция для автоматического создания профиля при регистрации
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Триггер для автоматического создания профиля
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Функция для обновления updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Триггер для автоматического обновления updated_at
-- =====================================================
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 8. Создание таблицы избранных матчей
-- =====================================================
CREATE TABLE IF NOT EXISTS public.favorite_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  match_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- 9. RLS для favorite_matches
-- =====================================================
ALTER TABLE public.favorite_matches ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть только свои избранные
CREATE POLICY "Users can view own favorites"
  ON public.favorite_matches
  FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователи могут добавлять свои избранные
CREATE POLICY "Users can insert own favorites"
  ON public.favorite_matches
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Пользователи могут удалять свои избранные
CREATE POLICY "Users can delete own favorites"
  ON public.favorite_matches
  FOR DELETE
  USING (auth.uid() = user_id);

-- 10. Создание индексов для производительности
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_favorite_matches_user_id ON public.favorite_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_matches_match_id ON public.favorite_matches(match_id);

-- 11. Создание таблицы истории ставок (опционально)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bet_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  match_id TEXT NOT NULL,
  bet_type TEXT NOT NULL, -- 'p1', 'x', 'p2'
  odds DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'won', 'lost'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. RLS для bet_history
-- =====================================================
ALTER TABLE public.bet_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bet history"
  ON public.bet_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bets"
  ON public.bet_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 13. Индексы для bet_history
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_bet_history_user_id ON public.bet_history(user_id);
CREATE INDEX IF NOT EXISTS idx_bet_history_match_id ON public.bet_history(match_id);
CREATE INDEX IF NOT EXISTS idx_bet_history_status ON public.bet_history(status);

-- =====================================================
-- Готово! Теперь ваша база данных настроена
-- =====================================================

-- Проверка созданных таблиц:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
