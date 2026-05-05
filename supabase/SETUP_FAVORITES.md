# Инструкция по созданию таблицы favorites в Supabase

## Шаг 1: Откройте Supabase Dashboard

1. Перейдите на https://supabase.com/dashboard
2. Выберите ваш проект bTracker
3. В левом меню выберите **SQL Editor**

## Шаг 2: Выполните SQL-скрипт

1. Нажмите **New Query**
2. Скопируйте содержимое файла `supabase/migrations/create_favorites_table.sql`
3. Вставьте в редактор
4. Нажмите **Run** (или Ctrl+Enter)

## Шаг 3: Проверка

После выполнения скрипта проверьте:

1. В меню **Table Editor** должна появиться таблица `favorites`
2. Структура таблицы:
   - `id` (uuid, primary key)
   - `user_id` (uuid, foreign key → auth.users)
   - `favorite_type` (text) — 'match', 'team', 'league'
   - `item_id` (text) — ID элемента
   - `item_data` (jsonb) — данные для отображения
   - `created_at` (timestamp)

3. В разделе **Authentication → Policies** должны быть 3 политики для таблицы `favorites`

## Что делает эта таблица?

- Хранит избранные матчи, команды и лиги для каждого пользователя
- `item_data` содержит JSON с информацией для отображения (названия команд, логотипы, время матча и т.д.)
- RLS политики гарантируют, что пользователь видит только свое избранное
- Уникальный индекс предотвращает дублирование

## Пример данных в item_data

**Для матча:**
```json
{
  "sport_type": "football",
  "league_name": "Premier League",
  "team1": {"name": "Arsenal", "logo": "..."},
  "team2": {"name": "Chelsea", "logo": "..."},
  "start_time": "2026-05-04T19:00:00Z"
}
```

**Для команды:**
```json
{
  "name": "Arsenal",
  "logo": "...",
  "sport_type": "football"
}
```

**Для лиги:**
```json
{
  "name": "Premier League",
  "sport_type": "football",
  "country": "England"
}
```

---

**После выполнения скрипта дай мне знать, и я продолжу со следующим шагом!**
