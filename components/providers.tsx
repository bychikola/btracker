'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { Toaster } from 'react-hot-toast'
//import { AuthProvider } from '@/lib/contexts/auth-context'
import { AuthProvider } from '@/lib/contexts/auth-context-supabase'
import { ThemeProvider } from '@/lib/contexts/theme-context'
import { TranslationProvider } from '@/lib/contexts/translation-context'
import { FavoritesProvider } from '@/lib/contexts/favorites-context'
import { BetSlipProvider } from '@/lib/contexts/bet-slip-context'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Данные считаются свежими 5 минут
            staleTime: 5 * 60 * 1000,
            // Кэш хранится 10 минут
            gcTime: 10 * 60 * 1000,
            // Не рефетчить при фокусе окна
            refetchOnWindowFocus: false,
            // Повторять запрос при ошибке 1 раз
            retry: 1,
            // Задержка между повторами 1 секунда
            retryDelay: 1000,
            // Дедупликация одинаковых запросов
            refetchOnMount: false,
            // Использовать stale-while-revalidate стратегию
            refetchOnReconnect: 'always',
          },
          mutations: {
            // Повторять мутации при ошибке
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TranslationProvider>
          <AuthProvider>
            <FavoritesProvider>
              <BetSlipProvider>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: 'var(--card-bg)',
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                    },
                    success: {
                      iconTheme: {
                        primary: 'var(--accent)',
                        secondary: 'var(--card-bg)',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: 'var(--card-bg)',
                      },
                    },
                  }}
                />
                {children}
              </BetSlipProvider>
            </FavoritesProvider>
          </AuthProvider>
        </TranslationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
