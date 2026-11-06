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

const TYPE_LABELS: Record<OrderType, { label: string; icon: React.FC<{ className?: string }> }> = {
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

  const toggleItem = (idx: number) => {
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

  const typeConfig = TYPE_LABELS[order.orderType] || TYPE_LABELS.delivery
  const TypeIcon = typeConfig.icon

  const getPrimaryAction = () => {
    switch (order.status) {
      case 'pending':
        return {
          label: 'Lancer la préparation',
          nextStatus: 'preparing' as KdsOrderStatus,
        }
      case 'preparing':
        return {
          label: 'Marquer prêt au comptoir',
          nextStatus: 'ready' as KdsOrderStatus,
        }
      case 'ready':
        return {
          label: order.orderType === 'delivery' ? 'Remettre au coursier' : 'Servir / Remettre',
          nextStatus: 'delivered' as KdsOrderStatus,
        }
      case 'delivering':
        return {
          label: 'Confirmer livraison',
          nextStatus: 'delivered' as KdsOrderStatus,
        }
      default:
        return null
    }
  }

  const primaryAction = getPrimaryAction()
  const isDanger = urgency === 'danger'
  const isDelivered = order.status === 'delivered'

  return (
    <article
      className={`rounded-xl border text-left transition-all duration-150 select-none overflow-hidden flex flex-col justify-between bg-[#111419] ${
        isDanger
          ? 'border-red-500/80 shadow-md shadow-red-950/20'
          : 'border-[#1E232D] hover:border-[#2C3443]'
      }`}
      aria-label={`Commande ${order.orderRef}`}
    >
      {/* 1. EN-TÊTE SOBRE & ÉPURÉ : Référence, Type, Chrono */}
      <div className="px-3.5 py-2.5 border-b border-[#1A1F28] bg-[#141820] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-sm font-bold text-white tracking-tight">
            {order.orderRef}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#1B212B] text-[#9AA3AF] border border-[#252D3B]">
            <TypeIcon className="size-3 text-[#7B8698]" />
            <span>{typeConfig.label}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Chronomètre épuré */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono tabular-nums ${
              isDanger
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 font-bold'
                : 'bg-[#181D26] text-[#8590A2] border border-[#222834]'
            }`}
          >
            <Clock className="size-3 text-[#6B7687]" />
            {durationText}
          </span>

          {/* Menu discret */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded text-[#6B7687] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Options"
            >
              <MoreVertical className="size-3.5" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-xl shadow-xl border border-[#27303E] bg-[#161B23] py-1 z-30 select-none text-xs"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false)
                    onViewDetails(order)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[#C2C9D6] hover:text-white hover:bg-white/5"
                >
                  <Eye className="size-3.5" />
                  <span>Détail complet</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false)
                    onPrintTicket(order)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[#C2C9D6] hover:text-white hover:bg-white/5"
                >
                  <Printer className="size-3.5" />
                  <span>Imprimer ticket</span>
                </button>
                {order.phone && (
                  <a
                    href={`tel:${order.phone}`}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[#C2C9D6] hover:text-white hover:bg-white/5"
                  >
                    <Phone className="size-3.5" />
                    <span>Appeler client</span>
                  </a>
                )}
                <div className="my-1 border-t border-[#232B38]" />
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false)
                    if (window.confirm(`Confirmer l'annulation de la commande ${order.orderRef} ?`)) {
                      onCancel(order.orderRef)
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 font-semibold"
                >
                  <XCircle className="size-3.5" />
                  <span>Annuler commande</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. NOTE CLIENT : Encadré sobre et élégant */}
      {order.notes && (
        <div className="mx-3 mt-2.5 px-2.5 py-1.5 rounded-lg bg-[#181D26] border border-[#2B3545] text-xs text-[#E2E8F0]">
          <span className="text-[#8590A2] font-semibold mr-1.5">Note :</span>
          <span className="italic leading-relaxed">« {order.notes} »</span>
        </div>
      )}

      {/* 3. LISTE DES ARTICLES : Monochrome, ultra lisible, reposant pour les yeux */}
      <div className="p-3 space-y-1.5 flex-1">
        <ul className="space-y-1.5" aria-label="Plats à préparer">
          {order.items.map((item, idx) => {
            const isDone = checkedItems.has(idx)
            return (
              <li
                key={idx}
                onClick={() => toggleItem(idx)}
                className={`p-2 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-2 text-xs select-none ${
                  isDone
                    ? 'bg-[#12151B] border-[#1A1F28] opacity-40 line-through text-[#657182]'
                    : 'bg-[#151921] border-[#202734] hover:border-[#2C3647] text-white'
                }`}
                title="Cliquer pour cocher ce plat"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  {/* Badge quantité sobre */}
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold shrink-0 ${
                      isDone
                        ? 'bg-[#1B202A] text-[#556070]'
                        : 'bg-[#1E2532] text-white border border-[#2B3546]'
                    }`}
                  >
                    {item.quantity}×
                  </span>
                  <div className="min-w-0">
                    <span className="font-semibold text-sm leading-tight block truncate">
                      {item.name}
                    </span>
                    {item.options && item.options.length > 0 && (
                      <span className="text-[11px] text-[#7A8699] block truncate mt-0.5">
                        + {item.options.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 mt-0.5">
                  <div
                    className={`size-4 rounded flex items-center justify-center border ${
                      isDone
                        ? 'bg-[#2B3546] border-[#3B475C] text-white'
                        : 'border-[#293242] bg-[#12151B]'
                    }`}
                  >
                    {isDone && <Check className="size-3 stroke-[2.5]" />}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Client discret */}
        <div className="pt-2 flex items-center justify-between text-[11px] text-[#6B7687]">
          <span className="truncate max-w-[200px]">
            {order.customerName}
          </span>
          {order.items.length > 1 && checkedItems.size > 0 && (
            <span className="font-mono text-[10px] text-[#8590A2]">
              {checkedItems.size}/{order.items.length} prêts
            </span>
          )}
        </div>
      </div>

      {/* 4. BOUTON D'ACTION UNIQUE & ÉLÉGANT */}
      <div className="p-2.5 border-t border-[#1A1F28] bg-[#0E1116]">
        {primaryAction && !isDelivered ? (
          <button
            type="button"
            onClick={() => onTransition(order.orderRef, primaryAction.nextStatus)}
            className="w-full py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors bg-[#F5B301] hover:bg-[#E5A700] text-black shadow-xs active:scale-[0.99]"
          >
            <span>{primaryAction.label}</span>
            <ArrowRight className="size-3.5" />
          </button>
        ) : isDelivered ? (
          <div className="w-full py-1.5 px-2 rounded-lg bg-[#161B23] text-[#8590A2] text-xs font-semibold flex items-center justify-center gap-1 border border-[#232A37]">
            <Check className="size-3" />
            <span>Clôturée</span>
          </div>
        ) : null}
      </div>
    </article>
  )
}
