'use client'

import { useState } from 'react'
import { X, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { cn } from '@/lib/utils'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToRegister: () => void
}

export function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      onClose()
      setEmail('')
      setPassword('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка входа. Проверьте данные.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Заголовок */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Вход</h2>
          <p className="text-sm text-gray-600">Войдите в свой аккаунт</p>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Пароль */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Ошибка */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-800">
              {error}
            </div>
          )}

          {/* Забыли пароль */}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Забыли пароль?
            </button>
          </div>

          {/* Кнопка входа */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'w-full py-2.5 px-4 bg-red-600 text-white text-sm rounded-lg font-medium transition-colors',
              'hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Вход...
              </span>
            ) : (
              'Войти'
            )}
          </button>
        </form>

        {/* Разделитель */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-500">или</span>
          </div>
        </div>

        {/* Регистрация */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Нет аккаунта?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Зарегистрироваться
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
