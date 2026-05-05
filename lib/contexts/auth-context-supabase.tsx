'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  createdAt: string
}

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
    // Проверяем текущую сессию
    checkUser()

    // Подписываемся на изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadUserProfile(session.user.id)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data) {
        setUser({
          id: data.id,
          email: data.email,
          username: data.username,
          firstName: data.first_name,
          lastName: data.last_name,
          avatar: data.avatar_url,
          createdAt: data.created_at,
        })
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const register = async (
    email: string,
    username: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    // 1. Регистрация в Supabase Auth с метаданными
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          first_name: firstName,
          last_name: lastName,
        }
      }
    })

    if (authError) {
      // Обработка специфичных ошибок
      if (authError.message.includes('429')) {
        throw new Error('Слишком много попыток регистрации. Подождите 1-2 минуты и попробуйте снова.')
      }
      throw authError
    }

    if (!authData.user) throw new Error('Registration failed')

    // 2. Подождем немного для срабатывания триггера
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 3. Проверим, создался ли профиль автоматически
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .maybeSingle()

    // 4. Если профиль не создался триггером, создадим вручную
    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          username,
          first_name: firstName,
          last_name: lastName,
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Не бросаем ошибку, так как триггер может создать профиль позже
      }
    }

    // 5. Загрузка профиля
    await loadUserProfile(authData.user.id)
  }

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    if (!data.user) throw new Error('Login failed')

    await loadUserProfile(data.user.id)
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
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
