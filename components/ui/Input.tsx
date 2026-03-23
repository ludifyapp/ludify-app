import { InputHTMLAttributes, ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold text-on-surface-variant">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-[0.75rem] text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 bg-surface-container-high text-on-surface placeholder:text-on-surface-variant/50 ghost-border',
            error
              ? 'bg-error-container/20 border border-error/30'
              : '',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
