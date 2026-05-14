'use client'

import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none touch-manipulation'

    const variants: Record<string, string> = {
      primary: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] rounded-[var(--radius-xl)]',
      secondary: 'bg-[var(--canvas-soft)] text-[var(--ink)] hover:opacity-85 rounded-[var(--radius-xl)]',
      outline: 'bg-[var(--canvas)] text-[var(--ink)] border border-[var(--border-strong)] hover:bg-[var(--canvas-soft)] rounded-[var(--radius-xl)]',
      ghost: 'text-[var(--ink)] hover:bg-[var(--canvas-soft)] rounded-[var(--radius-md)]',
      icon: 'bg-[var(--canvas)] text-[var(--ink)] hover:bg-[var(--canvas-soft)] rounded-[var(--radius-full)]',
    }

    const sizes: Record<string, string> = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-12 px-6 text-base',
      lg: 'h-14 px-8 text-lg',
    }

    const iconSize = variant === 'icon' ? 'h-10 w-10 p-0' : ''

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], variant !== 'icon' && sizes[size], iconSize, className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button }
export type { ButtonProps }
