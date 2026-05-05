'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { AllMatchesCard } from './all-matches-card'
import { Match } from '@/lib/types'

interface VirtualizedMatchesListProps {
  matches: Match[]
}

export function VirtualizedMatchesList({ matches }: VirtualizedMatchesListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: matches.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Примерная высота карточки матча
    overscan: 5, // Рендерим 5 дополнительных элементов сверху и снизу
  })

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-12rem)] overflow-auto"
      style={{
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const match = matches[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <AllMatchesCard match={match} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
