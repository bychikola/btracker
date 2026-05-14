import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-[var(--ink)] mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'wise-input',
            error && 'border-[var(--negative)] focus:border-[var(--negative)] focus:ring-red-500/15',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm font-medium text-[var(--negative)]">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-sm text-[var(--mute)]">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export { Input }
export type { InputProps }
