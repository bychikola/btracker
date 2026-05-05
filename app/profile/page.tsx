'use client'

import { useAuth } from '@/lib/contexts/auth-context-supabase'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { User, Mail, Calendar, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Профиль</h1>
          <p className="text-gray-600 mt-2">Управление вашим аккаунтом</p>
        </div>

        {/* Карточка профиля */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Аватар */}
            <div className="flex-shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Информация */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username}
              </h2>
              <p className="text-gray-600 mb-4">@{user.username}</p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span>
                    Зарегистрирован:{' '}
                    {format(new Date(user.createdAt), 'd MMMM yyyy', { locale: ru })}
                  </span>
                </div>
              </div>
            </div>

            {/* Кнопка редактирования */}
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Редактировать
            </button>
          </div>
        </div>

        {/* Дополнительные секции */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Избранное */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Избранные матчи</h3>
            <p className="text-gray-600 text-sm">У вас пока нет избранных матчей</p>
          </div>

          {/* История ставок */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">История ставок</h3>
            <p className="text-gray-600 text-sm">История ставок пуста</p>
          </div>
        </div>
      </div>
    </div>
  )
}
