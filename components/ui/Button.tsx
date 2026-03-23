'use client'
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-[0.75rem] transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed',
          variant === 'primary' && 'bg-secondary text-on-secondary hover:brightness-110 active:brightness-90',
          variant === 'secondary' && 'bg-surface-container-high text-primary hover:bg-surface-container-highest',
          variant === 'tertiary' && 'bg-transparent text-primary font-bold hover:bg-surface-container-low',
          variant === 'ghost' && 'bg-transparent text-on-surface-variant hover:bg-surface-container-low',
          variant === 'danger' && 'bg-error-container text-error hover:brightness-110',
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2 text-sm',
          size === 'lg' && 'px-6 py-3 text-base',
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
