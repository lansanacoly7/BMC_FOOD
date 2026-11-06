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
import { DEFAULT_THRESHOLDS, type ChronoThresholds, type KdsOrder, type KdsOrderStatus, type OrderType } from '../../types/kds'

interface OrderCardProps {
  order: KdsOrder
  nowMs: number
  thresholds?: ChronoThresholds
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
  takeaway: { label: 'Emporter', icon: ShoppingBag },
  dine_in: { label: 'Sur place', icon: Utensils },
}

/**
 * Extrait un quartier concis depuis l'adresse (ex: "Almadies, Dakar" -> "Almadies")
 */
function extractNeighborhood(address?: string): string {
  if (!address) return ''
  const cleaned = address.replace(/^Position GPS\s*:\s*/i, '').replace(/^Retrait sur place\s*[–-]\s*/i, '').trim()
  if (cleaned.startsWith('http')) return 'GPS'
  const firstPart = cleaned.split(/[,–\-(]/)[0]?.trim()
  return firstPart || ''
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  nowMs,
  thresholds = DEFAULT_THRESHOLDS,
  onTransition,
  onCancel,
  onViewDetails,
  onPrintTicket,
}) => {
  const [showMenu, setShowMenu] = useState(false)

  const elapsedSec = getElapsedSeconds(order.createdAt, nowMs)
  // Seuils configurables : 15 min (warning/ambre) et 25 min (danger/rouge)
  const urgency = getUrgencyLevel(elapsedSec, thresholds)
  const durationText = formatDuration(elapsedSec)

  const typeConfig = TYPE_CONFIG[order.orderType] || TYPE_CONFIG.delivery
  const TypeIcon = typeConfig.icon

  const isOverdue = urgency === 'danger'
  const isNearThreshold = urgency === 'warning'
  const isDelivered = order.status === 'delivered'

  // Bouton principal selon la colonne : "Lancer la cuisson" → "Marquer prêt" → "Remis au livreur" / "Remis au client"
  const getPrimaryAction = () => {
    switch (order.status) {
      case 'pending':
        return {
          label: 'Lancer la cuisson',
          nextStatus: 'preparing' as KdsOrderStatus,
        }
      case 'preparing':
        return {
          label: 'Marquer prêt',
          nextStatus: 'ready' as KdsOrderStatus,
        }
      case 'ready':
      case 'delivering':
        return {
          label: order.orderType === 'delivery' ? 'Remis au livreur' : 'Remis au client',
          nextStatus: 'delivered' as KdsOrderStatus,
        }
      default:
        return null
    }
  }

  const primaryAction = getPrimaryAction()
  const displayRef = order.orderRef.replace(/^#?BMC-?/, '')
  const neighborhood = order.orderType === 'delivery' ? extractNeighborhood(order.address) : ''

  // Style du chronomètre : gris normal, ambre près du seuil (>= 15 min), rouge si dépassé (>= 25 min)
  const chronoClass = isOverdue
    ? 'text-[#E04848] bg-[#E04848]/10 border-[#E04848]/40 font-bold'
    : isNearThreshold
    ? 'text-[#E8A33D] bg-[#E8A33D]/10 border-[#E8A33D]/30 font-semibold'
    : 'text-[#8B93A1] bg-[#12141A] border-[#262A33]'

  return (
    <article
      className={`rounded-lg border text-left select-none overflow-hidden flex flex-col justify-between transition-colors bg-[#171A21] ${
        isOverdue ? 'border-[#E04848]' : 'border-[#262A33]'
      }`}
      aria-label={`Commande #${displayRef}`}
    >
      <div>
        {/* LIGNE 1 : #numéro en gras, pastille du type, chronomètre à droite (15/25 min) + Menu ⋯ */}
        <div className="px-2.5 pt-2 pb-1 flex items-center justify-between gap-1.5 border-b border-[#262A33]/60 bg-[#12141A]">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="font-mono text-xs font-black text-[#E6E8EC] tracking-tight shrink-0">
              #{displayRef}
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#171A21] text-[#8B93A1] border border-[#262A33] shrink-0">
              <TypeIcon className="size-2.5 text-[#8B93A1]" />
              <span>{typeConfig.label}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono border ${chronoClass}`}
              title={`Créée à ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            >
              <Clock className="size-2.5" />
              {durationText}
            </span>

            {/* Menu ⋯ pour les actions secondaires */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded text-[#8B93A1] hover:text-[#E6E8EC] hover:bg-[#262A33] transition-colors cursor-pointer"
                title="Actions secondaires"
              >
                <MoreVertical className="size-3.5" />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-44 rounded-lg shadow-xl border border-[#262A33] bg-[#171A21] py-1 z-30 select-none text-xs"
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
                    <span>Imprimer ticket</span>
                  </button>
                  {order.phone && (
                    <a
                      href={`tel:${order.phone}`}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[#E6E8EC] hover:bg-[#262A33]"
                    >
                      <Phone className="size-3.5 text-[#8B93A1]" />
                      <span>Appeler client</span>
                    </a>
                  )}
                  <div className="my-1 border-t border-[#262A33]" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false)
                      if (window.confirm(`Annuler la commande #${displayRef} ?`)) {
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

        {/* NOTE DU CLIENT : une seule ligne avec une petite icône, en haut de la carte */}
        {order.notes && (
          <div className="px-2.5 pt-1.5 flex items-center gap-1.5 text-[11px] text-[#E6E8EC] truncate">
            <MessageSquare className="size-3 text-[#E8A33D] shrink-0" />
            <span className="italic truncate text-[#E6E8EC]/90">« {order.notes} »</span>
          </div>
        )}

        {/* LIGNE 2 : nom du client (+ quartier si livraison) */}
        <div className="px-2.5 pt-1 text-xs text-[#8B93A1] truncate leading-tight">
          <span className="text-[#E6E8EC] font-semibold">{order.customerName}</span>
          {neighborhood && (
            <span className="text-[#8B93A1]"> · {neighborhood}</span>
          )}
        </div>

        {/* PLATS : une ligne par plat "2× Dibiterie Agneau (500 g)", sans boîte autour */}
        <div className="px-2.5 py-1.5 space-y-1">
          {order.items.map((item, idx) => (
            <div key={idx} className="text-xs leading-snug">
              <div className="flex items-baseline gap-1 text-[#E6E8EC]">
                <span className="font-mono font-bold text-[#E8A33D] shrink-0">{item.quantity}×</span>
                <span className="font-medium truncate">{item.name}</span>
              </div>
              {item.options && item.options.length > 0 && (
                <div className="text-[11px] text-[#8B93A1] pl-4 leading-tight truncate">
                  {item.options.join(' · ')}
                </div>
              )}
              {item.notes && (
                <div className="text-[11px] text-[#E8A33D] italic pl-4 leading-tight truncate">
                  * {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* PIED : total en F CFA à gauche, UN seul bouton principal à droite (minimum 44 px de haut) */}
      <div className="px-2 py-1.5 border-t border-[#262A33] bg-[#12141A] flex items-center justify-between gap-1.5 shrink-0">
        <div className="flex flex-col shrink-0">
          <span className="text-[9px] text-[#8B93A1] uppercase tracking-wider font-medium leading-none">Total</span>
          <span className="font-mono text-[11px] font-bold text-[#E6E8EC] whitespace-nowrap mt-0.5">
            {formatFcfa(order.totalAmount)}
          </span>
        </div>

        {primaryAction && !isDelivered ? (
          <button
            type="button"
            onClick={() => onTransition(order.orderRef, primaryAction.nextStatus)}
            className="min-h-[44px] h-11 px-2.5 rounded text-[11px] font-bold uppercase tracking-tight flex items-center justify-center gap-1 cursor-pointer transition-colors bg-[#E8A33D] hover:bg-[#D69330] text-[#0F1115] shrink-0 active:scale-[0.99]"
          >
            <span className="truncate">{primaryAction.label}</span>
            <ArrowRight className="size-3 stroke-[2.5] shrink-0" />
          </button>
        ) : (
          <div className="min-h-[44px] h-11 px-2.5 rounded text-xs font-semibold text-[#8B93A1] bg-[#171A21] border border-[#262A33] flex items-center justify-center gap-1 shrink-0">
            <Check className="size-3 text-[#8B93A1]" />
            <span>Terminée</span>
          </div>
        )}
      </div>
    </article>
  )
}
