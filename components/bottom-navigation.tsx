'use client'

import { Home, Zap, Star, ShoppingCart, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { useFavorites } from '@/lib/contexts/favorites-context'
import { useBetSlip } from '@/lib/contexts/bet-slip-context'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function BottomNavigation() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const { favoritesCount } = useFavorites()
  const { itemsCount } = useBetSlip()

  const navItems = [
    { href: '/main', icon: Home, label: 'Спорт', show: true },
    { href: '/live', icon: Zap, label: 'Live', show: true, badge: true },
    { href: '/favorites', icon: Star, label: 'Избранное', show: isAuthenticated, count: favoritesCount },
    { href: '/bets', icon: ShoppingCart, label: 'Ставки', show: isAuthenticated, count: itemsCount },
    { href: '/stats', icon: BarChart3, label: 'Статистика', show: isAuthenticated },
  ]

  const visibleItems = navItems.filter(item => item.show)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--canvas)] border-t border-[var(--border)] safe-area-bottom">
      <div className="flex items-center justify-around h-[64px] px-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-[var(--radius-xl)] transition-all touch-manipulation min-w-[56px]',
                'active:scale-95',
                isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--mute)] hover:text-[var(--ink)]'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-[var(--primary)] rounded-[var(--radius-pill)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse" />
                )}
                {item.count !== undefined && item.count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold rounded-[var(--radius-full)] w-4 h-4 flex items-center justify-center"
                  >
                    {item.count > 9 ? '9+' : item.count}
                  </motion.span>
                )}
              </div>

              <span className={cn('text-[10px] font-semibold', isActive ? 'opacity-100' : 'opacity-60')}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
