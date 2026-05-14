import { cn } from '@/lib/utils'
import { HTMLAttributes, forwardRef } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'positive' | 'negative' | 'warning' | 'neutral' | 'live'
  size?: 'sm' | 'md'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', size = 'md', children, ...props }, ref) => {
    const variants: Record<string, string> = {
      positive: 'bg-[var(--primary-pale)] text-[var(--positive-deep)]',
      negative: 'bg-[var(--negative-bg)] text-[var(--negative)]',
      warning: 'bg-yellow-500/10 text-[var(--warning-deep)]',
      neutral: 'bg-[var(--canvas-soft)] text-[var(--body)]',
      live: 'bg-[var(--primary)] text-[var(--primary-foreground)] animate-pulse-glow',
    }

    const sizes: Record<string, string> = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 font-semibold rounded-[var(--radius-pill)]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {variant === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-foreground)]" />}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
export { Badge }
export type { BadgeProps }
