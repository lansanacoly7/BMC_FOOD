import { type ReactNode, forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'gold' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children?: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  // Orange braise officiel (Page 6 & 16) : contraste WCAG 4.5:1 certifié avec texte blanc
  primary:
    'bg-bmc-orange-braise text-white hover:bg-orange-700 active:bg-orange-800 focus-visible:outline-bmc-orange-deep shadow-sm',
  // Charbon sombre
  secondary:
    'bg-bmc-charcoal text-white hover:bg-zinc-800 active:bg-zinc-900 focus-visible:outline-bmc-charcoal shadow-sm',
  // Or officiel du logo : pour promotions, Plat du Jour et mises en avant
  gold:
    'bg-bmc-gold text-bmc-black font-bold hover:brightness-105 active:brightness-95 focus-visible:outline-bmc-gold shadow-sm',
  // Contour sobre
  outline:
    'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 active:bg-zinc-100 focus-visible:outline-zinc-400',
  // Ghost minimaliste
  ghost:
    'bg-transparent text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 focus-visible:outline-zinc-400',
  // Erreur / Danger
  danger:
    'bg-bmc-error text-white hover:bg-red-700 active:bg-red-800 focus-visible:outline-bmc-error shadow-sm',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-sm font-semibold gap-2 rounded-xl',
  lg: 'h-13 px-6 text-base font-semibold gap-2.5 rounded-xl',
  icon: 'h-10 w-10 p-0 rounded-xl justify-center',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    children,
    className = '',
    type = 'button',
    ...props
  },
  ref,
) {
  const isDisabled = disabled || isLoading

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading}
      aria-disabled={isDisabled}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.12 }}
      className={`inline-flex items-center justify-center font-medium transition-colors select-none
        focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50
        cursor-pointer disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="size-4 animate-spin shrink-0" aria-hidden="true" />
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  )
})
