import { useEffect, useState } from 'react'

/**
 * Хук для дебаунса значения
 * @param value - значение для дебаунса
 * @param delay - задержка в миллисекундах (по умолчанию 500мс)
 * @returns дебаунснутое значение
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Устанавливаем таймер для обновления дебаунснутого значения
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Очищаем таймер при изменении value или delay
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
