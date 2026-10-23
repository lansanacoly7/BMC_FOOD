import { type ReactNode } from 'react'
import { UtensilsCrossed } from 'lucide-react'
import { Button } from './Button'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center ${className}`}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-white shadow-xs text-zinc-400 mb-3.5">
        {icon ?? <UtensilsCrossed className="size-6 text-zinc-400" aria-hidden="true" />}
      </div>

      <h3 className="font-display text-base font-bold text-zinc-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-zinc-500 leading-relaxed">{description}</p>
      )}

      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
