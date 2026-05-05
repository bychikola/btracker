# Инструкция по созданию таблиц для системы купонов

## Шаг 1: Откройте Supabase Dashboard

1. Перейдите на https://supabase.com/dashboard
2. Выберите ваш проект bTracker
3. В левом меню выберите **SQL Editor**

## Шаг 2: Выполните SQL-скрипт

1. Нажмите **New Query**
2. Скопируйте содержимое файла `supabase/migrations/create_bet_slips_tables.sql`
3. Вставьте в редактор
4. Нажмите **Run** (или Ctrl+Enter)

## Шаг 3: Проверка

После выполнения скрипта проверьте:

### В Table Editor должны появиться 2 таблицы:

**1. `bet_slips` (купоны)**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `status` (text) — 'active', 'placed', 'won', 'lost', 'cancelled'
- `bet_type` (text) — 'single', 'express', 'system'
- `total_odds` (numeric)
- `stake_amount` (numeric)
- `potential_win` (numeric)
- `created_at`, `updated_at`, `placed_at` (timestamps)

**2. `bet_slip_items` (элементы купона)**
- `id` (uuid, primary key)
- `bet_slip_id` (uuid, foreign key → bet_slips)
- `match_id` (text)
- `match_data` (jsonb)
- `bet_outcome` (text) — 'home', 'draw', 'away'
- `odds` (numeric)
- `created_at` (timestamp)

### В Authentication → Policies должны быть политики:
- 4 политики для `bet_slips`
- 3 политики для `bet_slip_items`

## Что делают эти таблицы?

**bet_slips** — хранит купоны пользователей:
- Один пользователь может иметь только один активный купон
- Купон может быть ординаром (single) или экспрессом (express)
- Автоматически рассчитывается общий коэффициент и потенциальный выигрыш

**bet_slip_items** — хранит отдельные исходы в купоне:
- Каждый элемент связан с купоном
- Один матч может быть добавлен в купон только один раз
- `match_data` содержит JSON с информацией о матче для отображения

## Пример данных в match_data:

```json
{
  "match_id": "1234567",
  "sport_type": "football",
  "league_name": "Premier League",
  "team1": {
    "name": "Arsenal",
    "logo": "..."
  },
  "team2": {
    "name": "Chelsea",
    "logo": "..."
  },
  "start_time": "2026-05-04T19:00:00Z",
  "is_live": false
}
```

## Ограничения:

- Пользователь может иметь только один активный купон
- В купон нельзя добавить один и тот же матч дважды
- RLS политики гарантируют, что пользователь видит только свои купоны

---

**После выполнения скрипта дай мне знать, и я продолжу со следующим шагом!**
