'use client'

import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BetSlip } from './bet-slip'

interface BetSlipModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BetSlipModal({ isOpen, onClose }: BetSlipModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal - выдвигается снизу на мобильных, справа на планшетах */}
          <motion.div
            initial={{ y: '100%', x: 0 }}
            animate={{ y: 0, x: 0 }}
            exit={{ y: '100%', x: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 md:right-0 md:left-auto md:top-0 md:bottom-0 w-full md:max-w-sm bg-card-bg shadow-xl rounded-t-2xl md:rounded-none"
            style={{ maxHeight: '85vh' }}
          >
            {/* Drag handle для мобильных */}
            <div className="md:hidden flex justify-center pt-2 pb-1">
              <div className="w-12 h-1 bg-border rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Купон</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-card-hover rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BetSlip content */}
            <div className="h-[calc(100%-73px)]">
              <BetSlip className="h-full" isModal={true} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
