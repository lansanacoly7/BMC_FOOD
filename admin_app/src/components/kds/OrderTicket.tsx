import React, { useState } from 'react'
import {
  Bike,
  ShoppingBag,
  Utensils,
  AlertTriangle,
  ArrowRight,
  ChevronUp,
  MoreHorizontal,
  Printer,
  Eye,
  XCircle,
  MessageSquare,
} from 'lucide-react'
import { formatDuration, formatFcfa, getElapsedSeconds } from '../../lib/formatters'
import { DEFAULT_KDS_THRESHOLDS, type ChronoThresholds } from '../../styles/kdsTokens'
import type { KdsOrder, KdsOrderStatus, OrderType } from '../../types/kds'
import { TicketItemLine } from './TicketItemLine'
import { getTicketAction } from './ticketAction'

interface OrderTicketProps {
  order: KdsOrder
  nowMs: number
  thresholds?: ChronoThresholds
  doneItems: number[]
  onToggleItem: (itemIndex: number) => void
  /** Présent en mode dense : replie le ticket sur sa ligne compacte. */
  onCollapse?: () => void
  onTransition: (orderRef: string, nextStatus: KdsOrderStatus) => void
  onCancel: (orderRef: string) => void
  onViewDetails: (order: KdsOrder) => void
  onPrintTicket: (order: KdsOrder) => void
}

const TYPE_CONFIG: Record<
  OrderType,
  { label: string; icon: React.FC<{ className?: string }> }
> = {
  delivery: { label: 'Livraison', icon: Bike },
  takeaway: { label: 'À emporter', icon: ShoppingBag },
  dine_in: { label: 'Sur place', icon: Utensils },
}

function extractNeighborhood(address?: string): string {
  if (!address) return ''
  const cleaned = address
    .replace(/^Position GPS\s*:\s*/i, '')
    .replace(/^Retrait sur place\s*[–-]\s*/i, '')
    .trim()
  if (cleaned.startsWith('http')) return 'GPS'
  const firstPart = cleaned.split(/[,–\-(]/)[0]?.trim()
  return firstPart || ''
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  order,
  nowMs,
  thresholds = DEFAULT_KDS_THRESHOLDS,
  doneItems,
  onToggleItem,
  onCollapse,
  onTransition,
  onCancel,
  onViewDetails,
  onPrintTicket,
}) => {
  const [showMenu, setShowMenu] = useState(false)

  const elapsedSec = getElapsedSeconds(order.createdAt, nowMs)
  // Seuil retard uniquement (15 min) : pas de jaune intermédiaire
  const isOverdue = elapsedSec >= thresholds.dangerMinutes * 60
  const durationText = formatDuration(elapsedSec)

  const typeConfig = TYPE_CONFIG[order.orderType] || TYPE_CONFIG.delivery
  const TypeIcon = typeConfig.icon

  const displayRef = order.orderRef.replace(/^#?BMC-?/, '')
  const neighborhood = order.orderType === 'delivery' ? extractNeighborhood(order.address) : ''

  const action = getTicketAction(order)

  const handleNextAction = () => {
    onTransition(order.orderRef, action.nextStatus)
  }

  const closeMenuAnd = (action: () => void) => () => {
    setShowMenu(false)
    action()
  }

  const menuItemClass =
    'flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm text-ink hover:bg-raised'

  return (
    <article
      className={`relative flex select-none flex-col rounded-xl border bg-surface text-left transition-colors ${
        isOverdue ? 'border-bad' : 'border-line'
      }`}
    >
      <div className="flex items-center gap-2 px-3 pb-1 pt-2.5">
        <span className="font-display text-xl font-bold leading-none tabular-nums text-ink">
          #{displayRef}
        </span>
        {/* Le libellé cède la place au chrono quand la colonne est étroite ; l'icône reste */}
        <span
          title={typeConfig.label}
          className="@container flex min-w-0 flex-1 items-center gap-1 text-[13px] text-ink-soft"
        >
          <TypeIcon className="size-3.5 shrink-0" />
          <span className="hidden whitespace-nowrap @[84px]:inline">{typeConfig.label}</span>
        </span>

        <div className="flex shrink-0 items-center gap-0.5">
          {isOverdue ? (
            <span
              role="alert"
              aria-label={`En retard de ${durationText}`}
              className="inline-flex items-center gap-1 px-1.5 text-sm font-bold tabular-nums text-bad"
            >
              <AlertTriangle className="size-3.5" />
              {durationText}
            </span>
          ) : (
            <span className="px-1.5 text-sm font-semibold tabular-nums text-ink-soft">
              {durationText}
            </span>
          )}

          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              aria-label="Réduire le ticket"
              title="Réduire le ticket"
              className="flex size-8 cursor-pointer items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-raised hover:text-ink"
            >
              <ChevronUp className="size-4" />
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              aria-label="Options de la commande"
              aria-expanded={showMenu}
              className="flex size-8 cursor-pointer items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-raised hover:text-ink"
            >
              <MoreHorizontal className="size-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full z-40 mt-1 w-56 rounded-lg border border-line bg-surface py-1 shadow-2xl">
                <button type="button" onClick={closeMenuAnd(() => onViewDetails(order))} className={menuItemClass}>
                  <Eye className="size-4 text-ink-soft" />
                  Voir le ticket complet
                </button>
                <button type="button" onClick={closeMenuAnd(() => onPrintTicket(order))} className={menuItemClass}>
                  <Printer className="size-4 text-ink-soft" />
                  Imprimer le ticket
                </button>
                <div className="my-1 border-t border-line" />
                <button
                  type="button"
                  onClick={closeMenuAnd(() => onCancel(order.orderRef))}
                  className={`${menuItemClass} font-medium !text-bad hover:!bg-bad-soft`}
                >
                  <XCircle className="size-4" />
                  Annuler la commande
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-3 px-3 pb-2 text-sm">
        <p className="min-w-0 truncate text-ink-soft">
          {order.customerName}
          {neighborhood && <span className="text-ink-faint"> · {neighborhood}</span>}
        </p>
        <span className="shrink-0 tabular-nums text-ink-soft">
          {formatFcfa(order.totalAmount)}
        </span>
      </div>

      {order.notes && (
        <p className="mb-1 flex items-start gap-2 px-3 text-[13px] font-medium leading-snug text-ink">
          <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-bmc-gold" />
          <span className="line-clamp-2 break-words">{order.notes}</span>
        </p>
      )}

      <div className="px-1.5 py-1">
        {order.items.map((item, idx) => (
          <TicketItemLine
            key={idx}
            item={item}
            index={idx}
            isDone={doneItems.includes(idx)}
            onToggleDone={onToggleItem}
          />
        ))}
      </div>

      {/* Bouton principal : or pour faire avancer la cuisine, sobre une fois le plat prêt */}
      <div className="p-2.5 pt-1">
        <button
          type="button"
          onClick={handleNextAction}
          className={`flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg font-display text-[15px] font-bold transition-colors active:scale-[0.99] ${
            action.isHandover
              ? 'bg-raised text-ink hover:bg-[#34343A]'
              : 'bg-bmc-gold text-bmc-charcoal hover:bg-[#E5A700]'
          }`}
        >
          {action.label}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </article>
  )
}
