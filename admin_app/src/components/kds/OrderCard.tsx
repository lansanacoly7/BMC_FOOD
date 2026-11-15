import React, { useState } from 'react'
import {
  Bike,
  ShoppingBag,
  Utensils,
  Clock,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  MoreVertical,
  Check,
  Printer,
  Eye,
  XCircle,
  MessageSquare,
} from 'lucide-react'
import { formatDuration, formatFcfa, getElapsedSeconds, getUrgencyLevel } from '../../lib/formatters'
import { DEFAULT_THRESHOLDS, type ChronoThresholds, type KdsOrder, type KdsOrderStatus, type OrderType } from '../../types/kds'

interface OrderCardProps {
  order: KdsOrder
  nowMs: number
  thresholds?: ChronoThresholds
  isMarkedNew?: boolean
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
  isMarkedNew = false,
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

  return (
    <article
      className={`rounded-lg border text-left select-none overflow-hidden flex flex-col justify-between transition-colors bg-[#171A21] ${
        isOverdue
          ? 'border-[#E04848]'
          : 'border-[#262A33]'
      }`}
    >
      <div className="flex-1 flex flex-col">
        {/* NOTE DU CLIENT : une seule ligne avec petite icône en haut de la carte */}
        {order.notes && (
          <div className="px-2.5 py-1 bg-[#12141A] border-b border-[#262A33] flex items-center gap-1.5 text-[11px] text-[#E8A33D] overflow-hidden">
            <MessageSquare className="size-3 text-[#E8A33D] shrink-0" />
            <span className="truncate italic">« {order.notes} »</span>
          </div>
        )}

        {/* LIGNE 1 : #numéro en gras, pastille du type, chronomètre (ou RETARD) et menu ⋯ */}
        <div className="px-2.5 pt-2 pb-1.5 flex items-center justify-between gap-1 border-b border-[#1E222A]">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* #numéro en gras */}
            <span className="font-mono text-sm font-black text-[#E6E8EC] tracking-tight shrink-0">
              #{displayRef}
            </span>

            {/* Pastille du type (Livraison/Emporter/Sur place) */}
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#0F1115] text-[#8B93A1] border border-[#262A33] shrink-0">
              <TypeIcon className="size-2.5 text-[#8B93A1]" />
              <span>{typeConfig.label}</span>
            </span>

            {/* Marquage NOUVEAU pendant 10 secondes */}
            {(isMarkedNew || order.isNew) && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-[#E8A33D]/20 text-[#E8A33D] border border-[#E8A33D]/40 shrink-0">
                <Sparkles className="size-2.5 text-[#E8A33D]" />
                <span>Nouveau</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 relative">
            {/* Chronomètre avec texte + icône pour conformité WCAG AA (pas uniquement la couleur) */}
            {isOverdue ? (
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-[#E04848]/20 border border-[#E04848]/50 text-[#FF6B6B] shrink-0"
                role="alert"
                aria-label={`Commande en retard de ${durationText}`}
              >
                <AlertTriangle className="size-3 text-[#FF6B6B] shrink-0 stroke-[2.5]" />
                <span className="uppercase text-[9px] tracking-wide font-extrabold">Retard</span>
                <span className="font-mono">{durationText}</span>
              </div>
            ) : isNearThreshold ? (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[#E8A33D]/15 border border-[#E8A33D]/30 text-[#E8A33D] shrink-0">
                <Clock className="size-3 text-[#E8A33D] shrink-0" />
                <span className="font-mono">{durationText}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#12141A] border border-[#262A33] text-[#8B93A1] shrink-0">
                <Clock className="size-3 text-[#5D6472] shrink-0" />
                <span className="text-[#E6E8EC] font-mono">{durationText}</span>
              </div>
            )}

            {/* Menu ⋯ actions secondaires */}
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-1 rounded text-[#8B93A1] hover:text-[#E6E8EC] hover:bg-[#262A33] cursor-pointer transition-colors"
              title="Actions secondaires"
              aria-expanded={showMenu}
            >
              <MoreVertical className="size-3.5" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-[#262A33] bg-[#171A21] shadow-xl z-30 py-1 text-xs"
                onClick={() => setShowMenu(false)}
              >
                <button
                  type="button"
                  onClick={() => onViewDetails(order)}
                  className="w-full px-3 py-1.5 text-left text-[#E6E8EC] hover:bg-[#262A33] flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="size-3 text-[#8B93A1]" />
                  <span>Voir le ticket complet</span>
                </button>
                <button
                  type="button"
                  onClick={() => onPrintTicket(order)}
                  className="w-full px-3 py-1.5 text-left text-[#E6E8EC] hover:bg-[#262A33] flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="size-3 text-[#8B93A1]" />
                  <span>Imprimer le ticket</span>
                </button>
                <div className="my-1 border-t border-[#262A33]" />
                <button
                  type="button"
                  onClick={() => onCancel(order.orderRef)}
                  className="w-full px-3 py-1.5 text-left text-[#E04848] hover:bg-[#E04848]/10 flex items-center gap-2 cursor-pointer"
                >
                  <XCircle className="size-3 text-[#E04848]" />
                  <span>Annuler la commande</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LIGNE 2 : nom du client (+ quartier si livraison) */}
        <div className="px-2.5 pt-1.5 pb-1 flex items-baseline gap-1 text-xs text-[#8B93A1] border-b border-[#1E222A]">
          <span className="font-semibold text-[#E6E8EC] truncate">{order.customerName}</span>
          {neighborhood && (
            <span className="text-[#8B93A1] truncate">· {neighborhood}</span>
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
            <span>Remise</span>
          </div>
        )}
      </div>
    </article>
  )
}
