import { cn } from '@/lib/utils'
import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'sage' | 'dark' | 'green'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'lg', children, ...props }, ref) => {
    const variants: Record<string, string> = {
      default: 'bg-[var(--canvas)] text-[var(--ink)]',
      sage: 'bg-[var(--canvas-soft)] text-[var(--ink)]',
      dark: 'bg-[var(--ink)] text-[var(--primary)]',
      green: 'bg-[var(--primary-pale)] text-[var(--ink)]',
    }

    const paddings: Record<string, string> = {
      none: 'p-0',
      sm: 'p-3 sm:p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[var(--radius-xl)]',
          variants[variant],
          paddings[padding],
          variant === 'default' && 'shadow-[var(--shadow-card)]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)} {...props} />
}

function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-2xl font-[800] tracking-tight', className)} {...props} />
}

function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-[var(--body)]', className)} {...props} />
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent }
export type { CardProps }
