import { supabase } from '../supabase/client'

export interface BettingTrend {
  type: 'success' | 'warning' | 'info'
  title: string
  description: string
  icon: string
}

export interface BettingRecommendation {
  type: 'positive' | 'negative' | 'neutral'
  title: string
  description: string
  action?: string
}

/**
 * Анализ трендов в ставках пользователя
 */
export async function analyzeBettingTrends(): Promise<BettingTrend[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: betSlips, error } = await supabase
    .from('bet_slips')
    .select('*, bet_slip_items(*)')
    .eq('user_id', user.id)
    .in('status', ['won', 'lost'])
    .order('placed_at', { ascending: false })
    .limit(50)

  if (error) throw error
  if (!betSlips || betSlips.length < 5) return []

  const trends: BettingTrend[] = []

  // Анализ последних 10 ставок
  const recent10 = betSlips.slice(0, 10)
  const recent10Won = recent10.filter(b => b.status === 'won').length
  const recent10WinRate = (recent10Won / recent10.length) * 100

  if (recent10WinRate >= 70) {
    trends.push({
      type: 'success',
      title: 'Отличная серия!',
      description: `Вы выиграли ${recent10Won} из последних 10 ставок (${recent10WinRate.toFixed(0)}%)`,
      icon: '🔥'
    })
  } else if (recent10WinRate <= 30) {
    trends.push({
      type: 'warning',
      title: 'Сложный период',
      description: `Только ${recent10Won} побед из последних 10 ставок. Возможно, стоит пересмотреть стратегию`,
      icon: '⚠️'
    })
  }

  // Анализ по времени суток
  const betsByHour = new Map<number, { won: number, total: number }>()
  betSlips.forEach(slip => {
    const hour = new Date(slip.placed_at || slip.created_at).getHours()
    if (!betsByHour.has(hour)) {
      betsByHour.set(hour, { won: 0, total: 0 })
    }
    const hourData = betsByHour.get(hour)!
    hourData.total++
    if (slip.status === 'won') hourData.won++
  })

  let bestHour = -1
  let bestWinRate = 0
  betsByHour.forEach((data, hour) => {
    if (data.total >= 3) {
      const winRate = (data.won / data.total) * 100
      if (winRate > bestWinRate) {
        bestWinRate = winRate
        bestHour = hour
      }
    }
  })

  if (bestHour !== -1 && bestWinRate >= 60) {
    trends.push({
      type: 'info',
      title: 'Лучшее время для ставок',
      description: `Ваш винрейт в ${bestHour}:00 составляет ${bestWinRate.toFixed(0)}%`,
      icon: '⏰'
    })
  }

  // Анализ типов ставок
  const singleBets = betSlips.filter(b => b.bet_type === 'single')
  const expressBets = betSlips.filter(b => b.bet_type === 'express')

  if (singleBets.length >= 5 && expressBets.length >= 5) {
    const singleWinRate = (singleBets.filter(b => b.status === 'won').length / singleBets.length) * 100
    const expressWinRate = (expressBets.filter(b => b.status === 'won').length / expressBets.length) * 100

    if (Math.abs(singleWinRate - expressWinRate) > 20) {
      const better = singleWinRate > expressWinRate ? 'ординары' : 'экспрессы'
      trends.push({
        type: 'info',
        title: 'Предпочтительный тип ставок',
        description: `Ваши ${better} показывают лучшие результаты`,
        icon: '📊'
      })
    }
  }

  // Анализ размера ставок
  const avgStake = betSlips.reduce((sum, b) => sum + b.stake_amount, 0) / betSlips.length
  const bigBets = betSlips.filter(b => b.stake_amount > avgStake * 1.5)
  if (bigBets.length >= 5) {
    const bigBetsWinRate = (bigBets.filter(b => b.status === 'won').length / bigBets.length) * 100
    const overallWinRate = (betSlips.filter(b => b.status === 'won').length / betSlips.length) * 100

    if (bigBetsWinRate < overallWinRate - 15) {
      trends.push({
        type: 'warning',
        title: 'Осторожнее с крупными ставками',
        description: `Винрейт на больших суммах ниже среднего на ${(overallWinRate - bigBetsWinRate).toFixed(0)}%`,
        icon: '💰'
      })
    }
  }

  return trends
}

/**
 * Генерация рекомендаций на основе истории
 */
export async function generateRecommendations(): Promise<BettingRecommendation[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: betSlips, error } = await supabase
    .from('bet_slips')
    .select('*, bet_slip_items(*)')
    .eq('user_id', user.id)
    .in('status', ['won', 'lost'])

  if (error) throw error
  if (!betSlips || betSlips.length < 10) {
    return [{
      type: 'neutral',
      title: 'Недостаточно данных',
      description: 'Сделайте больше ставок для получения персональных рекомендаций',
      action: 'Продолжайте делать ставки'
    }]
  }

  const recommendations: BettingRecommendation[] = []

  // Общая статистика
  const totalWon = betSlips.filter(b => b.status === 'won').length
  const winRate = (totalWon / betSlips.length) * 100
  const totalStaked = betSlips.reduce((sum, b) => sum + b.stake_amount, 0)
  const totalReturn = betSlips.filter(b => b.status === 'won').reduce((sum, b) => sum + b.potential_win, 0)
  const roi = ((totalReturn - totalStaked) / totalStaked) * 100

  // Рекомендация по ROI
  if (roi > 10) {
    recommendations.push({
      type: 'positive',
      title: 'Отличная доходность!',
      description: `Ваш ROI составляет ${roi.toFixed(1)}%. Продолжайте в том же духе!`,
      action: 'Придерживайтесь текущей стратегии'
    })
  } else if (roi < -10) {
    recommendations.push({
      type: 'negative',
      title: 'Пересмотрите стратегию',
      description: `Отрицательный ROI ${roi.toFixed(1)}% говорит о необходимости изменений`,
      action: 'Проанализируйте неудачные ставки'
    })
  }

  // Рекомендация по винрейту
  if (winRate < 45) {
    recommendations.push({
      type: 'negative',
      title: 'Низкий винрейт',
      description: `${winRate.toFixed(0)}% побед - попробуйте ставить на более надежные исходы`,
      action: 'Выбирайте коэффициенты 1.5-2.5'
    })
  }

  // Анализ средних коэффициентов
  const avgOdds = betSlips.reduce((sum, b) => sum + b.total_odds, 0) / betSlips.length
  if (avgOdds > 5 && winRate < 30) {
    recommendations.push({
      type: 'negative',
      title: 'Слишком рискованные ставки',
      description: `Средний коэффициент ${avgOdds.toFixed(2)} при низком винрейте`,
      action: 'Снизьте средний коэффициент до 2-3'
    })
  }

  // Анализ по видам спорта
  const sportMap = new Map<string, { won: number, total: number }>()
  betSlips.forEach(slip => {
    if (!slip.bet_slip_items || slip.bet_slip_items.length === 0) return
    const sport = slip.bet_slip_items[0].match_data.sport_type
    if (!sportMap.has(sport)) {
      sportMap.set(sport, { won: 0, total: 0 })
    }
    const sportData = sportMap.get(sport)!
    sportData.total++
    if (slip.status === 'won') sportData.won++
  })

  let bestSport = ''
  let bestSportWinRate = 0
  let worstSport = ''
  let worstSportWinRate = 100

  sportMap.forEach((data, sport) => {
    if (data.total >= 5) {
      const wr = (data.won / data.total) * 100
      if (wr > bestSportWinRate) {
        bestSportWinRate = wr
        bestSport = sport
      }
      if (wr < worstSportWinRate) {
        worstSportWinRate = wr
        worstSport = sport
      }
    }
  })

  if (bestSport && bestSportWinRate >= 60) {
    recommendations.push({
      type: 'positive',
      title: `Фокус на ${bestSport}`,
      description: `Ваш винрейт в ${bestSport} составляет ${bestSportWinRate.toFixed(0)}%`,
      action: 'Делайте больше ставок на этот вид спорта'
    })
  }

  if (worstSport && worstSportWinRate <= 30 && sportMap.get(worstSport)!.total >= 5) {
    recommendations.push({
      type: 'negative',
      title: `Избегайте ${worstSport}`,
      description: `Низкий винрейт ${worstSportWinRate.toFixed(0)}% в этом виде спорта`,
      action: 'Сократите ставки на этот вид спорта'
    })
  }

  return recommendations
}
