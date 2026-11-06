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
import { formatDuration, getElapsedSeconds, getUrgencyLevel } from '../../lib/formatters'
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
  { label: string; icon: React.FC<{ className?: string }>; tagClass: string }
> = {
  delivery: {
    label: 'Livraison',
    icon: Bike,
    tagClass: 'text-[#94A3B8] bg-[#141A23] border-[#222B3A]',
  },
  takeaway: {
    label: 'À emporter',
    icon: ShoppingBag,
    tagClass: 'text-[#94A3B8] bg-[#141A23] border-[#222B3A]',
  },
  dine_in: {
    label: 'Sur place',
    icon: Utensils,
    tagClass: 'text-[#94A3B8] bg-[#141A23] border-[#222B3A]',
  },
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

  // Définition de l'action principale du workflow
  const getPrimaryAction = () => {
    switch (order.status) {
      case 'pending':
        return {
          label: 'Lancer cuisson',
          subLabel: 'Passer en cuisine',
          nextStatus: 'preparing' as KdsOrderStatus,
          bgClass: 'bg-[#F5B301] hover:bg-[#E5A700] text-black font-extrabold',
        }
      case 'preparing':
        return {
          label: 'Marquer prête',
          subLabel: 'Envoyer au comptoir',
          nextStatus: 'ready' as KdsOrderStatus,
          bgClass: 'bg-[#22C55E] hover:bg-[#16A34A] text-black font-extrabold',
        }
      case 'ready':
        return {
          label: order.orderType === 'delivery' ? 'Remettre coursier' : 'Servir client',
          subLabel: 'Clôturer la commande',
          nextStatus: 'delivered' as KdsOrderStatus,
          bgClass: 'bg-[#E2E8F0] hover:bg-white text-black font-bold',
        }
      case 'delivering':
        return {
          label: 'Confirmer livraison',
          subLabel: 'Commande livrée',
          nextStatus: 'delivered' as KdsOrderStatus,
          bgClass: 'bg-[#E2E8F0] hover:bg-white text-black font-bold',
        }
      default:
        return null
    }
  }

  const primaryAction = getPrimaryAction()
  const isDanger = urgency === 'danger'
  const isDelivered = order.status === 'delivered'
  const totalQuantity = order.items.reduce((s, i) => s + i.quantity, 0)
  const allItemsChecked = order.items.length > 0 && checkedItems.size === order.items.length

  // Raccourcir le numéro pour lisibilité cuisine : #0123 ou #849201
  const displayRef = order.orderRef.replace(/^#?BMC-?/, '#')

  return (
    <article
      className={`rounded-xl border transition-all duration-150 select-none overflow-hidden flex flex-col justify-between bg-[#0F131A] shadow-lg ${
        isDanger
          ? 'border-red-500/80 shadow-red-950/20'
          : allItemsChecked
          ? 'border-[#22C55E]/40'
          : 'border-[#1E2533] hover:border-[#2D374A]'
      }`}
      aria-label={`Ticket ${order.orderRef}`}
    >
      {/* 1. EN-TÊTE DU TICKET : Référence géante, Destination, Chrono */}
      <div className="px-3.5 py-2.5 border-b border-[#1A212D] bg-[#141923] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-base font-black text-white tracking-tight shrink-0">
            {displayRef}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${typeConfig.tagClass}`}
          >
            <TypeIcon className="size-3 text-[#7E8B9F]" />
            <span>{typeConfig.label}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Chronomètre épuré */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold tabular-nums border ${
              isDanger
                ? 'bg-red-500/20 text-red-400 border-red-500/40'
                : 'bg-[#181F2B] text-[#8C98AA] border-[#222C3C]'
            }`}
            title={`Passée à ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          >
            <Clock className="size-3 text-[#64748B]" />
            {durationText}
          </span>

          {/* Menu d'options */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded text-[#64748B] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Options ticket"
            >
              <MoreVertical className="size-3.5" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-xl shadow-2xl border border-[#263143] bg-[#161C26] py-1 z-30 select-none text-xs"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false)
                    onViewDetails(order)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[#CBD5E1] hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  <Eye className="size-3.5 text-[#64748B]" />
                  <span>Détails commande</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false)
                    onPrintTicket(order)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[#CBD5E1] hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  <Printer className="size-3.5 text-[#64748B]" />
                  <span>Imprimer le ticket</span>
                </button>
                {order.phone && (
                  <a
                    href={`tel:${order.phone}`}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[#CBD5E1] hover:text-white hover:bg-white/5"
                  >
                    <Phone className="size-3.5 text-[#64748B]" />
                    <span>Appeler {order.customerName}</span>
                  </a>
                )}
                <div className="my-1 border-t border-[#222B3B]" />
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false)
                    if (window.confirm(`Annuler définitivement la commande ${order.orderRef} ?`)) {
                      onCancel(order.orderRef)
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 font-semibold cursor-pointer"
                >
                  <XCircle className="size-3.5" />
                  <span>Annuler commande</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. NOTE DU CLIENT (Si présente) */}
      {order.notes && (
        <div className="mx-3 mt-2 px-2.5 py-1.5 rounded-lg bg-[#151B24] border border-[#252E3E] text-xs text-[#E2E8F0] flex items-start gap-2">
          <MessageSquare className="size-3 text-[#F5B301] shrink-0 mt-0.5" />
          <span className="italic leading-snug">« {order.notes} »</span>
        </div>
      )}

      {/* 3. LISTE DES ARTICLES À PRÉPARER (Contraste maximal, tactile) */}
      <div className="p-3 space-y-1.5 flex-1">
        <ul className="space-y-1.5" aria-label="Articles">
          {order.items.map((item, idx) => {
            const isDone = checkedItems.has(idx)
            return (
              <li
                key={idx}
                onClick={(e) => toggleItem(idx, e)}
                className={`p-2 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-2.5 text-xs select-none ${
                  isDone
                    ? 'bg-[#10141C] border-[#181F2B] opacity-40 line-through text-[#64748B]'
                    : 'bg-[#141A23] border-[#202938] hover:border-[#2D394E] text-white'
                }`}
                title="Cliquer pour pointer cet article"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-mono font-black shrink-0 ${
                      isDone
                        ? 'bg-[#181F2B] text-[#475569]'
                        : 'bg-[#1E2736] text-white border border-[#2B3749]'
                    }`}
                  >
                    {item.quantity}×
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-sm leading-snug block truncate text-[#F8FAFC]">
                      {item.name}
                    </span>
                    {item.options && item.options.length > 0 && (
                      <span className="text-[11px] text-[#94A3B8] block truncate mt-0.5">
                        • {item.options.join(' · ')}
                      </span>
                    )}
                    {item.notes && (
                      <span className="text-[11px] text-[#F5B301] block italic truncate mt-0.5">
                        * {item.notes}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 mt-0.5">
                  <div
                    className={`size-4 rounded flex items-center justify-center border transition-colors ${
                      isDone
                        ? 'bg-[#22C55E] border-[#22C55E] text-black'
                        : 'border-[#2D384B] bg-[#0F131A]'
                    }`}
                  >
                    {isDone && <Check className="size-3 stroke-[3]" />}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Pied de ticket : Infos client & progression */}
        <div className="pt-2 flex items-center justify-between text-[11px] text-[#717E91]">
          <span className="truncate max-w-[210px] font-medium text-[#8C98AA]">
            {order.customerName}
          </span>
          <span className="font-mono text-[10px] text-[#64748B]">
            {totalQuantity} {totalQuantity > 1 ? 'plats' : 'plat'}
            {checkedItems.size > 0 && ` (${checkedItems.size}/${order.items.length} faits)`}
          </span>
        </div>
      </div>

      {/* 4. BOUTON D'ACTION DU WORKFLOW (Grand, tactile, unique) */}
      <div className="p-2.5 border-t border-[#1A212D] bg-[#0D1016]">
        {primaryAction && !isDelivered ? (
          <button
            type="button"
            onClick={() => onTransition(order.orderRef, primaryAction.nextStatus)}
            className={`w-full py-2.5 px-3 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 shadow-md active:scale-[0.98] ${primaryAction.bgClass}`}
          >
            <span>{primaryAction.label}</span>
            <ArrowRight className="size-3.5 stroke-[2.5]" />
          </button>
        ) : isDelivered ? (
          <div className="w-full py-2 px-3 rounded-lg bg-[#141A23] text-[#7E8B9F] text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#1E2533]">
            <Check className="size-3.5 text-[#22C55E]" />
            <span>Commande terminée</span>
          </div>
        ) : null}
      </div>
    </article>
  )
}
