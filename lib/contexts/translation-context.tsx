'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface TranslationContextType {
  translateEnabled: boolean
  toggleTranslation: () => void
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [translateEnabled, setTranslateEnabled] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedSetting = localStorage.getItem('translateEnabled')
    if (savedSetting !== null) {
      setTranslateEnabled(savedSetting === 'true')
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('translateEnabled', translateEnabled.toString())
    }
  }, [translateEnabled, mounted])

  const toggleTranslation = () => {
    setTranslateEnabled(prev => !prev)
  }

  return (
    <TranslationContext.Provider value={{ translateEnabled, toggleTranslation }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider')
  }
  return context
}
