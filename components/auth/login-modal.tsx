'use client'

import { useState } from 'react'
import { X, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[var(--canvas)] rounded-[var(--radius-xl)] shadow-lg p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--mute)] hover:text-[var(--ink)] transition-colors p-1 rounded-[var(--radius-full)]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-[32px] font-[800] text-[var(--ink)] tracking-tight mb-1">Вход</h2>
          <p className="text-sm text-[var(--body)]">Войдите в свой аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />

          <div className="relative">
            <Input
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          {error && (
            <div className="bg-[var(--negative-bg)] border border-[var(--negative)]/20 rounded-[var(--radius-md)] p-3 text-sm text-[var(--negative)]">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button type="button" className="text-sm text-[var(--body)] hover:text-[var(--ink)] font-medium transition-colors">
              Забыли пароль?
            </button>
          </div>

          <Button type="submit" variant="primary" isLoading={isLoading} className="w-full">
            {isLoading ? 'Вход...' : 'Войти'}
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
            Нет аккаунта?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold transition-colors"
            >
              Зарегистрироваться
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
