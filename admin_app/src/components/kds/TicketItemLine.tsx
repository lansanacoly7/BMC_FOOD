import React from 'react'
import { CircleAlert } from 'lucide-react'
import type { KdsOrderItem } from '../../types/kds'

interface TicketItemLineProps {
  item: KdsOrderItem
  index: number
  isDone: boolean
  onToggleDone: (index: number) => void
}

export const TicketItemLine: React.FC<TicketItemLineProps> = ({
  item,
  index,
  isDone,
  onToggleDone,
}) => {
  return (
    <div
      onClick={() => onToggleDone(index)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onToggleDone(index)
        }
      }}
      role="button"
      aria-pressed={isDone}
      tabIndex={0}
      title="Toucher pour rayer ce plat"
      className={`flex cursor-pointer select-none gap-2 rounded-lg px-1.5 py-1.5 transition-colors ${
        isDone ? 'opacity-45' : 'hover:bg-raised/60'
      }`}
    >
      <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-raised px-1 text-[13px] font-bold tabular-nums text-ink">
        {item.quantity}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={`line-clamp-2 break-words text-base font-semibold leading-6 text-ink ${
            isDone ? 'line-through' : ''
          }`}
        >
          {item.name}
        </p>

        {item.options && item.options.length > 0 && (
          <p className={`line-clamp-2 break-words text-[13px] leading-snug text-ink-soft ${isDone ? 'line-through' : ''}`}>
            {item.options.join(' · ')}
          </p>
        )}

        {item.notes && (
          <p
            className={`mt-0.5 flex items-start gap-1.5 text-sm font-semibold leading-snug text-ink ${
              isDone ? 'line-through' : ''
            }`}
          >
            <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-bmc-gold" />
            <span className="line-clamp-2 break-words">{item.notes}</span>
          </p>
        )}
      </div>
    </div>
  )
}
