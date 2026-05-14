'use client'

import { useState } from 'react'
import { X, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToLogin: () => void
}

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return
    }

    setIsLoading(true)

    try {
      await register(
        formData.email,
        formData.username,
        formData.password,
        formData.firstName,
        formData.lastName
      )
      onClose()
      setFormData({ email: '', username: '', password: '', confirmPassword: '', firstName: '', lastName: '' })
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.message || 'Ошибка регистрации. Попробуйте снова.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/40 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[var(--canvas)] rounded-[var(--radius-xl)] shadow-lg p-8 my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--mute)] hover:text-[var(--ink)] transition-colors p-1 rounded-[var(--radius-full)]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-[32px] font-[800] text-[var(--ink)] tracking-tight mb-1">Регистрация</h2>
          <p className="text-sm text-[var(--body)]">Создайте новый аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="your@email.com"
          />

          <Input
            label="Имя пользователя"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="username"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Имя"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Иван"
            />
            <Input
              label="Фамилия"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Иванов"
            />
          </div>

          <div className="relative">
            <Input
              label="Пароль"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 bottom-[14px] text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Подтвердите пароль"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 bottom-[14px] text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="bg-[var(--negative-bg)] border border-[var(--negative)]/20 rounded-[var(--radius-md)] p-3 text-sm text-[var(--negative)]">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" isLoading={isLoading} className="w-full mt-2">
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-[var(--canvas)] text-[var(--mute)]">или</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-[var(--body)]">
            Уже есть аккаунт?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold transition-colors"
            >
              Войти
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
