'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BannerCarousel } from '@/components/banner-carousel'
import { SportFilter } from '@/components/sport-filter'
import { TodayMatchesGrid } from '@/components/today-matches-grid'
import { LiveMatchesCarousel } from '@/components/live-matches-carousel'
import { mockBanners } from '@/lib/mock-data'

export default function Home() {
  const [selectedSport, setSelectedSport] = useState('all')
  const [showLiveOnly, setShowLiveOnly] = useState(false)

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Карусель баннеров */}
        <section>
          <BannerCarousel banners={mockBanners} />
        </section>

        {/* Live матчи карусель */}
        <LiveMatchesCarousel />

        {/* Заголовок с переключателем Live */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Топ</h2>
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
  )
}

