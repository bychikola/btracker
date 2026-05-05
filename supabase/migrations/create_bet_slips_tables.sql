-- Создание таблицы купонов ставок
CREATE TABLE IF NOT EXISTS public.bet_slips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Статус купона
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'placed', 'won', 'lost', 'cancelled')),

  -- Тип ставки
  bet_type TEXT NOT NULL DEFAULT 'single' CHECK (bet_type IN ('single', 'express', 'system')),

  -- Финансовые данные
  total_odds NUMERIC(10, 2) DEFAULT 0,
  stake_amount NUMERIC(10, 2) DEFAULT 0,
  potential_win NUMERIC(10, 2) DEFAULT 0,

  -- Метаданные
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  placed_at TIMESTAMP WITH TIME ZONE,

  -- Индекс для быстрого поиска активного купона пользователя
  CONSTRAINT unique_active_bet_slip UNIQUE (user_id, status)
    DEFERRABLE INITIALLY DEFERRED
);

-- Создание таблицы элементов купона
CREATE TABLE IF NOT EXISTS public.bet_slip_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bet_slip_id UUID NOT NULL REFERENCES public.bet_slips(id) ON DELETE CASCADE,

  -- Данные матча
  match_id TEXT NOT NULL,
  match_data JSONB NOT NULL,

  -- Данные ставки
  bet_outcome TEXT NOT NULL CHECK (bet_outcome IN ('home', 'draw', 'away')),
  odds NUMERIC(10, 2) NOT NULL,

  -- Метаданные
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Уникальность: один матч может быть добавлен в купон только один раз
  UNIQUE(bet_slip_id, match_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_bet_slips_user_id ON public.bet_slips(user_id);
CREATE INDEX IF NOT EXISTS idx_bet_slips_status ON public.bet_slips(status);
CREATE INDEX IF NOT EXISTS idx_bet_slips_user_status ON public.bet_slips(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bet_slip_items_bet_slip_id ON public.bet_slip_items(bet_slip_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_bet_slip_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления updated_at
DROP TRIGGER IF EXISTS trigger_update_bet_slip_updated_at ON public.bet_slips;
CREATE TRIGGER trigger_update_bet_slip_updated_at
  BEFORE UPDATE ON public.bet_slips
  FOR EACH ROW
  EXECUTE FUNCTION update_bet_slip_updated_at();

-- RLS (Row Level Security) политики для bet_slips
ALTER TABLE public.bet_slips ENABLE ROW LEVEL SECURITY;

-- Пользователь может видеть только свои купоны
CREATE POLICY "Users can view own bet slips"
  ON public.bet_slips
  FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователь может создавать свои купоны
CREATE POLICY "Users can insert own bet slips"
  ON public.bet_slips
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Пользователь может обновлять свои купоны
CREATE POLICY "Users can update own bet slips"
  ON public.bet_slips
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Пользователь может удалять свои купоны
CREATE POLICY "Users can delete own bet slips"
  ON public.bet_slips
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS политики для bet_slip_items
ALTER TABLE public.bet_slip_items ENABLE ROW LEVEL SECURITY;

-- Пользователь может видеть элементы своих купонов
CREATE POLICY "Users can view own bet slip items"
  ON public.bet_slip_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bet_slips
      WHERE bet_slips.id = bet_slip_items.bet_slip_id
      AND bet_slips.user_id = auth.uid()
    )
  );

-- Пользователь может добавлять элементы в свои купоны
CREATE POLICY "Users can insert own bet slip items"
  ON public.bet_slip_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bet_slips
      WHERE bet_slips.id = bet_slip_items.bet_slip_id
      AND bet_slips.user_id = auth.uid()
    )
  );

-- Пользователь может удалять элементы из своих купонов
CREATE POLICY "Users can delete own bet slip items"
  ON public.bet_slip_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.bet_slips
      WHERE bet_slips.id = bet_slip_items.bet_slip_id
      AND bet_slips.user_id = auth.uid()
    )
  );

-- Комментарии для документации
COMMENT ON TABLE public.bet_slips IS 'Купоны ставок пользователей';
COMMENT ON TABLE public.bet_slip_items IS 'Элементы купонов (отдельные исходы)';
COMMENT ON COLUMN public.bet_slips.status IS 'Статус: active (активный), placed (размещен), won (выигран), lost (проигран), cancelled (отменен)';
COMMENT ON COLUMN public.bet_slips.bet_type IS 'Тип ставки: single (ординар), express (экспресс), system (система)';
COMMENT ON COLUMN public.bet_slip_items.bet_outcome IS 'Исход ставки: home (П1), draw (X), away (П2)';
COMMENT ON COLUMN public.bet_slip_items.match_data IS 'JSON с данными матча (команды, лига, время, логотипы)';
