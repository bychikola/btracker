'use client'

import { X, Search, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTodayMatches } from '@/lib/hooks/useSstatsMatches'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Match } from '@/lib/types'
import { translateTeam, translateLeague } from '@/lib/translations'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const debouncedSearchQuery = useDebounce(searchQuery, 300) // Дебаунс 300мс
  const { data } = useTodayMatches({ Limit: 1000 })

  useEffect(() => {
    if (!debouncedSearchQuery.trim() || !data?.matches) {
      setFilteredMatches([])
      return
    }

    const query = debouncedSearchQuery.toLowerCase()
    const filtered = data.matches.filter(match => {
      const team1Original = match.team1.name.toLowerCase()
      const team2Original = match.team2.name.toLowerCase()
      const leagueOriginal = match.league_name.toLowerCase()

      const team1Translated = translateTeam(match.team1.name).toLowerCase()
      const team2Translated = translateTeam(match.team2.name).toLowerCase()
      const leagueTranslated = translateLeague(match.league_name).toLowerCase()

      return team1Original.includes(query) ||
             team2Original.includes(query) ||
             leagueOriginal.includes(query) ||
             team1Translated.includes(query) ||
             team2Translated.includes(query) ||
             leagueTranslated.includes(query)
    })

    setFilteredMatches(filtered.slice(0, 20)) // Показываем максимум 20 результатов
  }, [debouncedSearchQuery, data])

  if (!isOpen) return null

  const handleMatchClick = () => {
    onClose()
    setSearchQuery('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden"
          >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск команд, лиг или матчей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-base outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[500px] overflow-y-auto">
          {searchQuery.trim() === '' ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Начните вводить название команды или лиги</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">Ничего не найдено</p>
              <p className="text-xs text-gray-400 mt-1">Попробуйте изменить запрос</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredMatches.map((match) => {
                // Проверяем, действительно ли матч идет сейчас
                const matchTime = new Date(match.start_time)
                const now = new Date()
                const isActuallyLive = match.is_live && matchTime <= now

                return (
                  <button
                    key={match.id}
                    onClick={handleMatchClick}
                    className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">{translateLeague(match.league_name)}</span>
                      {isActuallyLive ? (
                        <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                          <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                          LIVE
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {format(matchTime, 'HH:mm', { locale: ru })}
                        </span>
                      )}
                    </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{translateTeam(match.team1.name)}</span>
                      {match.score && (
                        <span className="text-sm font-bold text-gray-900">{match.score.team1}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{translateTeam(match.team2.name)}</span>
                      {match.score && (
                        <span className="text-sm font-bold text-gray-900">{match.score.team2}</span>
                      )}
                    </div>
                  </div>

                  {match.odds && (match.odds.p1 > 0 || match.odds.p2 > 0) && (
                    <div className="flex gap-2 mt-3">
                      {match.odds.p1 > 0 && (
                        <div className="px-2 py-1 bg-gray-100 rounded text-xs">
                          П1: <span className="font-semibold">{match.odds.p1.toFixed(2)}</span>
                        </div>
                      )}
                      {match.odds.x > 0 && (
                        <div className="px-2 py-1 bg-gray-100 rounded text-xs">
                          X: <span className="font-semibold">{match.odds.x.toFixed(2)}</span>
                        </div>
                      )}
                      {match.odds.p2 > 0 && (
                        <div className="px-2 py-1 bg-gray-100 rounded text-xs">
                          П2: <span className="font-semibold">{match.odds.p2.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  )
}
