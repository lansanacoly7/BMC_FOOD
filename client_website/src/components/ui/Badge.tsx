import { type HTMLAttributes, type ReactNode } from 'react'

export type BadgeVariant =
  | 'gold'
  | 'orange'
  | 'success'
  | 'error'
  | 'warning'
  | 'neutral'
  | 'outline'
  | 'wave'
  | 'om'

export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: ReactNode
  children: ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  // Or officiel du logo : Plat du Jour, best-sellers
  gold: 'bg-bmc-gold text-bmc-black font-bold shadow-xs',
  // Or / Jaune officiel
  orange: 'bg-bmc-gold text-black font-bold shadow-xs',
  // Succès
  success: 'bg-green-100 text-green-800 border border-green-200 font-semibold',
  // Erreur
  error: 'bg-red-100 text-red-800 border border-red-200 font-semibold',
  // Avertissement / En attente
  warning: 'bg-amber-100 text-amber-900 border border-amber-200 font-semibold',
  // Neutre charbon
  neutral: 'bg-zinc-800 text-zinc-100 font-medium',
  // Outline
  outline: 'border border-zinc-300 text-zinc-700 bg-white font-medium',
  // Moyens de paiement Sénégal
  wave: 'bg-[#1DC8F2] text-zinc-950 font-bold',
  om: 'bg-[#FF7900] text-white font-bold',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
}

export function Badge({
  variant = 'gold',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full tracking-wide select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}
