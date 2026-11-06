import React, { useState } from 'react'
import {
  Printer,
  Eye,
  Check,
  ArrowRight,
  Clock,
  Bike,
  Utensils,
  ShoppingBag,
  MoreVertical,
  XCircle,
  Phone,
  MessageSquare,
} from 'lucide-react'
import { formatDuration, formatFcfa, getElapsedSeconds, getUrgencyLevel } from '../../lib/formatters'
import type { KdsOrder, KdsOrderStatus, OrderType } from '../../types/kds'

interface OrderCardProps {
  order: KdsOrder
  nowMs: number
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

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  nowMs,
  onTransition,
  onCancel,
  onViewDetails,
  onPrintTicket,
}) => {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())
  const [showMenu, setShowMenu] = useState(false)

  const toggleItem = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const elapsedSec = getElapsedSeconds(order.createdAt, nowMs)
  const urgency = getUrgencyLevel(elapsedSec)
  const durationText = formatDuration(elapsedSec)

  const typeConfig = TYPE_CONFIG[order.orderType] || TYPE_CONFIG.delivery
  const TypeIcon = typeConfig.icon

  // Le rouge est réservé EXCLUSIVEMENT aux commandes en retard (> 15 min)
  const isLate = urgency === 'danger'
  const isDelivered = order.status === 'delivered'

  // Action principale avec UNE SEULE couleur d'accent (#E8A33D)
  const getPrimaryAction = () => {
    switch (order.status) {
      case 'pending':
        return {
          label: 'Lancer la préparation',
          nextStatus: 'preparing' as KdsOrderStatus,
          isAccent: true,
        }
      case 'preparing':
        return {
          label: 'Marquer prêt',
          nextStatus: 'ready' as KdsOrderStatus,
          isAccent: true,
        }
      case 'ready':
      case 'delivering':
        return {
          label: order.orderType === 'delivery' ? 'Remettre au coursier' : 'Servir / Remettre',
          nextStatus: 'delivered' as KdsOrderStatus,
          isAccent: false,
        }
      default:
        return null
    }
  }

  const primaryAction = getPrimaryAction()

  return (
    <article
      className={`rounded-lg border text-left select-none overflow-hidden flex flex-col justify-between transition-colors bg-[#171A21] ${
        isLate
          ? 'border-[#E04848]'
          : 'border-[#262A33]'
      }`}
      aria-label={`Commande ${order.orderRef}`}
    >
      {/* 1. EN-TÊTE DE LA CARTE : Référence, Type, Chrono */}
      <div className="px-3 py-2 border-b border-[#262A33] bg-[#12141A] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-sm font-bold text-[#E6E8EC] tracking-tight shrink-0">
            {order.orderRef}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#171A21] text-[#8B93A1] border border-[#262A33]">
            <TypeIcon className="size-3 text-[#8B93A1]" />
            <span>{typeConfig.label}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Chronomètre : rouge uniquement si en retard, sinon secondaire */}
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono font-medium border ${
              isLate
                ? 'text-[#E04848] bg-[#E04848]/10 border-[#E04848]/40 font-bold'
                : 'text-[#8B93A1] bg-[#171A21] border-[#262A33]'
            }`}
            title={`Créée à ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          >
            <Clock className="size-3" />
            {durationText}
          </span>

          {/* Menu d'options */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded text-[#8B93A1] hover:text-[#E6E8EC] hover:bg-[#262A33] transition-colors cursor-pointer"
              title="Options"
            >
              <MoreVertical className="size-3.5" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-lg shadow-lg border border-[#262A33] bg-[#171A21] py-1 z-30 select-none text-xs"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false)
                    onViewDetails(order)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[#E6E8EC] hover:bg-[#262A33] cursor-pointer"
                >
                  <Eye className="size-3.5 text-[#8B93A1]" />
                  <span>Détails complets</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false)
                    onPrintTicket(order)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[#E6E8EC] hover:bg-[#262A33] cursor-pointer"
                >
                  <Printer className="size-3.5 text-[#8B93A1]" />
                  <span>Imprimer le ticket</span>
                </button>
                {order.phone && (
                  <a
                    href={`tel:${order.phone}`}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[#E6E8EC] hover:bg-[#262A33]"
                  >
                    <Phone className="size-3.5 text-[#8B93A1]" />
                    <span>Appeler le client</span>
                  </a>
                )}
                <div className="my-1 border-t border-[#262A33]" />
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false)
                    if (window.confirm(`Annuler la commande ${order.orderRef} ?`)) {
                      onCancel(order.orderRef)
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[#E04848] hover:bg-[#E04848]/10 font-medium cursor-pointer"
                >
                  <XCircle className="size-3.5" />
                  <span>Annuler commande</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. NOTE CLIENT (Si renseignée) */}
      {order.notes && (
        <div className="mx-3 mt-2 px-2 py-1.5 rounded border border-[#262A33] bg-[#12141A] text-xs text-[#E6E8EC] flex items-start gap-1.5">
          <MessageSquare className="size-3 text-[#E8A33D] shrink-0 mt-0.5" />
          <span className="italic leading-relaxed">« {order.notes} »</span>
        </div>
      )}

      {/* 3. LISTE DES ARTICLES : Police Inter, contrastée, interactive */}
      <div className="p-3 space-y-1.5 flex-1">
        <ul className="space-y-1" aria-label="Articles à préparer">
          {order.items.map((item, idx) => {
            const isDone = checkedItems.has(idx)
            return (
              <li
                key={idx}
                onClick={(e) => toggleItem(idx, e)}
                className={`p-1.5 rounded border transition-colors cursor-pointer flex items-start justify-between gap-2 text-xs select-none ${
                  isDone
                    ? 'bg-[#12141A] border-[#1E222A] text-[#8B93A1] line-through opacity-50'
                    : 'bg-[#12141A] border-[#262A33] text-[#E6E8EC] hover:border-[#363C4A]'
                }`}
                title="Cliquer pour cocher cet article"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span
                    className={`px-1 py-0.2 rounded text-xs font-mono font-bold shrink-0 ${
                      isDone
                        ? 'bg-[#171A21] text-[#5D6472]'
                        : 'bg-[#171A21] text-[#E8A33D] border border-[#262A33]'
                    }`}
                  >
                    {item.quantity}×
                  </span>
                  <div className="min-w-0">
                    <span className="font-medium text-xs leading-snug block truncate text-[#E6E8EC]">
                      {item.name}
                    </span>
                    {item.options && item.options.length > 0 && (
                      <span className="text-[11px] text-[#8B93A1] block truncate">
                        • {item.options.join(' · ')}
                      </span>
                    )}
                    {item.notes && (
                      <span className="text-[11px] text-[#E8A33D] block italic truncate">
                        * {item.notes}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 mt-0.5">
                  <div
                    className={`size-3.5 rounded flex items-center justify-center border ${
                      isDone
                        ? 'bg-[#262A33] border-[#363C4A] text-[#E6E8EC]'
                        : 'border-[#262A33] bg-[#171A21]'
                    }`}
                  >
                    {isDone && <Check className="size-2.5 stroke-[3]" />}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Détails bas de carte : Client, progression et Montant F CFA */}
        <div className="pt-2 flex items-center justify-between text-xs text-[#8B93A1] border-t border-[#1E222A]">
          <span className="truncate max-w-[140px]">
            {order.customerName}
          </span>
          <span className="font-mono text-xs font-semibold text-[#E6E8EC]">
            {formatFcfa(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* 4. BOUTON D'ACTION DU WORKFLOW : Accent #E8A33D ou neutre */}
      <div className="p-2 border-t border-[#262A33] bg-[#12141A]">
        {primaryAction && !isDelivered ? (
          <button
            type="button"
            onClick={() => onTransition(order.orderRef, primaryAction.nextStatus)}
            className={`w-full py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              primaryAction.isAccent
                ? 'bg-[#E8A33D] hover:bg-[#D69330] text-[#0F1115]'
                : 'bg-[#171A21] hover:bg-[#262A33] text-[#E6E8EC] border border-[#262A33]'
            }`}
          >
            <span>{primaryAction.label}</span>
            <ArrowRight className="size-3" />
          </button>
        ) : isDelivered ? (
          <div className="w-full py-1.5 px-2 rounded bg-[#171A21] text-[#8B93A1] text-xs font-medium flex items-center justify-center gap-1 border border-[#262A33]">
            <Check className="size-3 text-[#8B93A1]" />
            <span>Commande terminée</span>
          </div>
        ) : null}
      </div>
    </article>
  )
}
