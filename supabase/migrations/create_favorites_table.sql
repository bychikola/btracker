-- Создание таблицы избранного
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Тип избранного: 'match', 'team', 'league'
  favorite_type TEXT NOT NULL CHECK (favorite_type IN ('match', 'team', 'league')),

  -- ID элемента (match_id, team_name, league_name)
  item_id TEXT NOT NULL,

  -- Дополнительные данные для отображения
  item_data JSONB NOT NULL,

  -- Метаданные
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Уникальность: один пользователь не может добавить один элемент дважды
  UNIQUE(user_id, favorite_type, item_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_type ON public.favorites(favorite_type);
CREATE INDEX IF NOT EXISTS idx_favorites_user_type ON public.favorites(user_id, favorite_type);

-- RLS (Row Level Security) политики
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Пользователь может видеть только свое избранное
CREATE POLICY "Users can view own favorites"
  ON public.favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователь может добавлять в свое избранное
CREATE POLICY "Users can insert own favorites"
  ON public.favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Пользователь может удалять из своего избранного
CREATE POLICY "Users can delete own favorites"
  ON public.favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Комментарии для документации
COMMENT ON TABLE public.favorites IS 'Избранные матчи, команды и лиги пользователей';
COMMENT ON COLUMN public.favorites.favorite_type IS 'Тип избранного: match, team, league';
COMMENT ON COLUMN public.favorites.item_id IS 'ID элемента (match_id для матчей, название для команд/лиг)';
COMMENT ON COLUMN public.favorites.item_data IS 'JSON с данными для отображения (названия команд, логотипы и т.д.)';
