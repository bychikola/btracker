'use client'

import { useRef, useState, useCallback } from 'react'
import { Share2, Download, Copy, Check, X } from 'lucide-react'
import { BetSlipWithItems, BET_OUTCOME_LABELS, BET_TYPE_LABELS, BET_SLIP_STATUS_LABELS } from '@/lib/types/bet-slip'
import { translateTeam, translateLeague } from '@/lib/translations'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface BetSlipShareProps {
  betSlip: BetSlipWithItems
  translateEnabled: boolean
}

export function BetSlipShare({ betSlip, translateEnabled }: BetSlipShareProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const infographicRef = useRef<HTMLDivElement>(null)

  const generateImage = useCallback(async () => {
    if (!infographicRef.current) return
    setIsGenerating(true)

    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(infographicRef.current, {
        backgroundColor: '#0e0f0c',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      setImageUrl(canvas.toDataURL('image/png'))
    } catch (error) {
      console.error('Error generating image:', error)
      toast.error('Ошибка при создании изображения')
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const handleOpen = () => {
    setIsOpen(true)
    // Генерируем с небольшой задержкой чтобы DOM отрендерился
    setTimeout(generateImage, 300)
  }

  const handleShare = async () => {
    if (!imageUrl) return

    // Web Share API
    if (navigator.share && navigator.canShare) {
      try {
        const blob = await (await fetch(imageUrl)).blob()
        const file = new File([blob], `ставка-${betSlip.id}.png`, { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Моя ставка | bTracker',
            text: `Ставка: ${BET_TYPE_LABELS[betSlip.bet_type]} • Коэф: ${betSlip.total_odds.toFixed(2)} • Сумма: ${betSlip.stake_amount.toFixed(0)} ₽`,
            files: [file],
          })
          return
        }
      } catch (e) {
        // fallback to download
      }
    }

    // Fallback — скачиваем
    downloadImage()
  }

  const downloadImage = () => {
    if (!imageUrl) return
    const link = document.createElement('a')
    link.download = `bTracker-${betSlip.id.slice(0, 8)}.png`
    link.href = imageUrl
    link.click()
    toast.success('Изображение сохранено')
  }

  const copyToClipboard = () => {
    if (!imageUrl) return
    // Копируем URL картинки как текст статы
    const text = `🏆 Ставка на bTracker\n⚽ ${BET_TYPE_LABELS[betSlip.bet_type]}\n📊 Коэффициент: ${betSlip.total_odds.toFixed(2)}\n💰 Сумма: ${betSlip.stake_amount.toFixed(0)} ₽\n💵 Потенциальный выигрыш: ${betSlip.potential_win.toFixed(0)} ₽\n📋 Статус: ${BET_SLIP_STATUS_LABELS[betSlip.status]}\n\nСделано в bTracker`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Текст скопирован')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) {
    return (
      <Button variant="ghost" size="sm" onClick={handleOpen}>
        <Share2 className="w-4 h-4" />
        Поделиться
      </Button>
    )
  }

  return (
    <>
      {/* Скрытый блок для рендера в canvas — ТОЛЬКО inline-стили, без Tailwind (html2canvas не понимает oklab) */}
      <div
        ref={infographicRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '600px',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          backgroundColor: '#0e0f0c',
          color: '#ffffff',
          padding: '32px',
          borderRadius: '24px',
        }}
      >
        {/* Brand header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '24px', paddingBottom: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#9fe870', letterSpacing: '-0.5px' }}>
            bTracker
          </span>
          <span style={{
            padding: '6px 16px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700,
            backgroundColor: '#9fe870', color: '#0e0f0c',
          }}>
            {BET_SLIP_STATUS_LABELS[betSlip.status].toUpperCase()}
          </span>
        </div>

        {/* Bet type & date */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '36px', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
            {BET_TYPE_LABELS[betSlip.bet_type]}
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
            {new Date(betSlip.placed_at || betSlip.created_at).toLocaleDateString('ru-RU', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </div>
        </div>

        {/* Items */}
        {betSlip.items.map((item, i) => (
          <div key={i} style={{
            backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px',
            padding: '16px', marginBottom: '12px',
          }}>
            <div style={{
              fontSize: '12px', color: 'rgba(255,255,255,0.4)',
              marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {translateLeague(item.match_data.league_name, translateEnabled)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                  {translateTeam(item.match_data.team1.name, translateEnabled)}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                  {translateTeam(item.match_data.team2.name, translateEnabled)}
                </div>
              </div>
              <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                <div style={{ color: '#9fe870', fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
                  {BET_OUTCOME_LABELS[item.bet_outcome]}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff' }}>
                  {item.odds.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Financials */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Сумма ставки</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>{betSlip.stake_amount.toFixed(0)} ₽</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Коэффициент</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#9fe870' }}>{betSlip.total_odds.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
              {betSlip.status === 'won' ? 'Выигрыш' : 'Возможный выигрыш'}
            </div>
            <div style={{
              fontSize: '22px', fontWeight: 900,
              color: betSlip.status === 'won' ? '#2ead4b' : '#ffffff',
            }}>
              {betSlip.potential_win.toFixed(0)} ₽
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '24px', paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center',
        }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Сделано в bTracker</span>
        </div>
      </div>

      {/* Модалка шеринга */}
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--ink)]/50 backdrop-blur-sm p-4" onClick={() => setIsOpen(false)}>
        <div
          className="relative w-full max-w-md bg-[var(--canvas)] rounded-[var(--radius-xl)] shadow-lg flex flex-col"
          style={{ maxHeight: '90vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Fixed header */}
          <div className="flex-shrink-0 px-6 pt-6 pb-3">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-[var(--canvas-soft)] rounded-[var(--radius-full)] transition-colors text-[var(--mute)] z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-[800] text-[var(--ink)] mb-1">Поделиться ставкой</h2>
            <p className="text-sm text-[var(--body)]">Красивая инфографика твоей ставки</p>
          </div>

          {/* Scrollable preview */}
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <div className="bg-[var(--canvas-soft)] rounded-[var(--radius-xl)] p-3">
              {isGenerating ? (
                <div className="aspect-[4/3] flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full" />
                </div>
              ) : imageUrl ? (
                <img src={imageUrl} alt="Ставка" className="w-full rounded-[var(--radius-lg)] shadow-md" />
              ) : null}
            </div>
          </div>

          {/* Fixed actions */}
          <div className="flex-shrink-0 px-6 pb-6 pt-3 border-t border-[var(--border)] flex gap-2">
            <Button variant="primary" onClick={handleShare} className="flex-1" isLoading={isGenerating}>
              <Share2 className="w-4 h-4" />
              Поделиться
            </Button>
            <Button variant="outline" onClick={downloadImage} className="flex-1" disabled={!imageUrl}>
              <Download className="w-4 h-4" />
              Сохранить
            </Button>
            <Button variant="ghost" onClick={copyToClipboard} disabled={!imageUrl}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
