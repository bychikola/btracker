'use client'

import { Match, MarketOdds } from '@/lib/types'
import { useBetSlip } from '@/lib/contexts/bet-slip-context'
import { BetSlipMatchData, BetOutcome } from '@/lib/types/bet-slip'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { cn } from '@/lib/utils'

interface MainBetsProps {
  match: Match
}

function mapOutcomeToBetType(outcomeName: string): BetOutcome {
  const n = outcomeName.toLowerCase()
  if (n === 'home' || n === '1') return 'home'
  if (n === 'draw' || n === 'x') return 'draw'
  if (n === 'away' || n === '2') return 'away'
  return 'home' // fallback для нестандартных рынков
}

function getOutcomeLabel(name: string): string {
  const labels: Record<string, string> = {
    'Home': 'П1', 'Draw': 'X', 'Away': 'П2',
    'Home/Draw': '1X', 'Home/Away': '12', 'Draw/Away': 'X2',
  }
  return labels[name] || name
}

export function MainBets({ match }: MainBetsProps) {
  const { addItem, removeItem, isItemInSlip, getItemInSlip } = useBetSlip()

  const markets = match.markets
  const odds = match.odds || { p1: 0, x: 0, p2: 0 }
  const hasValidOdds = odds.p1 > 0 || odds.x > 0 || odds.p2 > 0

  const betSlipMatchData: BetSlipMatchData = {
    match_id: match.id,
    sport_type: match.sport_type,
    league_name: match.league_name,
    team1: match.team1,
    team2: match.team2,
    start_time: match.start_time,
    is_live: match.is_live,
  }

  const isSelected = (outcomeName: string) => {
    const outcome = mapOutcomeToBetType(outcomeName)
    return isItemInSlip(match.id, outcome)
  }

  const handleToggleBet = async (outcomeName: string, oddValue: number) => {
    if (oddValue <= 0) { toast.error('Коэффициент недоступен'); return }

    const outcome = mapOutcomeToBetType(outcomeName)
    const existingItem = getItemInSlip(match.id, outcome)

    if (existingItem) {
      try {
        await removeItem(existingItem.id)
        toast.success(`Удалено: ${outcomeName} @ ${oddValue.toFixed(2)}`)
      } catch (error: any) {
        toast.error(error.message || 'Ошибка')
      }
      return
    }

    try {
      await addItem({
        match_id: match.id,
        match_data: betSlipMatchData,
        bet_outcome: outcome,
        odds: oddValue,
      })
      toast.success(`Добавлено: ${outcomeName} @ ${oddValue.toFixed(2)}`)
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при добавлении')
    }
  }

  // Рендер одной кнопки коэффициента
  const OddsCell = ({ name, value, isBig }: { name: string; value: number; isBig?: boolean }) => {
    const selected = isSelected(name)
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => handleToggleBet(name, value)}
        disabled={value <= 0}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 py-3 px-2 rounded-[var(--radius-xl)] transition-all touch-manipulation select-none text-center',
          selected
            ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md'
            : 'bg-[var(--canvas-soft)] hover:bg-[var(--primary)]/15 hover:shadow-sm',
          value <= 0 && 'opacity-25 cursor-not-allowed'
        )}
      >
        <span className={cn(
          'text-[11px] font-semibold uppercase tracking-wide',
          selected ? 'text-[var(--primary-foreground)]/50' : 'text-[var(--mute)]'
        )}>
          {getOutcomeLabel(name)}
        </span>
        <span className={cn(
          'font-[800] tabular-nums',
          isBig ? 'text-xl sm:text-2xl' : 'text-base',
          selected ? 'text-[var(--primary-foreground)]' : 'text-[var(--ink)]'
        )}>
          {value.toFixed(2)}
        </span>
        {selected && (
          <span className="text-[10px] font-medium text-[var(--primary-foreground)]/60">✓ Выбрано</span>
        )}
      </motion.button>
    )
  }

  if (!hasValidOdds) {
    return (
      <Card padding="lg">
        <h2 className="text-xl font-[800] text-[var(--ink)] mb-4">Коэффициенты</h2>
        <div className="text-center py-8 text-[var(--mute)]">Недоступны</div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* ─── Основные исходы (1X2) ─── */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-[800] text-[var(--ink)]">Основные исходы</h2>
          {match.is_live && <Badge variant="live" size="sm">LIVE</Badge>}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="col-span-3 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { name: 'Home', label: 'П1', sublabel: match.team1.name },
              { name: 'Draw', label: 'X', sublabel: 'Ничья' },
              { name: 'Away', label: 'П2', sublabel: match.team2.name },
            ].map(({ name, label, sublabel }) => {
              const value = name === 'Home' ? odds.p1 : name === 'Draw' ? odds.x : odds.p2
              if (value <= 0 && name === 'Draw') return null
              const selected = isSelected(name)
              return (
                <motion.button
                  key={name}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleToggleBet(name, value)}
                  disabled={value <= 0}
                  className={`flex flex-col items-center justify-center gap-1 p-3 sm:p-4 rounded-[var(--radius-xl)] transition-all relative min-h-[90px] sm:min-h-[110px] touch-manipulation ${
                    selected
                      ? 'bg-[var(--primary)] shadow-lg'
                      : 'bg-[var(--canvas-soft)] hover:bg-[var(--primary)]/15 hover:shadow-sm'
                  } ${value <= 0 ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {selected && (
                    <motion.div layoutId="selectedMain" className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--primary-foreground)]" />
                  )}
                  <span className={`text-xs font-semibold uppercase tracking-wider ${selected ? 'text-[var(--primary-foreground)]/50' : 'text-[var(--mute)]'}`}>
                    {label}
                  </span>
                  <span className={`text-xs sm:text-sm font-medium line-clamp-2 px-1 text-center ${selected ? 'text-[var(--primary-foreground)]/80' : 'text-[var(--body)]'}`}>
                    {sublabel}
                  </span>
                  <span className={`text-2xl sm:text-3xl font-[900] tabular-nums tracking-tight ${selected ? 'text-[var(--primary-foreground)]' : 'text-[var(--ink)]'}`}>
                    {value > 0 ? value.toFixed(2) : '—'}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* ─── Двойной шанс ─── */}
      {markets?.doubleChance && markets.doubleChance.outcomes.length >= 2 && (
        <Card padding="lg">
          <h2 className="text-xl font-[800] text-[var(--ink)] mb-4">Двойной шанс</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {markets.doubleChance.outcomes.map(o => (
              <OddsCell key={o.name} name={o.name} value={o.value} />
            ))}
          </div>
        </Card>
      )}

      {/* ─── Тоталы ─── */}
      {markets?.totals && markets.totals.length > 0 && (
        <Card padding="lg">
          <h2 className="text-xl font-[800] text-[var(--ink)] mb-4">Тоталы</h2>
          <div className="space-y-2">
            {markets.totals.map((total) => (
              <div key={total.label} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--mute)] w-16 sm:w-20 text-right flex-shrink-0">
                  {total.label}
                </span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  {total.outcomes.map(o => (
                    <OddsCell key={o.name} name={o.name} value={o.value} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── Остальные рынки ─── */}
      {markets?.other && markets.other.length > 0 && (
        <Card padding="lg">
          <h2 className="text-xl font-[800] text-[var(--ink)] mb-4">Дополнительные рынки</h2>
          <div className="space-y-3">
            {markets.other.map((market) => (
              <div key={market.label}>
                <span className="text-xs font-semibold text-[var(--mute)] block mb-1.5">{market.label}</span>
                <div className="grid grid-cols-3 gap-2">
                  {market.outcomes.map(o => (
                    <OddsCell key={o.name} name={o.name} value={o.value} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Hint */}
      <div className="text-center py-2">
        <p className="text-xs text-[var(--mute)]">
          Нажмите на коэффициент, чтобы добавить исход в купон
        </p>
      </div>
    </div>
  )
}
