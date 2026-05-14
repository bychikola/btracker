'use client'

import { Search, Settings, Globe, User, LogOut, UserCircle, X, Sun, Moon, Languages, Star, ShoppingCart, Menu, BarChart3, Zap } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { useTheme } from '@/lib/contexts/theme-context'
import { useTranslation } from '@/lib/contexts/translation-context'
import { useFavorites } from '@/lib/contexts/favorites-context'
import { useBetSlip } from '@/lib/contexts/bet-slip-context'
import { LoginModal } from './auth/login-modal'
import { RegisterModal } from './auth/register-modal'
import { SearchModal } from './search-modal'
import { BetSlipModal } from './bet-slip-modal'
import { MobileMenu } from './mobile-menu'
import { PendingBetsBadge } from './pending-bets-badge'
import { Button } from './ui/button'

export function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { translateEnabled, toggleTranslation } = useTranslation()
  const { favoritesCount } = useFavorites()
  const { itemsCount } = useBetSlip()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showBetSlipModal, setShowBetSlipModal] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const handleSwitchToRegister = () => {
    setShowLoginModal(false)
    setShowRegisterModal(true)
  }

  const handleSwitchToLogin = () => {
    setShowRegisterModal(false)
    setShowLoginModal(true)
  }

  const handleLogout = async () => {
    await logout()
    setShowUserMenu(false)
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-[var(--canvas)] border-b border-[var(--border)] safe-area-top">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-[72px]">
            {/* Left — Brand & Nav */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowMobileMenu(true)}
                className="md:hidden p-2 hover:bg-[var(--canvas-soft)] rounded-[var(--radius-md)] transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-[900] text-[var(--primary)] tracking-tight">
                  bTracker
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/"
                  className="px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--canvas-soft)] rounded-[var(--radius-xl)] transition-colors"
                >
                  Спорт
                </Link>
                <Link
                  href="/live"
                  className="px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--canvas-soft)] rounded-[var(--radius-xl)] transition-colors flex items-center gap-2"
                >
                  <Zap className="w-4 h-4 text-[var(--primary)]" />
                  Live
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      href="/favorites"
                      className="px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--canvas-soft)] rounded-[var(--radius-xl)] transition-colors flex items-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Избранное
                      {favoritesCount > 0 && (
                        <span className="bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold rounded-[var(--radius-pill)] px-1.5 py-0.5 min-w-[20px] text-center">
                          {favoritesCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/bets"
                      className="px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--canvas-soft)] rounded-[var(--radius-xl)] transition-colors flex items-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Ставки
                      <PendingBetsBadge />
                    </Link>
                    <Link
                      href="/stats"
                      className="px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--canvas-soft)] rounded-[var(--radius-xl)] transition-colors flex items-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Статистика
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* Right — Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSearchModal(true)}
                className="p-2 hover:bg-[var(--canvas-soft)] rounded-[var(--radius-full)] transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {isAuthenticated && (
                <>
                  <Link
                    href="/favorites"
                    className="p-2 hover:bg-[var(--canvas-soft)] rounded-[var(--radius-full)] transition-colors relative"
                    title="Избранное"
                  >
                    <Star className="w-5 h-5" />
                    {favoritesCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold rounded-[var(--radius-full)] w-[18px] h-[18px] flex items-center justify-center">
                        {favoritesCount > 9 ? '9+' : favoritesCount}
                      </span>
                    )}
                  </Link>

                  <button
                    onClick={() => setShowBetSlipModal(true)}
                    className="xl:hidden p-2 hover:bg-[var(--canvas-soft)] rounded-[var(--radius-full)] transition-colors relative"
                    title="Купон"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {itemsCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold rounded-[var(--radius-full)] w-[18px] h-[18px] flex items-center justify-center">
                        {itemsCount > 9 ? '9+' : itemsCount}
                      </span>
                    )}
                  </button>
                </>
              )}

              {/* Settings */}
              <div className="relative">
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="p-2 hover:bg-[var(--canvas-soft)] rounded-[var(--radius-full)] transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>

                {showSettingsMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-[var(--canvas)] rounded-[var(--radius-xl)] shadow-lg py-2 border border-[var(--border)]">
                    <div className="px-5 py-3 border-b border-[var(--border)]">
                      <p className="text-sm font-semibold text-[var(--ink)]">Настройки</p>
                    </div>
                    <button
                      onClick={() => { toggleTheme(); setShowSettingsMenu(false) }}
                      className="flex items-center justify-between w-full px-5 py-3 text-sm text-[var(--ink)] hover:bg-[var(--canvas-soft)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        <span>Тема</span>
                      </div>
                      <span className="text-xs text-[var(--mute)]">{theme === 'dark' ? 'Темная' : 'Светлая'}</span>
                    </button>
                    <button
                      onClick={() => { toggleTranslation(); setShowSettingsMenu(false) }}
                      className="flex items-center justify-between w-full px-5 py-3 text-sm text-[var(--ink)] hover:bg-[var(--canvas-soft)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Languages className="w-4 h-4" />
                        <span>Перевод</span>
                      </div>
                      <span className="text-xs text-[var(--mute)]">{translateEnabled ? 'Вкл' : 'Выкл'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Auth */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--canvas-soft)] rounded-[var(--radius-xl)] transition-colors"
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-[var(--radius-full)]" />
                    ) : (
                      <div className="w-8 h-8 rounded-[var(--radius-full)] bg-[var(--primary)] flex items-center justify-center">
                        <span className="text-sm font-bold text-[var(--primary-foreground)]">
                          {user?.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="hidden md:block text-sm font-semibold">{user?.username}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-[var(--canvas)] rounded-[var(--radius-xl)] shadow-lg py-2 border border-[var(--border)]">
                      <div className="px-5 py-3 border-b border-[var(--border)]">
                        <p className="text-sm font-semibold text-[var(--ink)]">{user?.username}</p>
                        <p className="text-xs text-[var(--mute)]">{user?.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-5 py-3 text-sm text-[var(--ink)] hover:bg-[var(--canvas-soft)] transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserCircle className="w-4 h-4" />
                        Профиль
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-5 py-3 text-sm text-[var(--negative)] hover:bg-[var(--canvas-soft)] transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Выйти
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLoginModal(true)}
                    className="hidden md:inline-flex"
                  >
                    Войти
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowRegisterModal(true)}
                    className="hidden md:inline-flex"
                  >
                    Регистрация
                  </Button>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="md:hidden p-2 hover:bg-[var(--canvas-soft)] rounded-[var(--radius-full)] transition-colors"
                  >
                    <User className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
      <BetSlipModal
        isOpen={showBetSlipModal}
        onClose={() => setShowBetSlipModal(false)}
      />
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        onLoginClick={() => setShowLoginModal(true)}
        onRegisterClick={() => setShowRegisterModal(true)}
      />
    </>
  )
}
