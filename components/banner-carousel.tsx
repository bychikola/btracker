'use client'

import { Banner } from '@/lib/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useLiveMatches } from '@/lib/hooks/useSstatsMatches'

interface BannerCarouselProps {
  banners: Banner[]
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const { data: liveMatchesData } = useLiveMatches()

  console.log('Live matches count:', liveMatchesData?.matches?.length)

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 sm:gap-4 snap-x snap-mandatory pb-2">
        {banners.map((banner) => {
          // Для Live баннера показываем реальное количество матчей
          const eventCount = banner.id === '1' && liveMatchesData?.matches
            ? liveMatchesData.matches.length
            : banner.event_count

          const content = (
            <div
              className={cn(
                'relative h-32 sm:h-40 rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-105 active:scale-100 touch-manipulation',
                'bg-gradient-to-br',
                banner.gradient || 'from-gray-600 to-gray-800'
              )}
            >
              <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">{banner.icon}</div>
                    <h3 className="text-lg sm:text-2xl font-bold text-white">{banner.title}</h3>
                    {banner.subtitle && (
                      <p className="text-white/80 text-xs sm:text-sm mt-0.5 sm:mt-1">
                        {banner.id === '1' && eventCount !== undefined
                          ? `${banner.subtitle} (${eventCount} ${eventCount === 1 ? 'матч' : eventCount < 5 ? 'матча' : 'матчей'})`
                          : banner.subtitle
                        }
                      </p>
                    )}
                  </div>
                </div>
                {eventCount !== undefined && banner.id !== '1' && (
                  <div className="text-white/90 text-xs sm:text-sm font-medium">
                    {eventCount} {eventCount === 1 ? 'событие' : eventCount < 5 ? 'события' : 'событий'}
                  </div>
                )}
              </div>
            </div>
          )

          // Если у баннера есть ссылка, оборачиваем в Link
          if (banner.link) {
            return (
              <Link
                key={banner.id}
                href={banner.link}
                className="flex-none w-72 snap-start"
              >
                {content}
              </Link>
            )
          }

          return (
            <div key={banner.id} className="flex-none w-72 snap-start">
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
