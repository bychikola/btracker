'use client'

import { SportFilter as SportFilterType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Trophy, Dumbbell, Gamepad2, List } from 'lucide-react'
import { FootballIcon } from './icons/football-icon'
import { TennisIcon } from './icons/tennis-icon'
import { BasketballIcon } from './icons/basketball-icon'
import { VolleyballIcon } from './icons/volleyball-icon'
import { HockeyIcon } from './icons/hockey-icon'
import Link from 'next/link'

const sportIcons: Record<string, React.ReactNode> = {
  all: <Trophy className="w-5 h-5" />,
  football: <FootballIcon className="w-5 h-5" />,
  hockey: <HockeyIcon className="w-5 h-5" />,
  tennis: <TennisIcon className="w-5 h-5" />,
  basketball: <BasketballIcon className="w-5 h-5" />,
  esports: <Gamepad2 className="w-5 h-5" />,
  volleyball: <VolleyballIcon className="w-5 h-5" />,
  boxing: <Dumbbell className="w-5 h-5" />,
}

const sportFilters: SportFilterType[] = [
  { id: 'all', name: 'Топ', icon: 'all' },
  { id: 'football', name: 'Футбол', icon: 'football' },
  { id: 'hockey', name: 'Хоккей', icon: 'hockey' },
  { id: 'tennis', name: 'Теннис', icon: 'tennis' },
  { id: 'basketball', name: 'Баскетбол', icon: 'basketball' },
  { id: 'esports', name: 'Киберспорт', icon: 'esports' },
  { id: 'volleyball', name: 'Волейбол', icon: 'volleyball' },
  { id: 'boxing', name: 'Бокс', icon: 'boxing' },
]

interface SportFilterProps {
  selected: string
  onChange: (sport: string) => void
}

export function SportFilter({ selected, onChange }: SportFilterProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-1 pb-2">
        {sportFilters.map((sport) => {
          const isActive = selected === sport.id
          return (
            <button
              key={sport.id}
              onClick={() => onChange(sport.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 min-w-[68px] py-2.5 px-2 rounded-[var(--radius-xl)] transition-all touch-manipulation',
                'hover:bg-[var(--canvas)] active:scale-95',
                isActive
                  ? 'bg-[var(--canvas)] text-[var(--primary)] shadow-sm'
                  : 'text-[var(--mute)]'
              )}
            >
              <div className={cn(
                'p-1.5 rounded-full transition-colors',
                isActive ? 'bg-[var(--primary)]/10' : 'bg-[var(--canvas)]'
              )}>
                {sportIcons[sport.icon]}
              </div>
              <span className="text-[10px] font-semibold whitespace-nowrap">{sport.name}</span>
            </button>
          )
        })}

        <Link
          href="/matches"
          className="flex flex-col items-center gap-1.5 min-w-[68px] py-2.5 px-2 rounded-[var(--radius-xl)] transition-all hover:bg-[var(--canvas)] active:scale-95 text-[var(--mute)] touch-manipulation"
        >
          <div className="p-1.5 rounded-full bg-[var(--canvas)]">
            <List className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold whitespace-nowrap">Все</span>
        </Link>
      </div>
    </div>
  )
}
