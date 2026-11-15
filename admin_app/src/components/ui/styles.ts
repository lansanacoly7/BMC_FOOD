export type ButtonVariant = 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  // Or officiel BMC Food : action principale jaune dorée, texte sombre et contraste maximal
  primary: 'bg-bmc-gold text-bmc-charcoal hover:bg-[#E5A700] font-bold shadow-sm',
  gold: 'bg-bmc-gold text-bmc-charcoal hover:bg-[#E5A700]',
  secondary: 'border border-line bg-surface text-ink hover:bg-raised',
  ghost: 'text-ink-soft hover:bg-raised hover:text-ink',
  danger: 'text-bad hover:bg-bad-soft',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-md px-3 text-[13px]',
  md: 'h-10 gap-2 rounded-lg px-4 text-sm',
  lg: 'h-12 gap-2 rounded-lg px-5 text-[15px]',
}

export const buttonClass = (variant: ButtonVariant = 'secondary', size: ButtonSize = 'md') =>
  `inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap font-display font-semibold transition-colors active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]}`

export const fieldClass =
  'w-full rounded-lg border border-field bg-surface px-3 text-sm text-ink placeholder:text-ink-faint transition-shadow focus:border-bmc-gold focus:outline-none focus:ring-2 focus:ring-bmc-gold/20'
