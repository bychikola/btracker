'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  disabled?: boolean
}

export function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [canPull, setCanPull] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)

  // Трансформируем значение y в прогресс (0-1)
  const progress = useTransform(y, [0, 80], [0, 1])

  // Вращение иконки
  const rotate = useTransform(progress, [0, 1], [0, 180])

  // Opacity иконки
  const opacity = useTransform(progress, [0, 0.5, 1], [0, 0.5, 1])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      // Разрешаем pull только если скролл в самом верху
      setCanPull(container.scrollTop === 0)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (disabled || isRefreshing || !canPull) {
      y.set(0)
      return
    }

    // Если потянули достаточно далеко (больше 80px)
    if (info.offset.y > 80) {
      setIsRefreshing(true)

      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh error:', error)
      } finally {
        setIsRefreshing(false)
        y.set(0)
      }
    } else {
      y.set(0)
    }
  }

  return (
    <div ref={containerRef} className="relative h-full overflow-y-auto">
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-10"
        style={{
          height: y,
          opacity,
        }}
      >
        <motion.div
          className="bg-card-bg/90 backdrop-blur-sm rounded-full p-3 shadow-lg"
          style={{ rotate }}
        >
          <RefreshCw
            className={`w-5 h-5 text-accent ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </motion.div>
      </motion.div>

      {/* Draggable content */}
      <motion.div
        drag={canPull && !disabled && !isRefreshing ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </div>
  )
}
