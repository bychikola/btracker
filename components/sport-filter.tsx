'use client'

import { SportFilter as SportFilterType } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Trophy,
  Dumbbell,
  Gamepad2,
  List,
} from 'lucide-react'
import { FootballIcon } from './icons/football-icon'
import { TennisIcon } from './icons/tennis-icon'
import { BasketballIcon } from './icons/basketball-icon'
import { VolleyballIcon } from './icons/volleyball-icon'
import { HockeyIcon } from './icons/hockey-icon'
import Link from 'next/link'

const sportIcons: Record<string, React.ReactNode> = {
  all: <Trophy className="w-6 h-6" />,
  football: <FootballIcon className="w-6 h-6" />,
  hockey: <HockeyIcon className="w-6 h-6" />,
  tennis: <TennisIcon className="w-6 h-6" />,
  basketball: <BasketballIcon className="w-6 h-6" />,
  esports: <Gamepad2 className="w-6 h-6" />,
  volleyball: <VolleyballIcon className="w-6 h-6" />,
  boxing: <Dumbbell className="w-6 h-6" />,
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
      <div className="flex gap-6 pb-2">
        {sportFilters.map((sport) => (
          <button
            key={sport.id}
            onClick={() => onChange(sport.id)}
            className={cn(
              'flex flex-col items-center gap-2 min-w-[80px] py-3 px-2 rounded-lg transition-all',
              'hover:bg-card-hover',
              selected === sport.id
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary'
            )}
          >
            <div className={cn(
              'p-2 rounded-full transition-colors',
              selected === sport.id ? 'bg-accent/20' : 'bg-card-hover'
            )}>
              {sportIcons[sport.icon]}
            </div>
            <span className="text-xs font-medium whitespace-nowrap">{sport.name}</span>
          </button>
        ))}

        {/* Кнопка "Все матчи" */}
        <Link
          href="/matches"
          className="flex flex-col items-center gap-2 min-w-[80px] py-3 px-2 rounded-lg transition-all hover:bg-card-hover text-text-secondary"
        >
          <div className="p-2 rounded-full transition-colors bg-card-hover">
            <List className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium whitespace-nowrap">Все матчи</span>
        </Link>
      </div>
    </div>
  )
}
