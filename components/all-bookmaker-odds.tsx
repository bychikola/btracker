'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useBetSlip } from '@/lib/contexts/bet-slip-context'
import { BetSlipMatchData, BetOutcome } from '@/lib/types/bet-slip'
import { ApiSaBookmakerOdds, Price } from '@/lib/types/api'
import { Match } from '@/lib/types'
import { Card } from './ui/card'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface AllBookmakerOddsProps {
  match: Match
  bookmakerOdds: ApiSaBookmakerOdds[]
}

// Группировка рынков по категориям (порядок важен — первый match побеждает)
const MARKET_CATEGORIES: { pattern: RegExp; label: string }[] = [
  { pattern: /Match Winner|Full Time Result|Основной исход/i, label: 'Основной исход' },
  { pattern: /Double Chance(?!.*First|.*Second|.*Half)/i, label: 'Двойной шанс' },
  { pattern: /Goals Over\/Under(?!.*First|.*Second|.*Half)/i, label: 'Тотал' },
  { pattern: /Goals Over\/Under.*First Half/i, label: 'Тотал 1-й тайм' },
  { pattern: /Goals Over\/Under.*Second Half/i, label: 'Тотал 2-й тайм' },
  { pattern: /Asian Handicap(?!.*First|.*Second|.*Half)/i, label: 'Азиатская фора' },
  { pattern: /Asian Handicap.*First Half/i, label: 'Азиатская фора 1-й тайм' },
  { pattern: /Asian Handicap.*2nd Half/i, label: 'Азиатская фора 2-й тайм' },
  { pattern: /Handicap Result(?!.*First)/i, label: 'Фора' },
  { pattern: /Handicap Result.*First Half/i, label: 'Фора 1-й тайм' },
  { pattern: /European Handicap/i, label: 'Европейская фора' },
  { pattern: /Over\/Under|Total -/i, label: 'Индивидуальный тотал' },
  { pattern: /HT\/FT|Half Time\/Full Time/i, label: 'Тайм/Матч' },
  { pattern: /Exact Score|Correct Score/i, label: 'Точный счёт' },
  { pattern: /Both Teams Score(?!.*First|.*Second)/i, label: 'Обе забьют' },
  { pattern: /Both Teams Score.*First Half|Both Teams.*1st Half/i, label: 'Обе забьют 1-й тайм' },
  { pattern: /Both Teams.*Second Half/i, label: 'Обе забьют 2-й тайм' },
  { pattern: /First Half Winner/i, label: 'Победитель 1-го тайма' },
  { pattern: /Second Half Winner/i, label: 'Победитель 2-го тайма' },
  { pattern: /Team To Score First/i, label: 'Кто забьёт первый' },
  { pattern: /Team To Score Last/i, label: 'Кто забьёт последний' },
  { pattern: /Win to Nil/i, label: 'Сухая победа' },
  { pattern: /Odd\/Even(?!.*First|.*Second)/i, label: 'Чёт/Нечет' },
  { pattern: /Odd\/Even.*First Half/i, label: 'Чёт/Нечет 1-й тайм' },
  { pattern: /Odd\/Even.*Second Half/i, label: 'Чёт/Нечет 2-й тайм' },
  { pattern: /Result\/Total Goals/i, label: 'Исход + Тотал' },
  { pattern: /Home team.*score in both halves|Home Team.*Goal/i, label: 'Голы хозяев' },
  { pattern: /Away team.*score in both halves|Away Team.*Goal/i, label: 'Голы гостей' },
  { pattern: /Home Team Total Goals|Total - Home/i, label: 'Тотал хозяев' },
  { pattern: /Away Team Total Goals|Total - Away/i, label: 'Тотал гостей' },
  { pattern: /Scoring Draw/i, label: 'Результативная ничья' },
  { pattern: /To Score in Both Halves/i, label: 'Гол в обоих таймах' },
  { pattern: /Home win both halves/i, label: 'Победа в обоих таймах' },
  { pattern: /Away win both halves/i, label: 'Победа гостей в обоих таймах' },
  { pattern: /First Team to Score/i, label: 'Первый гол' },
]

function categorizeMarket(marketName: string): string {
  for (const cat of MARKET_CATEGORIES) {
    if (cat.pattern.test(marketName)) return cat.label
  }
  return marketName
}

const DEFAULT_EXPANDED: Record<string, boolean> = {
  'Азиатская фора': true,
  'Индивидуальный тотал': true,
  'Точный счёт': true,
  'Обе забьют': true,
}

// Уникальный ключ исхода для дедупликации
function outcomeKey(marketName: string, price: Price): string {
  return `${marketName}::${price.name}::${price.value}`
}

// Извлекаем число из названия исхода для сортировки
function extractNumber(name: string): number {
  const match = name.match(/(\d+\.?\d*)/)
  return match ? parseFloat(match[1]) : 0
}

// Сортировка исходов: Over перед Under, по числу от меньшего к большему
function sortOutcomes(a: Price, b: Price): number {
  const aNum = extractNumber(a.name)
  const bNum = extractNumber(b.name)

  // Если числа разные — сортируем по числу
  if (aNum !== bNum) return aNum - bNum

  // Одинаковое число: Over перед Under, Home перед Away, Yes перед No
  const aIsOver = /over|home|yes|1/i.test(a.name)
  const bIsOver = /over|home|yes|1/i.test(b.name)
  if (aIsOver && !bIsOver) return -1
  if (!aIsOver && bIsOver) return 1

  return 0
}

interface GroupedMarket {
  marketName: string
  outcomes: Price[]
}

export function AllBookmakerOdds({ match, bookmakerOdds }: AllBookmakerOddsProps) {
  const { addItem, removeItem, getItemInSlip } = useBetSlip()
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(DEFAULT_EXPANDED)
  const [searchQuery, setSearchQuery] = useState('')

  const betSlipMatchData: BetSlipMatchData = {
    match_id: match.id,
    sport_type: match.sport_type,
    league_name: match.league_name,
    team1: match.team1,
    team2: match.team2,
    start_time: match.start_time,
    is_live: match.is_live,
  }

  // Объединяем все рынки со всех букмекеров, дедуплицируем исходы
  const categorizedMarkets = useMemo(() => {
    const result = new Map<string, Map<string, Price[]>>()

    for (const bookmaker of bookmakerOdds) {
      for (const market of bookmaker.odds) {
        const marketName = market.marketName || `Рынок ${market.marketId}`
        const category = categorizeMarket(marketName)

        if (!result.has(category)) {
          result.set(category, new Map())
        }
        const catMap = result.get(category)!

        if (!catMap.has(marketName)) {
          catMap.set(marketName, [])
        }
        const existingOutcomes = catMap.get(marketName)!

        // Дедупликация: для каждого названия исхода оставляем только ЛУЧШИЙ коэффициент
        for (const price of market.odds) {
          const existing = existingOutcomes.find(o => o.name === price.name)
          if (!existing) {
            existingOutcomes.push({ ...price })
          } else {
            // Оставляем наибольший коэффициент
            const newVal = parseFloat(price.value)
            const oldVal = parseFloat(existing.value)
            if (newVal > oldVal) {
              existing.value = price.value
            }
          }
        }
      }
    }

    // Сортируем исходы внутри каждого рынка
    for (const [, catMap] of result) {
      for (const [, outcomes] of catMap) {
        outcomes.sort(sortOutcomes)
      }
    }

    return result
  }, [bookmakerOdds])

  // Категории, которые уже показаны в MainBets — не дублируем
  const SKIP_CATEGORIES = new Set(['Основной исход', 'Двойной шанс', 'Тотал'])

  // Сортируем категории, пропускаем уже показанные
  const sortedCategories = useMemo(() => {
    const order = ['Индивидуальный тотал', 'Азиатская фора', 'Фора', 'Европейская фора',
      'Точный счёт', 'Обе забьют', 'Тайм/Матч', 'Победитель 1-го тайма', 'Победитель 2-го тайма',
      'Тотал 1-й тайм', 'Тотал 2-й тайм', 'Кто забьёт первый', 'Кто забьёт последний']
    return Array.from(categorizedMarkets.entries())
      .filter(([cat]) => !SKIP_CATEGORIES.has(cat))
      .sort(([a], [b]) => {
        const ai = order.indexOf(a), bi = order.indexOf(b)
        if (ai >= 0 && bi >= 0) return ai - bi
        if (ai >= 0) return -1
        if (bi >= 0) return 1
        return a.localeCompare(b)
      })
  }, [categorizedMarkets])

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  const handleToggle = async (marketName: string, outcomeName: string, value: number) => {
    if (value <= 0) return
    const fullLabel = `${marketName} — ${outcomeName}`
    const outcome: BetOutcome = 'home'

    const existingItem = getItemInSlip(match.id, outcome)
    if (existingItem && (existingItem as any).match_data?._fullLabel === fullLabel) {
      try {
        await removeItem(existingItem.id)
        toast.success(`Удалено: ${fullLabel}`)
      } catch (error: any) {
        toast.error(error.message || 'Ошибка')
      }
      return
    }

    try {
      await addItem({
        match_id: match.id,
        match_data: { ...betSlipMatchData, _fullLabel: fullLabel, _marketName: marketName } as any,
        bet_outcome: outcome,
        odds: value,
      })
      toast.success(`Добавлено: ${fullLabel} @ ${value.toFixed(2)}`)
    } catch (error: any) {
      toast.error(error.message || 'Ошибка')
    }
  }

  if (bookmakerOdds.length === 0) return null

  // Фильтр по поиску
  const filteredCategories = searchQuery
    ? sortedCategories.filter(([cat]) => cat.toLowerCase().includes(searchQuery.toLowerCase()))
    : sortedCategories

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-[800] text-[var(--ink)]">Все рынки</h2>
        </div>
      </div>

      {/* Поиск */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)] pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск рынка..."
          className="w-full bg-[var(--canvas)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[var(--radius-md)] py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 placeholder:text-[var(--mute)]"
        />
      </div>

      <div className="space-y-2">
        {filteredCategories.map(([category, marketsMap]) => {
          const isExpanded = expandedCategories[category] ?? false
          const markets = Array.from(marketsMap.entries())
            .sort(([a], [b]) => {
              const aNum = extractNumber(a)
              const bNum = extractNumber(b)
              if (aNum !== bNum) return aNum - bNum
              return a.localeCompare(b)
            })

          return (
            <div key={category} className="bg-[var(--canvas-soft)] rounded-[var(--radius-xl)] overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity"
              >
                <span className="text-sm font-[800] text-[var(--ink)]">{category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--mute)]">{markets.length} рынков</span>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-[var(--mute)]" />
                    : <ChevronDown className="w-4 h-4 text-[var(--mute)]" />
                  }
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4">
                  {/* Компактный вид — только одна строка рынка */}
                  {markets.length === 1 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {markets[0][1].map((price, i) => (
                        <OddsChip
                          key={i}
                          name={price.name}
                          value={Number(price.value)}
                          matchId={match.id}
                          marketName={markets[0][0]}
                          onToggle={handleToggle}
                        />
                      ))}
                    </div>
                  ) : (
                    /* Много рынков в категории — с подзаголовками */
                    markets.map(([marketName, outcomes]) => (
                      <div key={marketName} className="mb-2.5 last:mb-0">
                        <div className="text-[10px] font-semibold text-[var(--mute)] mb-1.5 uppercase tracking-wide">
                          {marketName}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {outcomes.map((price, i) => (
                            <OddsChip
                              key={i}
                              name={price.name}
                              value={Number(price.value)}
                              matchId={match.id}
                              marketName={marketName}
                              onToggle={handleToggle}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// Чип с коэффициентом
function OddsChip({
  name, value, matchId, marketName, onToggle,
}: {
  name: string; value: number; matchId: string; marketName: string;
  onToggle: (marketName: string, outcomeName: string, value: number) => void;
}) {
  const { getItemInSlip } = useBetSlip()
  const fullLabel = `${marketName} — ${name}`
  const existingItem = getItemInSlip(matchId, 'home')
  const isSelected = existingItem && (existingItem as any).match_data?._fullLabel === fullLabel

  if (value <= 0) return null

  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={() => onToggle(marketName, name, value)}
      className={cn(
        'px-2.5 py-2 rounded-[var(--radius-md)] transition-all touch-manipulation inline-flex flex-col items-center gap-0.5 min-w-[48px]',
        'border border-transparent',
        isSelected
          ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm border-[var(--primary)]'
          : 'bg-[var(--canvas)] hover:bg-[var(--primary)]/20 hover:border-[var(--primary)]/30 text-[var(--ink)]'
      )}
    >
      <span className={cn(
        'text-[10px] font-semibold leading-tight text-center line-clamp-1',
        isSelected && 'text-[var(--primary-foreground)]/70'
      )}>
        {name}
      </span>
      <span className={cn(
        'text-xs font-[800] tabular-nums',
        isSelected && 'text-[var(--primary-foreground)]'
      )}>
        {value.toFixed(2)}
      </span>
    </motion.button>
  )
}
