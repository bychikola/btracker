'use client'

import { X, Home, Zap, Star, ShoppingCart, BarChart3, User } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { useFavorites } from '@/lib/contexts/favorites-context'
import { Button } from './ui/button'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  onLoginClick: () => void
  onRegisterClick: () => void
}

export function MobileMenu({ isOpen, onClose, onLoginClick, onRegisterClick }: MobileMenuProps) {
  const { isAuthenticated, user } = useAuth()
  const { favoritesCount } = useFavorites()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[var(--canvas)] shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <span className="text-2xl font-[900] text-[var(--primary)] tracking-tight">bTracker</span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--canvas-soft)] rounded-[var(--radius-full)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 text-[var(--ink)] hover:bg-[var(--canvas-soft)] rounded-[var(--radius-xl)] transition-colors font-semibold"
          >
            <Home className="w-5 h-5" />
            <span>Спорт</span>
          </Link>

          <Link
            href="/live"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 text-[var(--ink)] hover:bg-[var(--canvas-soft)] rounded-[var(--radius-xl)] transition-colors font-semibold"
          >
            <Zap className="w-5 h-5 text-[var(--primary)]" />
            <span>Live</span>
            <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse ml-auto" />
          </Link>

          {isAuthenticated && (
            <>
              <Link
                href="/favorites"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-[var(--ink)] hover:bg-[var(--canvas-soft)] rounded-[var(--radius-xl)] transition-colors font-semibold"
              >
                <Star className="w-5 h-5" />
                <span>Избранное</span>
                {favoritesCount > 0 && (
                  <span className="ml-auto bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold rounded-[var(--radius-pill)] px-2 py-0.5 min-w-[24px] text-center">
                    {favoritesCount}
                  </span>
                )}
              </Link>
              <Link
                href="/bets"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-[var(--ink)] hover:bg-[var(--canvas-soft)] rounded-[var(--radius-xl)] transition-colors font-semibold"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Мои ставки</span>
              </Link>
              <Link
                href="/stats"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-[var(--ink)] hover:bg-[var(--canvas-soft)] rounded-[var(--radius-xl)] transition-colors font-semibold"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Статистика</span>
              </Link>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)]">
          {!isAuthenticated ? (
            <div className="space-y-2">
              <Button variant="outline" onClick={() => { onClose(); onLoginClick() }} className="w-full">
                Войти
              </Button>
              <Button variant="primary" onClick={() => { onClose(); onRegisterClick() }} className="w-full">
                Регистрация
              </Button>
            </div>
          ) : user && (
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-3 px-2 py-2 hover:bg-[var(--canvas-soft)] rounded-[var(--radius-xl)] transition-colors"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-[var(--radius-full)]" />
              ) : (
                <div className="w-10 h-10 rounded-[var(--radius-full)] bg-[var(--primary)] flex items-center justify-center">
                  <span className="text-sm font-bold text-[var(--primary-foreground)]">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[var(--ink)] truncate">{user.username}</div>
                <div className="text-xs text-[var(--mute)] truncate">{user.email}</div>
              </div>
              <User className="w-4 h-4 text-[var(--mute)]" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
