import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    id,
    disabled = false,
    className = '',
    ...props
  },
  ref,
) {
  const inputId = id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)
  const errorId = error && inputId ? `${inputId}-error` : undefined
  const helperId = helperText && inputId ? `${inputId}-helper` : undefined

  return (
    <div className="flex w-full flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-zinc-800">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="pointer-events-none absolute left-3.5 flex items-center text-zinc-400">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId ?? helperId}
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-zinc-900 transition-colors
            placeholder:text-zinc-400
            focus:border-bmc-gold focus:outline-none focus:ring-2 focus:ring-bmc-gold/20
            disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${
              error
                ? 'border-bmc-error focus:border-bmc-error focus:ring-bmc-error/20'
                : 'border-zinc-300 hover:border-zinc-400'
            }
            ${className}`}
          {...props}
        />

        {rightIcon && (
          <div className="pointer-events-none absolute right-3.5 flex items-center text-zinc-400">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <div id={errorId} role="alert" className="flex items-center gap-1.5 text-xs font-medium text-bmc-error">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-zinc-500">
          {helperText}
        </p>
      ) : null}
    </div>
  )
})
