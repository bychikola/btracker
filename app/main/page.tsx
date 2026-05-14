'use client'

import { useState } from 'react'
import { BannerCarousel } from '@/components/banner-carousel'
import { SportFilter } from '@/components/sport-filter'
import { TodayMatchesGrid } from '@/components/today-matches-grid'
import { LiveMatchesCarousel } from '@/components/live-matches-carousel'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNavigation } from '@/components/bottom-navigation'
import { mockBanners } from '@/lib/mock-data'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export default function MainPage() {
  const [selectedSport, setSelectedSport] = useState('football')
  const [showLiveOnly, setShowLiveOnly] = useState(false)
  const queryClient = useQueryClient()

  const handleRefresh = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['matches'] })
      toast.success('Обновлено', { icon: '✅', duration: 2000 })
    } catch (error) {
      toast.error('Ошибка обновления', { icon: '❌' })
    }
  }

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="bg-background min-h-screen pb-20 md:pb-6">
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Карусель баннеров */}
            <section>
              <BannerCarousel banners={mockBanners} />
            </section>

            {/* Live матчи карусель */}
            <section>
              <LiveMatchesCarousel />
            </section>

            {/* Заголовок и фильтр */}
            <section>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Топ матчи</h2>
              </div>

              {/* Фильтр по видам спорта */}
              <SportFilter selected={selectedSport} onChange={setSelectedSport} />
            </section>

            {/* Сетка матчей */}
            <section>
              <TodayMatchesGrid
                limit={50}
                showLiveOnly={showLiveOnly}
                sportType={selectedSport}
              />
            </section>
          </div>
        </div>
      </PullToRefresh>

      {/* Нижнее меню для мобильных */}
      <BottomNavigation />
    </>
  )
}
