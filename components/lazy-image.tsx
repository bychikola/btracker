'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface LazyImageProps {
  src?: string
  alt: string
  className?: string
  fallback?: string
}

export function LazyImage({ src, alt, className, fallback = '/team-placeholder.png' }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Начинаем загрузку за 50px до появления в viewport
      }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [])

  const imageSrc = src || fallback

  return (
    <div ref={imgRef} className={className}>
      {isInView ? (
        <Image
          src={imageSrc}
          alt={alt}
          width={32}
          height={32}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            // Fallback при ошибке загрузки
            const target = e.target as HTMLImageElement
            target.src = fallback
          }}
        />
      ) : (
        <div className="w-8 h-8 bg-card-hover rounded animate-pulse" />
      )}
    </div>
  )
}
