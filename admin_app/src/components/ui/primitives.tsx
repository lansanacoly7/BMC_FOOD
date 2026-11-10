import React, { useEffect } from 'react'
import { AlertCircle, Check, Loader2, Search, X, type LucideIcon } from 'lucide-react'
import { buttonClass, fieldClass, type ButtonSize, type ButtonVariant } from './styles'

/* ─── Actions ─────────────────────────────────────────────────────────── */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  isLoading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  isLoading = false,
  className = '',
  children,
  type = 'button',
  disabled,
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled || isLoading}
    className={`${buttonClass(variant, size)} ${className}`}
    {...rest}
  >
    {isLoading ? <Loader2 className="size-4 animate-spin" /> : Icon && <Icon className="size-4" />}
    {children}
  </button>
)

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  label: string
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  label,
  className = '',
  ...rest
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={`inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-raised hover:text-ink ${className}`}
    {...rest}
  >
    <Icon className="size-[18px]" />
  </button>
)

/* ─── Mise en page ────────────────────────────────────────────────────── */

export const PageBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex-1 overflow-y-auto bg-canvas text-left text-ink">
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">{children}</div>
  </div>
)

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <section className={`rounded-xl border border-line bg-surface ${className}`}>{children}</section>
)

/** Barre d'outils posée en tête d'une carte : filtres à gauche, recherche et actions à droite. */
export const Toolbar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">{children}</div>
)

interface StatProps {
  label: string
  value: React.ReactNode
  hint?: string
}

export const Stat: React.FC<StatProps> = ({ label, value, hint }) => (
  <Card className="px-4 py-3.5">
    <p className="text-[13px] text-ink-soft">{label}</p>
    <p className="mt-1 font-display text-2xl font-bold tabular-nums text-ink">{value}</p>
    {hint && <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>}
  </Card>
)

export const StatGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>
)

/* ─── Tableaux ────────────────────────────────────────────────────────── */

export const Table: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <table className="w-full text-left text-sm">{children}</table>
)

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <th
    scope="col"
    className={`whitespace-nowrap bg-raised/60 px-4 py-2.5 text-xs font-semibold text-ink-soft ${className}`}
    {...rest}
  >
    {children}
  </th>
)

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <td className={`px-4 py-3 align-middle ${className}`} {...rest}>
    {children}
  </td>
)

export const Tr: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <tr className={`border-t border-line transition-colors hover:bg-raised/50 ${className}`} {...rest}>
    {children}
  </tr>
)

/* ─── Statuts et filtres ──────────────────────────────────────────────── */

export type BadgeTone = 'neutral' | 'gold' | 'ok' | 'warn' | 'bad'

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-raised text-ink-soft',
  gold: 'bg-gold-soft text-ink',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
}

export const Badge: React.FC<{
  tone?: BadgeTone
  icon?: LucideIcon
  children: React.ReactNode
}> = ({ tone = 'neutral', icon: Icon, children }) => (
  <span
    className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${BADGE_TONES[tone]}`}
  >
    {Icon && <Icon className="size-3" />}
    {children}
  </span>
)

export interface SegmentOption<T extends string> {
  id: T
  label: string
  count?: number
  icon?: LucideIcon
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  /** Sous cette largeur, seules l'icône et le compteur restent affichés. */
  labelClassName?: string
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  labelClassName = '',
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="scrollbar-none inline-flex max-w-full shrink-0 items-center gap-0.5 overflow-x-auto rounded-lg bg-raised p-1"
    >
      {options.map((option) => {
        const isActive = option.id === value
        const Icon = option.icon
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isActive}
            title={option.label}
            onClick={() => onChange(option.id)}
            className={`flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[13px] font-medium transition-colors ${
              isActive ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {Icon && <Icon className="size-3.5" />}
            <span className={Icon ? labelClassName : ''}>{option.label}</span>
            {option.count !== undefined && (
              <span className="text-xs tabular-nums text-ink-faint">{option.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Formulaires ─────────────────────────────────────────────────────── */

export const Field: React.FC<{
  label: string
  htmlFor: string
  children: React.ReactNode
}> = ({ label, htmlFor, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink">
      {label}
    </label>
    {children}
  </div>
)

export const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = '',
  ...rest
}) => <input className={`${fieldClass} h-10 ${className}`} {...rest} />

export const SelectInput: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <select className={`${fieldClass} h-10 cursor-pointer ${className}`} {...rest}>
    {children}
  </select>
)

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className = '',
  ...rest
}) => <textarea className={`${fieldClass} py-2 ${className}`} {...rest} />

export const SearchInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { wrapperClassName?: string }
> = ({ wrapperClassName = '', className = '', ...rest }) => (
  <div className={`relative ${wrapperClassName}`}>
    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
    <input type="search" className={`${fieldClass} h-10 pl-9 ${className}`} {...rest} />
  </div>
)

/* ─── Retours d'état ──────────────────────────────────────────────────── */

export const EmptyBlock: React.FC<{
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}> = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center px-6 py-14 text-center">
    <span className="flex size-11 items-center justify-center rounded-full bg-raised text-ink-soft">
      <Icon className="size-5" />
    </span>
    <p className="mt-3 font-display text-base font-semibold text-ink">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

export interface NoticeState {
  message: string
  type: 'success' | 'error'
}

export const Notice: React.FC<{ notice: NoticeState | null }> = ({ notice }) => {
  if (!notice) return null
  const isSuccess = notice.type === 'success'
  const Icon = isSuccess ? Check : AlertCircle
  return (
    <div
      role="status"
      className="fixed right-5 top-5 z-[60] flex max-w-sm items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-3 text-sm font-medium text-ink shadow-lg"
    >
      <Icon className={`size-4 shrink-0 ${isSuccess ? 'text-ok' : 'text-bad'}`} />
      <span>{notice.message}</span>
    </div>
  )
}

/* ─── Fenêtres ────────────────────────────────────────────────────────── */

interface ModalProps {
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const MODAL_SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

export const Modal: React.FC<ModalProps> = ({
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-full w-full flex-col overflow-hidden rounded-2xl bg-surface text-left text-ink shadow-2xl ${MODAL_SIZES[size]}`}
      >
        <header className="flex items-start justify-between gap-4 px-6 pb-3 pt-5">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
          </div>
          <IconButton icon={X} label="Fermer" onClick={onClose} className="-mr-2 -mt-1" />
        </header>
        <div className="overflow-y-auto px-6 pb-5 pt-1">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-2 border-t border-line bg-canvas px-6 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}

/* ─── Catalogue ───────────────────────────────────────────────────────── */

export const FALLBACK_DISH_IMAGE = '/images/products/tacos-viande-pane.webp'

export const DishCell: React.FC<{
  name: string
  imageUrl?: string
  meta?: string
}> = ({ name, imageUrl, meta }) => (
  <div className="flex min-w-0 items-center gap-3">
    <img
      src={imageUrl || FALLBACK_DISH_IMAGE}
      alt=""
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src = FALLBACK_DISH_IMAGE
      }}
      className="size-11 shrink-0 rounded-lg bg-raised object-cover"
    />
    <div className="min-w-0">
      <p className="truncate font-semibold text-ink">{name}</p>
      {meta && <p className="truncate text-xs text-ink-faint">{meta}</p>}
    </div>
  </div>
)
