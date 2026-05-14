# 🧪 Тестирование проекта bTracker

## Установка

Тестовое окружение уже настроено. Используются:
- **Jest** - фреймворк для тестирования
- **React Testing Library** - для тестирования React компонентов
- **@testing-library/jest-dom** - дополнительные матчеры для DOM

## Запуск тестов

```bash
# Запустить все тесты
npm test

# Запустить тесты в watch режиме (автоматический перезапуск при изменениях)
npm run test:watch

# Запустить тесты с coverage отчетом
npm run test:coverage
```

## Структура тестов

```
lib/
├── api/
│   ├── __tests__/
│   │   ├── extractOdds.test.ts      # Тесты извлечения коэффициентов
│   │   └── rateLimiter.test.ts      # Тесты rate limiting
│   └── sstats.ts
├── contexts/
│   ├── __tests__/
│   │   └── bet-slip-context.test.tsx # Тесты логики ставок
│   └── bet-slip-context.tsx
```

## Покрытие тестами

### ✅ Покрыто тестами

1. **extractOdds** - Извлечение коэффициентов из API
   - Обработка пустых данных
   - Извлечение из основного рынка 1X2
   - Fallback на первый доступный рынок
   - Обработка некорректных данных
   - Регистронезависимость

2. **RateLimiter** - Ограничение частоты запросов
   - Базовая функциональность
   - Минимальная задержка между запросами (500мс)
   - Ограничение до 10 запросов за 5 секунд
   - Управление очередью запросов
   - Параллельные вызовы
   - Сброс счетчика окна

3. **BetSlip Context** - Логика купона ставок
   - Добавление ставок в пустой/существующий купон
   - Удаление ставок
   - Обновление суммы ставки
   - Размещение купона
   - Очистка купона
   - Изменение типа ставки (single/express/system)
   - Расчет коэффициентов
   - Проверка наличия ставки в купоне

### ⏳ Требуется покрытие

- Компоненты UI (match-card, bet-slip-modal и т.д.)
- Хуки (useSstatsMatches, useStatistics)
- API функции (fetchMatches, fetchLiveOdds)
- Контексты (auth, favorites, theme)

## Минимальные требования к покрытию

Настроено в `jest.config.js`:
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

## Примеры тестов

### Unit тест функции

```typescript
import { describe, it, expect } from '@jest/globals'

describe('calculateOdds', () => {
  it('должен правильно рассчитывать коэффициенты для экспресса', () => {
    const odds1 = 2.5
    const odds2 = 3.2
    const totalOdds = odds1 * odds2
    
    expect(totalOdds).toBeCloseTo(8.0, 1)
  })
})
```

### Integration тест с моками

```typescript
import { jest } from '@jest/globals'

const mockApiCall = jest.fn()
jest.mock('@/lib/api/sstats', () => ({
  fetchMatches: () => mockApiCall(),
}))

describe('API Integration', () => {
  it('должен загружать матчи', async () => {
    mockApiCall.mockResolvedValue({ matches: [], total: 0 })
    
    const result = await mockApiCall()
    
    expect(mockApiCall).toHaveBeenCalled()
    expect(result.matches).toEqual([])
  })
})
```

## Отладка тестов

### Запуск конкретного теста

```bash
# Запустить только тесты extractOdds
npm test -- extractOdds

# Запустить только тесты в конкретном файле
npm test -- rateLimiter.test.ts
```

### Отладка в VS Code

Добавьте в `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Debug",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

## CI/CD Integration

### GitHub Actions

Создайте `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Best Practices

1. **Именование тестов**: Используйте описательные названия
   - ✅ `должен добавлять ставку в пустой купон`
   - ❌ `test1`

2. **Arrange-Act-Assert**: Структурируйте тесты
   ```typescript
   it('должен...', () => {
     // Arrange - подготовка
     const input = { ... }
     
     // Act - действие
     const result = someFunction(input)
     
     // Assert - проверка
     expect(result).toBe(expected)
   })
   ```

3. **Изолированность**: Каждый тест должен быть независимым
   - Используйте `beforeEach` для сброса состояния
   - Не полагайтесь на порядок выполнения тестов

4. **Моки**: Мокайте внешние зависимости
   - API вызовы
   - Таймеры (`jest.useFakeTimers()`)
   - Случайные значения

5. **Покрытие**: Стремитесь к 80%+ покрытию критичной логики
   - Логика ставок
   - Расчет коэффициентов
   - Обработка ошибок
   - Rate limiting

## Troubleshooting

### Тесты падают с timeout

```typescript
// Увеличьте timeout для медленных тестов
it('медленный тест', async () => {
  // ...
}, 10000) // 10 секунд
```

### Проблемы с async/await

```typescript
// Используйте waitFor для асинхронных операций
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(element).toBeInTheDocument()
})
```

### Моки не работают

```typescript
// Убедитесь что моки объявлены ДО импорта модуля
jest.mock('@/lib/api/sstats')
import { fetchMatches } from '@/lib/api/sstats'
```

## Дополнительные ресурсы

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Последнее обновление**: 2026-05-06
