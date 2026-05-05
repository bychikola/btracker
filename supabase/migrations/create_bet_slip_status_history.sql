-- Таблица для хранения истории изменений статусов ставок
CREATE TABLE IF NOT EXISTS bet_slip_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_slip_id UUID NOT NULL REFERENCES bet_slips(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id),
  note TEXT,
  CONSTRAINT valid_status CHECK (
    new_status IN ('active', 'placed', 'won', 'lost', 'cancelled')
  )
);

-- Индекс для быстрого поиска истории по купону
CREATE INDEX idx_bet_slip_status_history_bet_slip_id ON bet_slip_status_history(bet_slip_id);

-- Индекс для сортировки по времени
CREATE INDEX idx_bet_slip_status_history_changed_at ON bet_slip_status_history(changed_at DESC);

-- RLS политики
ALTER TABLE bet_slip_status_history ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть историю только своих ставок
CREATE POLICY "Users can view their own bet slip history"
  ON bet_slip_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bet_slips
      WHERE bet_slips.id = bet_slip_status_history.bet_slip_id
      AND bet_slips.user_id = auth.uid()
    )
  );

-- Только система может создавать записи истории (через триггер)
CREATE POLICY "System can insert status history"
  ON bet_slip_status_history
  FOR INSERT
  WITH CHECK (true);

-- Триггер для автоматического логирования изменений статуса
CREATE OR REPLACE FUNCTION log_bet_slip_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Логируем только если статус действительно изменился
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO bet_slip_status_history (
      bet_slip_id,
      old_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Привязываем триггер к таблице bet_slips
DROP TRIGGER IF EXISTS bet_slip_status_change_trigger ON bet_slips;
CREATE TRIGGER bet_slip_status_change_trigger
  AFTER UPDATE ON bet_slips
  FOR EACH ROW
  EXECUTE FUNCTION log_bet_slip_status_change();
