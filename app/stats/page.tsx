'use client'

import { useBetStatistics, useSportStatistics, useLeagueStatistics, useProfitOverTime, useBettingTrends, useBettingRecommendations } from '@/lib/hooks/useStatistics'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Target, Award, Activity, Lightbulb, AlertCircle, Info } from 'lucide-react'
import { Skeleton } from '@/components/skeleton'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const CHART_COLORS = {
  primary: '#9fe870',
  positive: '#2ead4b',
  negative: '#d03238',
  warning: '#ffd11a',
  mute: '#868685',
  ink: '#0e0f0c',
}

function StatCard({
  title, value, subtitle, icon: Icon, trend,
}: {
  title: string; value: string | number; subtitle?: string
  icon: any; trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card padding="md">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-[var(--primary-pale)] rounded-[var(--radius-lg)]">
          <Icon className="w-5 h-5 text-[var(--ink)]" />
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1 text-sm font-semibold',
            trend === 'up' ? 'text-[var(--positive)]' : trend === 'down' ? 'text-[var(--negative)]' : 'text-[var(--mute)]'
          )}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
          </div>
        )}
      </div>
      <h3 className="text-[28px] font-[900] text-[var(--ink)] tracking-tight mb-1">{value}</h3>
      <p className="text-sm text-[var(--body)]">{title}</p>
      {subtitle && <p className="text-xs text-[var(--mute)] mt-1">{subtitle}</p>}
    </Card>
  )
}

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} padding="md">
            <Skeleton className="h-10 w-10 rounded-[var(--radius-lg)] mb-4" />
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-[var(--radius-xl)]" />
        <Skeleton className="h-80 rounded-[var(--radius-xl)]" />
      </div>
    </div>
  )
}

export default function StatsPage() {
  const { data: stats, isLoading: statsLoading } = useBetStatistics()
  const { data: sportStats, isLoading: sportLoading } = useSportStatistics()
  const { data: leagueStats, isLoading: leagueLoading } = useLeagueStatistics()
  const { data: profitData, isLoading: profitLoading } = useProfitOverTime()
  const { data: trends, isLoading: trendsLoading } = useBettingTrends()
  const { data: recommendations, isLoading: recommendationsLoading } = useBettingRecommendations()

  const isLoading = statsLoading || sportLoading || leagueLoading || profitLoading

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-[40px] font-[900] text-[var(--ink)] tracking-tight mb-8">Статистика</h1>
        <StatsSkeleton />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-[40px] font-[900] text-[var(--ink)] tracking-tight mb-8">Статистика</h1>
        <Card padding="lg" className="text-center">
          <Activity className="w-12 h-12 text-[var(--mute)] mx-auto mb-3" />
          <p className="text-[var(--body)] font-medium">Нет данных для отображения статистики</p>
          <p className="text-sm text-[var(--mute)] mt-2">Сделайте несколько ставок, чтобы увидеть аналитику</p>
        </Card>
      </div>
    )
  }

  const profitTrend = stats.totalProfit > 0 ? 'up' : stats.totalProfit < 0 ? 'down' : 'neutral'
  const roiTrend = stats.roi > 0 ? 'up' : stats.roi < 0 ? 'down' : 'neutral'

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl space-y-6 sm:space-y-8">
        {/* Заголовок */}
        <h1 className="text-[32px] sm:text-[40px] font-[900] text-[var(--ink)] tracking-tight">
          Статистика
        </h1>

        {/* Основные метрики */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Общая прибыль"
            value={`${stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(0)} ₽`}
            subtitle={`Поставлено: ${stats.totalStaked.toFixed(0)} ₽`}
            icon={DollarSign}
            trend={profitTrend}
          />
          <StatCard
            title="ROI"
            value={`${stats.roi >= 0 ? '+' : ''}${stats.roi.toFixed(1)}%`}
            subtitle="Возврат инвестиций"
            icon={TrendingUp}
            trend={roiTrend}
          />
          <StatCard
            title="Винрейт"
            value={`${stats.winRate.toFixed(1)}%`}
            subtitle={`${stats.wonBets} из ${stats.totalBets} ставок`}
            icon={Target}
            trend={stats.winRate >= 50 ? 'up' : 'down'}
          />
          <StatCard
            title="Средний коэффициент"
            value={stats.averageOdds.toFixed(2)}
            subtitle={`Активных: ${stats.pendingBets}`}
            icon={Activity}
          />
        </div>

        {/* Дополнительные метрики */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card padding="md">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-[var(--positive)]" />
              <span className="text-sm text-[var(--body)]">Самая большая победа</span>
            </div>
            <p className="text-2xl font-[800] text-[var(--positive)]">+{stats.biggestWin.toFixed(0)} ₽</p>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-[var(--negative)]" />
              <span className="text-sm text-[var(--body)]">Самое большое поражение</span>
            </div>
            <p className="text-2xl font-[800] text-[var(--negative)]">−{stats.biggestLoss.toFixed(0)} ₽</p>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-[var(--primary)]" />
              <span className="text-sm text-[var(--body)]">Всего ставок</span>
            </div>
            <p className="text-2xl font-[800] text-[var(--ink)]">{stats.totalBets}</p>
          </Card>
        </div>

        {/* График прибыли */}
        {profitData && profitData.length > 0 && (
          <Card padding="lg">
            <h2 className="text-xl font-[800] text-[var(--ink)] mb-6">Динамика прибыли</h2>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--mute)" tick={{ fill: 'var(--mute)', fontSize: 12 }} />
                <YAxis stroke="var(--mute)" tick={{ fill: 'var(--mute)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--canvas)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cumulativeProfit"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={3}
                  name="Накопительная прибыль"
                  dot={{ fill: CHART_COLORS.primary, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Спорт + Лиги */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {sportStats && sportStats.length > 0 && (
            <Card padding="lg">
              <h2 className="text-xl font-[800] text-[var(--ink)] mb-6">По видам спорта</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={sportStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="sport_type" stroke="var(--mute)" tick={{ fill: 'var(--mute)', fontSize: 12 }} />
                  <YAxis stroke="var(--mute)" tick={{ fill: 'var(--mute)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--canvas)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="roi" fill={CHART_COLORS.primary} name="ROI %" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {leagueStats && leagueStats.length > 0 && (
            <Card padding="lg">
              <h2 className="text-xl font-[800] text-[var(--ink)] mb-6">Топ лиги</h2>
              <div className="space-y-2">
                {leagueStats.slice(0, 5).map((league, index) => (
                  <div key={league.league_name} className="flex items-center justify-between p-3 bg-[var(--canvas-soft)] rounded-[var(--radius-lg)]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                        <span className="text-sm font-[800] text-[var(--primary)]">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">{league.league_name}</p>
                        <p className="text-xs text-[var(--mute)]">{league.totalBets} ставок</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-sm font-[800]', league.roi >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]')}>
                        {league.roi >= 0 ? '+' : ''}{league.roi.toFixed(1)}%
                      </p>
                      <p className="text-xs text-[var(--mute)]">{league.winRate.toFixed(0)}% WR</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Тренды */}
        {trends && trends.length > 0 && (
          <Card padding="lg">
            <h2 className="text-xl font-[800] text-[var(--ink)] mb-6">Тренды</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {trends.map((trend, index) => (
                <div
                  key={index}
                  className={cn('p-4 rounded-[var(--radius-lg)] border',
                    trend.type === 'success' ? 'bg-[var(--primary-pale)] border-[var(--primary)]/20'
                    : trend.type === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20'
                    : 'bg-blue-500/5 border-blue-500/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{trend.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-sm font-[800] text-[var(--ink)] mb-1">{trend.title}</h3>
                      <p className="text-xs text-[var(--body)]">{trend.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Рекомендации */}
        {recommendations && recommendations.length > 0 && (
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-[var(--radius-lg)] bg-[var(--primary-pale)]">
                <Lightbulb className="w-5 h-5 text-[var(--ink)]" />
              </div>
              <h2 className="text-xl font-[800] text-[var(--ink)]">Рекомендации</h2>
            </div>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={cn('p-4 rounded-[var(--radius-lg)] border',
                    rec.type === 'positive' ? 'bg-[var(--primary-pale)] border-[var(--primary)]/20'
                    : rec.type === 'negative' ? 'bg-[var(--negative-bg)] border-[var(--negative)]/20'
                    : 'bg-[var(--canvas-soft)] border-[var(--border)]'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {rec.type === 'positive' ? (
                      <TrendingUp className="w-5 h-5 text-[var(--positive)] flex-shrink-0 mt-0.5" />
                    ) : rec.type === 'negative' ? (
                      <AlertCircle className="w-5 h-5 text-[var(--negative)] flex-shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className="text-sm font-[800] text-[var(--ink)] mb-1">{rec.title}</h3>
                      <p className="text-xs text-[var(--body)] mb-2">{rec.description}</p>
                      {rec.action && (
                        <p className="text-xs font-semibold text-[var(--primary)]">💡 {rec.action}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
