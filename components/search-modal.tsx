'use client'

import { X, Search, Clock, ChevronRight, Zap } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useTodayMatches } from '@/lib/hooks/useSstatsMatches'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Match } from '@/lib/types'
import { translateTeam, translateLeague } from '@/lib/translations'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Badge } from './ui/badge'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const { data } = useTodayMatches({ Limit: 1000 })
  const router = useRouter()

  useEffect(() => {
    if (!debouncedSearchQuery.trim() || !data?.matches) {
      setFilteredMatches([])
      return
    }

    const query = debouncedSearchQuery.toLowerCase()
    const filtered = data.matches.filter(match => {
      const needles = [match.team1.name, match.team2.name, match.league_name,
        translateTeam(match.team1.name), translateTeam(match.team2.name), translateLeague(match.league_name)]
      return needles.some(n => n.toLowerCase().includes(query))
    })

    setFilteredMatches(filtered.slice(0, 20))
  }, [debouncedSearchQuery, data])

  const handleMatchClick = useCallback((matchId: string) => {
    onClose()
    setSearchQuery('')
    router.push(`/match/${matchId}`)
  }, [onClose, router])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-3 sm:px-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[var(--ink)]/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl bg-[var(--canvas)] rounded-[var(--radius-xl)] shadow-lg overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-[var(--border)]">
              <Search className="w-5 h-5 text-[var(--mute)] flex-shrink-0" />
              <input
                type="text"
                placeholder="Поиск команд, лиг или матчей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-base outline-none bg-transparent text-[var(--ink)] placeholder:text-[var(--mute)] font-medium"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 hover:bg-[var(--canvas-soft)] rounded-[var(--radius-full)] transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 text-[var(--mute)]" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--canvas-soft)] rounded-[var(--radius-full)] transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-[var(--mute)]" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {searchQuery.trim() === '' ? (
                <div className="py-16 text-center">
                  <Search className="w-12 h-12 mx-auto mb-3 text-[var(--mute)]/30" />
                  <p className="text-sm text-[var(--mute)] font-medium">
                    Начните вводить название команды или лиги
                  </p>
                </div>
              ) : filteredMatches.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-[var(--mute)] font-medium">Ничего не найдено</p>
                  <p className="text-xs text-[var(--mute)] mt-1">Попробуйте изменить запрос</p>
                </div>
              ) : (
                <div className="py-2">
                  <div className="px-4 sm:px-5 py-1.5 text-[10px] font-semibold text-[var(--mute)] uppercase tracking-wider">
                    Найдено: {filteredMatches.length}
                  </div>
                  {filteredMatches.map((match, index) => {
                    const matchTime = new Date(match.start_time)
                    const isLive = match.is_live && matchTime <= new Date()

                    return (
                      <motion.button
                        key={match.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.03, 0.3) }}
                        onClick={() => handleMatchClick(match.id)}
                        className="w-full px-4 sm:px-5 py-3.5 hover:bg-[var(--canvas-soft)] transition-all text-left group flex items-center gap-3"
                      >
                        {/* Match info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] text-[var(--mute)] font-medium truncate">
                              {translateLeague(match.league_name)}
                            </span>
                            {isLive ? (
                              <Badge variant="live" size="sm">LIVE</Badge>
                            ) : (
                              <span className="text-[11px] text-[var(--mute)] flex items-center gap-1 flex-shrink-0">
                                <Clock className="w-3 h-3" />
                                {format(matchTime, 'HH:mm', { locale: ru })}
                              </span>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-[var(--ink)] truncate">
                                {translateTeam(match.team1.name)}
                              </span>
                              {match.score && (
                                <span className="text-base font-[800] text-[var(--ink)] ml-2 flex-shrink-0">
                                  {match.score.team1}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-[var(--ink)] truncate">
                                {translateTeam(match.team2.name)}
                              </span>
                              {match.score && (
                                <span className="text-base font-[800] text-[var(--ink)] ml-2 flex-shrink-0">
                                  {match.score.team2}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Odds preview */}
                          {match.odds && (match.odds.p1 > 0 || match.odds.p2 > 0) && (
                            <div className="flex gap-1.5 mt-2">
                              {[
                                { label: 'П1', val: match.odds.p1 },
                                { label: 'X', val: match.odds.x },
                                { label: 'П2', val: match.odds.p2 },
                              ].filter(o => o.val > 0).map(({ label, val }) => (
                                <span key={label} className="px-2 py-0.5 bg-[var(--canvas-soft)] rounded-[var(--radius-sm)] text-[10px] font-semibold text-[var(--ink)]">
                                  {label} <span className="font-[800]">{val.toFixed(2)}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-4 h-4 text-[var(--mute)] group-hover:text-[var(--primary)] transition-colors flex-shrink-0" />
                      </motion.button>
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
