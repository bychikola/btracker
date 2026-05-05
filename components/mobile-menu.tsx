'use client'

import { X, Home, Zap, Star, ShoppingCart, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { useFavorites } from '@/lib/contexts/favorites-context'

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
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card-bg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold text-accent">СТАВКИ</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-card-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-card-hover rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Спорт</span>
          </Link>

          <Link
            href="/live"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-card-hover rounded-lg transition-colors"
          >
            <Zap className="w-5 h-5" />
            <span className="font-medium">Live</span>
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse ml-auto"></span>
          </Link>

          {isAuthenticated && (
            <>
              <Link
                href="/favorites"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-card-hover rounded-lg transition-colors"
              >
                <Star className="w-5 h-5" />
                <span className="font-medium">Избранное</span>
                {favoritesCount > 0 && (
                  <span className="ml-auto bg-accent text-black text-xs font-bold rounded-full px-2 py-1 min-w-[24px] text-center">
                    {favoritesCount}
                  </span>
                )}
              </Link>

              <Link
                href="/bets"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-card-hover rounded-lg transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="font-medium">Мои ставки</span>
              </Link>

              <Link
                href="/stats"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-card-hover rounded-lg transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Статистика</span>
              </Link>
            </>
          )}
        </nav>

        {/* Auth buttons */}
        {!isAuthenticated && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card-bg">
            <div className="space-y-2">
              <button
                onClick={() => {
                  onClose()
                  onLoginClick()
                }}
                className="w-full px-4 py-3 text-sm border border-border hover:border-accent rounded-lg transition-colors font-medium"
              >
                Войти
              </button>
              <button
                onClick={() => {
                  onClose()
                  onRegisterClick()
                }}
                className="w-full px-4 py-3 text-sm bg-accent hover:bg-accent-hover text-black rounded-lg transition-colors font-medium"
              >
                Регистрация
              </button>
            </div>
          </div>
        )}

        {/* User info */}
        {isAuthenticated && user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card-bg">
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-card-hover rounded-lg transition-colors"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-sm font-bold text-black">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{user.username}</div>
                <div className="text-xs text-text-secondary truncate">{user.email}</div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
