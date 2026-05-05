-- Оптимизация производительности базы данных

-- Индексы для таблицы bet_slips
CREATE INDEX IF NOT EXISTS idx_bet_slips_user_status ON bet_slips(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bet_slips_user_created ON bet_slips(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bet_slips_user_placed ON bet_slips(user_id, placed_at DESC) WHERE placed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bet_slips_status_placed ON bet_slips(status, placed_at DESC) WHERE status = 'placed';

-- Индексы для таблицы bet_slip_items
CREATE INDEX IF NOT EXISTS idx_bet_slip_items_bet_slip ON bet_slip_items(bet_slip_id);
CREATE INDEX IF NOT EXISTS idx_bet_slip_items_match ON bet_slip_items(match_id);

-- Индексы для таблицы favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user_match ON favorites(user_id, match_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_created ON favorites(user_id, created_at DESC);

-- Составной индекс для быстрого поиска активного купона пользователя
CREATE INDEX IF NOT EXISTS idx_bet_slips_active_user ON bet_slips(user_id) WHERE status = 'active';

-- ANALYZE для обновления статистики планировщика запросов
ANALYZE bet_slips;
ANALYZE bet_slip_items;
ANALYZE favorites;
ANALYZE bet_slip_status_history;

-- Комментарии для документации
COMMENT ON INDEX idx_bet_slips_user_status IS 'Ускоряет фильтрацию ставок по пользователю и статусу';
COMMENT ON INDEX idx_bet_slips_user_created IS 'Ускоряет сортировку ставок по дате создания';
COMMENT ON INDEX idx_bet_slips_user_placed IS 'Ускоряет получение истории размещенных ставок';
COMMENT ON INDEX idx_bet_slips_active_user IS 'Ускоряет поиск активного купона пользователя';
