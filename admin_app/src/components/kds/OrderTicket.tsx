import React, { useState } from 'react'
import {
  Bike,
  ShoppingBag,
  Utensils,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  ChevronUp,
  MoreHorizontal,
  Printer,
  Eye,
  XCircle,
  MessageSquare,
  MapPin,
  Phone,
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
  { label: string; badgeLabel: string; badgeClass: string; icon: React.FC<{ className?: string }> }
> = {
  delivery: {
    label: 'Livraison',
    badgeLabel: 'LIVRAISON',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: Bike,
  },
  takeaway: {
    label: 'À emporter',
    badgeLabel: 'À EMPORTER',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    icon: ShoppingBag,
  },
  dine_in: {
    label: 'Sur place',
    badgeLabel: 'SUR PLACE',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: Utensils,
  },
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
  const neighborhood = order.orderType === 'delivery' ? (order.deliveryArea || extractNeighborhood(order.address)) : ''

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
        order.hasAllergy
          ? 'border-red-500/80 ring-1 ring-red-500/30'
          : isOverdue
          ? 'border-bad'
          : 'border-line'
      }`}
    >
      {/* BANDEAU ROUGE ALLERGIE */}
      {order.hasAllergy && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 rounded-t-[11px] bg-red-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-inner"
        >
          <span className="flex items-center gap-1.5">
            <AlertOctagon className="size-4 shrink-0 animate-pulse" />
            ALLERGIE SIGNALÉE
          </span>
          {order.notes && (
            <span
              className="max-w-[210px] truncate text-[11px] font-semibold normal-case text-red-100"
              title={order.notes}
            >
              {order.notes}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 px-3 pb-1 pt-2.5">
        <span className="font-display text-xl font-bold leading-none tabular-nums text-ink">
          #{displayRef}
        </span>

        {/* Badge LIVRAISON / À EMPORTER */}
        <span
          title={typeConfig.label}
          className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wider ${typeConfig.badgeClass}`}
        >
          <TypeIcon className="size-3 shrink-0" />
          <span>{typeConfig.badgeLabel}</span>
        </span>

        <div className="ml-auto flex shrink-0 items-center gap-0.5">
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

      {/* INFOS CLIENT, MONTANT ET LIVRAISON (QUARTIER + TÉLÉPHONE) */}
      <div className="flex flex-col gap-1 px-3 pb-2 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 truncate font-medium text-ink">
            {order.customerName}
          </p>
          <span className="shrink-0 font-display font-semibold tabular-nums text-ink">
            {formatFcfa(order.totalAmount)}
          </span>
        </div>

        {order.orderType === 'delivery' && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
            {neighborhood && (
              <span className="inline-flex items-center gap-1 font-semibold text-ink-soft">
                <MapPin className="size-3 shrink-0 text-bmc-gold" />
                <span>{neighborhood}</span>
              </span>
            )}
            {order.phone && (
              <a
                href={`tel:${order.phone}`}
                className="inline-flex items-center gap-1 font-semibold text-bmc-gold hover:underline"
                title="Appeler le client"
              >
                <Phone className="size-3 shrink-0" />
                <span>{order.phone}</span>
              </a>
            )}
          </div>
        )}
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
