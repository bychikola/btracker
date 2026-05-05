'use client'

import { Search, Settings, Globe, User, LogOut, UserCircle, X, Sun, Moon, Languages, Star, ShoppingCart, Menu, BarChart3 } from 'lucide-react'
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
      <header className="sticky top-0 z-50 bg-card-bg text-foreground shadow-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Левая часть - Логотип и меню */}
            <div className="flex items-center gap-4">
              {/* Burger menu button (mobile only) */}
              <button
                onClick={() => setShowMobileMenu(true)}
                className="md:hidden p-2 hover:bg-card-hover rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link href="/" className="text-xl md:text-2xl font-bold text-accent">
                СТАВКИ
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-sm hover:text-accent transition-colors">
                  Спорт
                </Link>
                <Link href="/live" className="text-sm hover:text-accent transition-colors flex items-center gap-1">
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                  Live
                </Link>
                {isAuthenticated && (
                  <>
                    <Link href="/favorites" className="text-sm hover:text-accent transition-colors flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Избранное
                      {favoritesCount > 0 && (
                        <span className="ml-1 bg-accent text-black text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                          {favoritesCount}
                        </span>
                      )}
                    </Link>
                    <Link href="/bets" className="text-sm hover:text-accent transition-colors flex items-center gap-1">
                      <ShoppingCart className="w-4 h-4" />
                      Мои ставки
                      <div className="relative">
                        <PendingBetsBadge />
                      </div>
                    </Link>
                    <Link href="/stats" className="text-sm hover:text-accent transition-colors flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      Статистика
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* Правая часть - Действия */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSearchModal(true)}
                className="p-2 hover:bg-card-hover rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Избранное */}
              {isAuthenticated && (
                <Link
                  href="/favorites"
                  className="relative p-2 hover:bg-card-hover rounded-lg transition-colors"
                  title="Избранное"
                >
                  <Star className="w-5 h-5" />
                  {favoritesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {favoritesCount > 9 ? '9+' : favoritesCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Купон (только на мобильных) */}
              {isAuthenticated && (
                <button
                  onClick={() => setShowBetSlipModal(true)}
                  className="xl:hidden relative p-2 hover:bg-card-hover rounded-lg transition-colors"
                  title="Купон"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {itemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {itemsCount > 9 ? '9+' : itemsCount}
                    </span>
                  )}
                </button>
              )}

              <button className="p-2 hover:bg-card-hover rounded-lg transition-colors">
                <Globe className="w-5 h-5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="p-2 hover:bg-card-hover rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>

                {/* Меню настроек */}
                {showSettingsMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-card-bg rounded-lg shadow-xl py-2 border border-border">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium text-foreground">Настройки</p>
                    </div>
                    <button
                      onClick={() => {
                        toggleTheme()
                        setShowSettingsMenu(false)
                      }}
                      className="flex items-center justify-between w-full px-4 py-2 text-sm text-foreground hover:bg-card-hover transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {theme === 'dark' ? (
                          <Moon className="w-4 h-4" />
                        ) : (
                          <Sun className="w-4 h-4" />
                        )}
                        <span>Тема</span>
                      </div>
                      <span className="text-xs text-text-secondary">
                        {theme === 'dark' ? 'Темная' : 'Светлая'}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        toggleTranslation()
                        setShowSettingsMenu(false)
                      }}
                      className="flex items-center justify-between w-full px-4 py-2 text-sm text-foreground hover:bg-card-hover transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Languages className="w-4 h-4" />
                        <span>Перевод команд</span>
                      </div>
                      <span className="text-xs text-text-secondary">
                        {translateEnabled ? 'Вкл' : 'Выкл'}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Авторизация */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-card-hover rounded-lg transition-colors"
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-sm font-bold text-black">
                          {user?.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="hidden md:block text-sm font-medium">{user?.username}</span>
                  </button>

                  {/* Выпадающее меню */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-card-bg rounded-lg shadow-xl py-2 border border-border">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium text-foreground">{user?.username}</p>
                        <p className="text-xs text-text-secondary">{user?.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-card-hover transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserCircle className="w-4 h-4" />
                        Профиль
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-accent hover:bg-card-hover transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Выйти
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2 ml-2">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-4 py-2 text-sm border border-border hover:border-accent rounded-lg transition-colors"
                  >
                    Войти
                  </button>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="px-4 py-2 text-sm bg-accent hover:bg-accent-hover text-black rounded-lg transition-colors font-medium"
                  >
                    Регистрация
                  </button>
                </div>
              )}

              {!isAuthenticated && (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="md:hidden p-2 hover:bg-card-hover rounded-lg transition-colors"
                >
                  <User className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Модальные окна */}
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
