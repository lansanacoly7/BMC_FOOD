import React from 'react'
import { ArrowRight, Bike, MessageSquare, ShoppingBag, Utensils } from 'lucide-react'
import type { KdsOrder, KdsOrderStatus, OrderType } from '../../types/kds'
import { getTicketAction } from './ticketAction'

const TYPE_ICONS: Record<OrderType, { label: string; icon: React.FC<{ className?: string }> }> = {
  delivery: { label: 'Livraison', icon: Bike },
  takeaway: { label: 'À emporter', icon: ShoppingBag },
  dine_in: { label: 'Sur place', icon: Utensils },
}

interface CompactTicketProps {
  order: KdsOrder
  durationText: string
  isOverdue: boolean
  onExpand: () => void
  onTransition: (orderRef: string, nextStatus: KdsOrderStatus) => void
}

/** Ticket réduit à deux lignes, affiché quand une colonne déborde. Toucher la ligne le déplie. */
export const CompactTicket: React.FC<CompactTicketProps> = ({
  order,
  durationText,
  isOverdue,
  onExpand,
  onTransition,
}) => {
  const action = getTicketAction(order)
  const type = TYPE_ICONS[order.orderType] || TYPE_ICONS.delivery
  const TypeIcon = type.icon
  const summary = order.items.map((item) => `${item.quantity}× ${item.name}`).join(' · ')
  // Une consigne (allergie, sans oignons) doit rester visible même réduite.
  const hasNote = Boolean(order.notes) || order.items.some((item) => item.notes)

  return (
    <article className="flex min-h-[60px] select-none items-center gap-1 rounded-lg border border-line bg-surface p-1.5 text-left">
      <button
        type="button"
        onClick={onExpand}
        aria-expanded={false}
        aria-label={`Déplier la commande ${order.orderRef}`}
        className="min-w-0 flex-1 cursor-pointer rounded-md px-1.5 py-0.5 text-left transition-colors hover:bg-raised/60"
      >
        <span className="flex items-center gap-1.5">
          <span className="font-display text-base font-bold tabular-nums text-ink">
            #{order.orderRef.replace(/^#?BMC-?/, '')}
          </span>
          <span title={type.label} className="text-ink-soft">
            <TypeIcon className="size-3.5" />
          </span>
          {hasNote && (
            <span title="Consigne à lire" className="text-bmc-gold">
              <MessageSquare className="size-3.5" />
            </span>
          )}
          <span
            className={`ml-auto text-sm font-semibold tabular-nums ${isOverdue ? 'text-bad' : 'text-ink-soft'}`}
          >
            {durationText}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-ink-soft">{summary}</span>
      </button>

      {/* Zone tactile de 44 px : l'étape suivante reste à un seul clic */}
      <button
        type="button"
        onClick={() => onTransition(order.orderRef, action.nextStatus)}
        aria-label={`${action.label} : commande ${order.orderRef}`}
        title={action.label}
        className={`flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors active:scale-[0.97] ${
          action.isHandover
            ? 'bg-raised text-ink hover:bg-[#34343A]'
            : 'bg-bmc-gold text-bmc-charcoal hover:bg-[#E5A700]'
        }`}
      >
        <ArrowRight className="size-5" />
      </button>
    </article>
  )
}
