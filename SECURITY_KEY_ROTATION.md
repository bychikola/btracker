# 🔐 Инструкция по ротации Supabase ключей

## ⚠️ КРИТИЧНО: Ваши текущие ключи скомпрометированы

Файл `.env.local` с реальными Supabase credentials был закоммичен в репозиторий. Это означает, что ключи могут быть доступны любому, кто имеет доступ к истории Git.

## Шаги для безопасной ротации ключей

### 1. Создайте новый Supabase проект (Рекомендуется)

**Самый безопасный вариант** - создать новый проект:

1. Перейдите на https://app.supabase.com
2. Создайте новый проект
3. Скопируйте новые credentials из Settings → API
4. Обновите `.env.local` с новыми ключами
5. Мигрируйте данные из старого проекта (если необходимо)
6. Удалите старый проект

### 2. Ротация ключей в существующем проекте (Альтернатива)

Если создание нового проекта невозможно:

1. **Войдите в Supabase Dashboard**
   - Перейдите на https://app.supabase.com
   - Откройте ваш проект: `thnybsplmhxcsrdyuxqr`

2. **Сгенерируйте новые API ключи**
   - Перейдите в Settings → API
   - Нажмите "Generate new anon key"
   - Сохраните новый ключ в безопасном месте

3. **Обновите переменные окружения**
   ```bash
   # В файле .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://thnybsplmhxcsrdyuxqr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<новый_ключ>
   ```

4. **Обновите production окружение**
   - Если приложение задеплоено (Vercel, Netlify и т.д.)
   - Обновите environment variables в панели управления хостинга
   - Пересоберите и задеплойте приложение

5. **Отзовите старые ключи**
   - В Supabase Dashboard → Settings → API
   - Отзовите старый anon key
   - Это сделает старый ключ недействительным

### 3. Очистка Git истории (Опционально, но рекомендуется)

⚠️ **ВНИМАНИЕ**: Это переписывает историю Git. Координируйте с командой!

```bash
# Удалите .env.local из всей истории Git
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch btracker/.env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Принудительно запушьте изменения
git push origin --force --all
git push origin --force --tags

# Очистите локальный кэш
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

**Альтернатива (проще)**: Используйте BFG Repo-Cleaner:
```bash
# Установите BFG
# https://rtyley.github.io/bfg-repo-cleaner/

# Удалите файл из истории
bfg --delete-files .env.local

# Очистите и запушьте
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push origin --force --all
```

### 4. Настройте защиту от будущих утечек

1. **Проверьте .gitignore**
   ```bash
   # Убедитесь что .env* в .gitignore
   cat btracker/.gitignore | grep "\.env"
   ```
   ✅ Уже настроено в вашем проекте

2. **Используйте pre-commit hook**
   
   Создайте `.git/hooks/pre-commit`:
   ```bash
   #!/bin/bash
   
   # Проверка на наличие .env файлов
   if git diff --cached --name-only | grep -E "\.env\.local$"; then
     echo "❌ Попытка закоммитить .env.local файл!"
     echo "Удалите файл из staging area: git reset HEAD .env.local"
     exit 1
   fi
   
   # Проверка на наличие секретов
   if git diff --cached | grep -E "(SUPABASE_ANON_KEY|SUPABASE_URL)"; then
     echo "⚠️  Обнаружены потенциальные секреты в коммите!"
     echo "Проверьте изменения перед коммитом"
     exit 1
   fi
   
   exit 0
   ```
   
   Сделайте его исполняемым:
   ```bash
   chmod +x .git/hooks/pre-commit
   ```

3. **Используйте git-secrets** (Рекомендуется)
   ```bash
   # Установите git-secrets
   # macOS: brew install git-secrets
   # Linux: https://github.com/awslabs/git-secrets
   
   # Настройте для репозитория
   cd /path/to/bTracker
   git secrets --install
   git secrets --register-aws
   
   # Добавьте паттерны для Supabase
   git secrets --add 'SUPABASE_ANON_KEY.*'
   git secrets --add 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*'
   ```

### 5. Мониторинг безопасности

1. **Включите Supabase Auth Logs**
   - Settings → Auth → Logs
   - Мониторьте подозрительную активность

2. **Настройте Rate Limiting**
   - Settings → API → Rate Limiting
   - Ограничьте количество запросов с одного IP

3. **Включите Row Level Security (RLS)**
   - Убедитесь что все таблицы защищены RLS политиками
   - Проверьте: Database → Tables → каждая таблица должна иметь "RLS enabled"

## Проверка после ротации

```bash
# 1. Проверьте что старый ключ не работает
curl https://thnybsplmhxcsrdyuxqr.supabase.co/rest/v1/profiles \
  -H "apikey: <старый_ключ>" \
  -H "Authorization: Bearer <старый_ключ>"
# Должна вернуться ошибка 401

# 2. Проверьте что новый ключ работает
curl https://thnybsplmhxcsrdyuxqr.supabase.co/rest/v1/profiles \
  -H "apikey: <новый_ключ>" \
  -H "Authorization: Bearer <новый_ключ>"
# Должен вернуться успешный ответ

# 3. Запустите приложение локально
cd btracker
npm run dev
# Проверьте что авторизация работает
```

## Чеклист

- [ ] Создан новый Supabase проект ИЛИ сгенерированы новые ключи
- [ ] Обновлен `.env.local` с новыми credentials
- [ ] Обновлены environment variables в production
- [ ] Отозваны старые ключи в Supabase Dashboard
- [ ] Удален `.env.local` из Git истории (опционально)
- [ ] Настроен pre-commit hook для защиты от будущих утечек
- [ ] Проверена работоспособность приложения с новыми ключами
- [ ] Включен мониторинг и rate limiting в Supabase

## Дополнительные ресурсы

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [API Rate Limiting](https://supabase.com/docs/guides/platform/rate-limits)

---

**Дата создания**: 2026-05-06  
**Приоритет**: 🔴 КРИТИЧЕСКИЙ  
**Статус**: Требует немедленного действия
