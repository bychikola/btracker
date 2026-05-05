'use client'

import { useBetStatistics, useSportStatistics, useLeagueStatistics, useProfitOverTime, useBettingTrends, useBettingRecommendations } from '@/lib/hooks/useStatistics'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Target, Award, Activity, Lightbulb, AlertCircle, Info } from 'lucide-react'
import { Skeleton } from '@/components/skeleton'

const COLORS = ['#00e676', '#e63946', '#ffd60a', '#06ffa5', '#4361ee', '#f72585']

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: any
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="bg-card-bg rounded-xl p-6 border border-border">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-accent/10 rounded-lg">
          <Icon className="w-6 h-6 text-accent" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-text-secondary'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
      <p className="text-sm text-text-secondary">{title}</p>
      {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card-bg rounded-xl p-6 border border-border">
            <Skeleton className="h-12 w-12 rounded-lg mb-4" />
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
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
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">Статистика</h1>
        <StatsSkeleton />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">Статистика</h1>
        <div className="bg-card-bg rounded-xl p-8 text-center border border-border">
          <p className="text-text-secondary">Нет данных для отображения статистики</p>
          <p className="text-sm text-text-secondary mt-2">Сделайте несколько ставок, чтобы увидеть аналитику</p>
        </div>
      </div>
    )
  }

  const profitTrend = stats.totalProfit > 0 ? 'up' : stats.totalProfit < 0 ? 'down' : 'neutral'
  const roiTrend = stats.roi > 0 ? 'up' : stats.roi < 0 ? 'down' : 'neutral'

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Статистика</h1>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card-bg rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-green-500" />
            <span className="text-sm text-text-secondary">Самая большая победа</span>
          </div>
          <p className="text-xl font-bold text-green-500">+{stats.biggestWin.toFixed(0)} ₽</p>
        </div>
        <div className="bg-card-bg rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <span className="text-sm text-text-secondary">Самое большое поражение</span>
          </div>
          <p className="text-xl font-bold text-red-500">-{stats.biggestLoss.toFixed(0)} ₽</p>
        </div>
        <div className="bg-card-bg rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-accent" />
            <span className="text-sm text-text-secondary">Всего ставок</span>
          </div>
          <p className="text-xl font-bold text-foreground">{stats.totalBets}</p>
        </div>
      </div>

      {/* График прибыли */}
      {profitData && profitData.length > 0 && (
        <div className="bg-card-bg rounded-xl p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Динамика прибыли</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                stroke="var(--text-secondary)"
                tick={{ fill: 'var(--text-secondary)' }}
              />
              <YAxis
                stroke="var(--text-secondary)"
                tick={{ fill: 'var(--text-secondary)' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="cumulativeProfit"
                stroke="var(--accent)"
                strokeWidth={2}
                name="Накопительная прибыль"
                dot={{ fill: 'var(--accent)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Статистика по видам спорта */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sportStats && sportStats.length > 0 && (
          <div className="bg-card-bg rounded-xl p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">По видам спорта</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sportStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="sport_type"
                  stroke="var(--text-secondary)"
                  tick={{ fill: 'var(--text-secondary)' }}
                />
                <YAxis
                  stroke="var(--text-secondary)"
                  tick={{ fill: 'var(--text-secondary)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="roi" fill="var(--accent)" name="ROI %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Топ лиги */}
        {leagueStats && leagueStats.length > 0 && (
          <div className="bg-card-bg rounded-xl p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">Топ лиги</h2>
            <div className="space-y-3">
              {leagueStats.slice(0, 5).map((league, index) => (
                <div key={league.league_name} className="flex items-center justify-between p-3 bg-card-hover rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-accent">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{league.league_name}</p>
                      <p className="text-xs text-text-secondary">{league.totalBets} ставок</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${league.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {league.roi >= 0 ? '+' : ''}{league.roi.toFixed(1)}%
                    </p>
                    <p className="text-xs text-text-secondary">{league.winRate.toFixed(0)}% WR</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Тренды */}
      {trends && trends.length > 0 && (
        <div className="bg-card-bg rounded-xl p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Тренды</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trends.map((trend, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  trend.type === 'success'
                    ? 'bg-green-500/10 border-green-500/20'
                    : trend.type === 'warning'
                    ? 'bg-yellow-500/10 border-yellow-500/20'
                    : 'bg-blue-500/10 border-blue-500/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{trend.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground mb-1">{trend.title}</h3>
                    <p className="text-xs text-text-secondary">{trend.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Рекомендации */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-card-bg rounded-xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-bold text-foreground">Рекомендации</h2>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  rec.type === 'positive'
                    ? 'bg-green-500/10 border-green-500/20'
                    : rec.type === 'negative'
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-card-hover border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  {rec.type === 'positive' ? (
                    <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : rec.type === 'negative' ? (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground mb-1">{rec.title}</h3>
                    <p className="text-xs text-text-secondary mb-2">{rec.description}</p>
                    {rec.action && (
                      <p className="text-xs font-medium text-accent">💡 {rec.action}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
