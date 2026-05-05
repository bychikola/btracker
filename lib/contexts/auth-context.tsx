'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/lib/types/auth'
import { authApi } from '@/lib/api/auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string, firstName?: string, lastName?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Проверяем токен при загрузке
    const token = localStorage.getItem('auth_token')
    if (token) {
      loadUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const loadUser = async () => {
    try {
      const userData = await authApi.getCurrentUser()
      setUser(userData)
    } catch (error) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    localStorage.setItem('auth_token', response.token)
    localStorage.setItem('refresh_token', response.refreshToken)
    setUser(response.user)
  }

  const register = async (
    email: string,
    username: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    const response = await authApi.register({
      email,
      username,
      password,
      firstName,
      lastName,
    })
    localStorage.setItem('auth_token', response.token)
    localStorage.setItem('refresh_token', response.refreshToken)
    setUser(response.user)
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
