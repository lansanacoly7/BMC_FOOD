import React, { useState } from 'react'
import {
  Printer,
  Eye,
  Check,
  ArrowRight,
  AlertTriangle,
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

const TYPE_CONFIG: Record<
  OrderType,
  { label: string; icon: React.FC<{ className?: string }>; bg: string; text: string; border: string }
> = {
  delivery: {
    label: 'Livraison',
    icon: Bike,
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  takeaway: {
    label: 'À emporter',
    icon: ShoppingBag,
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  dine_in: {
    label: 'Sur place',
    icon: Utensils,
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
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
  // Bumplist tactile : permet au cuisinier de cocher chaque plat préparé
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

  const typeInfo = TYPE_CONFIG[order.orderType] || TYPE_CONFIG.delivery
  const TypeIcon = typeInfo.icon

  const getPrimaryAction = () => {
    switch (order.status) {
      case 'pending':
        return {
          label: 'Lancer cuisson',
          nextStatus: 'preparing' as KdsOrderStatus,
          colorClass: 'bg-[#F5B301] hover:bg-[#ffc83b] text-black font-black',
        }
      case 'preparing':
        return {
          label: 'Marquer prêt au comptoir',
          nextStatus: 'ready' as KdsOrderStatus,
          colorClass: 'bg-orange-500 hover:bg-orange-400 text-white font-black',
        }
      case 'ready':
        return {
          label: order.orderType === 'delivery' ? 'Remis au coursier' : 'Servi / Remis au client',
          nextStatus: 'delivered' as KdsOrderStatus,
          colorClass: 'bg-emerald-500 hover:bg-emerald-400 text-black font-black',
        }
      case 'delivering':
        return {
          label: 'Confirmer livraison',
          nextStatus: 'delivered' as KdsOrderStatus,
          colorClass: 'bg-emerald-500 hover:bg-emerald-400 text-black font-black',
        }
      default:
        return null
    }
  }

  const primaryAction = getPrimaryAction()
  const isDanger = urgency === 'danger'
  const isWarning = urgency === 'warning'
  const isDelivered = order.status === 'delivered'

  // Calcul du taux d'avancement des plats
  const totalItemsCount = order.items.length
  const completedCount = checkedItems.size
  const allChecked = totalItemsCount > 0 && completedCount === totalItemsCount

  return (
    <article
      className={`rounded-xl border text-left transition-all duration-150 select-none overflow-hidden flex flex-col justify-between bg-[#12161D] ${
        isDanger
          ? 'border-red-500 ring-2 ring-red-500/30 shadow-lg shadow-red-950/40'
          : isWarning
          ? 'border-amber-500/50 hover:border-amber-400/80 shadow-sm'
          : 'border-[#222936] hover:border-[#323D4F] shadow-xs'
      }`}
      aria-label={`Commande ${order.orderRef}`}
    >
      {/* 1. EN-TÊTE COMPACT KDS : Référence en gros, Type, Chrono & Menu */}
      <div className="px-3.5 py-2.5 border-b border-[#1E2430] bg-[#161B24] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-base font-black text-white tracking-tight">
            {order.orderRef}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${typeInfo.bg} ${typeInfo.text} border ${typeInfo.border}`}
          >
            <TypeIcon className="size-3 shrink-0" />
            <span>{typeInfo.label}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Chronomètre dynamique */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-black tabular-nums ${
              isDanger
                ? 'bg-red-500 text-white animate-pulse'
                : isWarning
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-[#1C2330] text-[#9AA5B5] border border-[#263142]'
            }`}
          >
            <Clock className="size-3" />
            {durationText}
          </span>

          {/* Menu options discret */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded text-[#727F93] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Options"
            >
              <MoreVertical className="size-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-xl shadow-xl border border-[#2B3545] bg-[#171D27] py-1 z-30 select-none text-xs"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false)
                    onViewDetails(order)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:text-white hover:bg-white/10"
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
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:text-white hover:bg-white/10"
                >
                  <Printer className="size-3.5" />
                  <span>Imprimer ticket</span>
                </button>
                {order.phone && (
                  <a
                    href={`tel:${order.phone}`}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:text-white hover:bg-white/10"
                  >
                    <Phone className="size-3.5" />
                    <span>Appeler client</span>
                  </a>
                )}
                <div className="my-1 border-t border-[#2B3545]" />
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

      {/* 2. CONSIGNE CUISINE EN SURBRILLANCE ROUGE/OR (Si présente) */}
      {order.notes && (
        <div className="mx-3 mt-2.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-start gap-1.5 text-xs text-amber-200 font-bold">
          <AlertTriangle className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span className="leading-snug">« {order.notes} »</span>
        </div>
      )}

      {/* 3. LISTE DES ARTICLES AVEC QUANTITÉS HAUTE VISIBILITÉ & BUMPLIST */}
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
                    ? 'bg-[#151B22]/60 border-[#222934] opacity-50 line-through text-slate-400'
                    : 'bg-[#181E29] border-[#263142] hover:border-[#38475E] text-white'
                }`}
                title="Cliquer pour marquer ce plat comme cuit"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  {/* Badge quantité géant et lisible */}
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-mono font-black shrink-0 ${
                      isDone
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-[#F5B301] text-black font-extrabold shadow-xs'
                    }`}
                  >
                    {item.quantity}×
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-sm leading-tight block truncate">
                      {item.name}
                    </span>
                    {item.options && item.options.length > 0 && (
                      <span className="text-[11px] text-[#A0AEC0] block truncate">
                        + {item.options.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 mt-0.5">
                  <div
                    className={`size-4 rounded flex items-center justify-center border ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-black'
                        : 'border-[#38475E] bg-[#12161F]'
                    }`}
                  >
                    {isDone && <Check className="size-3 stroke-[3]" />}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Ligne discrète client & progression */}
        <div className="pt-2 flex items-center justify-between text-[11px] text-[#7E8B9E]">
          <span className="truncate max-w-[180px]">
            {order.customerName}
          </span>
          {totalItemsCount > 1 && (
            <span
              className={`font-mono text-[10px] font-bold ${
                allChecked ? 'text-emerald-400' : 'text-[#7E8B9E]'
              }`}
            >
              {completedCount}/{totalItemsCount} prêts
            </span>
          )}
        </div>
      </div>

      {/* 4. GROS BOUTON TACTILE D'AVANCEMENT RAPIDE */}
      <div className="p-2.5 border-t border-[#1E2430] bg-[#10141B]">
        {primaryAction && !isDelivered ? (
          <button
            type="button"
            onClick={() => onTransition(order.orderRef, primaryAction.nextStatus)}
            className={`w-full py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98] shadow-sm ${primaryAction.colorClass}`}
          >
            <span>{primaryAction.label}</span>
            <ArrowRight className="size-3.5" />
          </button>
        ) : isDelivered ? (
          <div className="w-full py-1.5 px-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1 border border-emerald-500/20">
            <Check className="size-3" />
            <span>Clôturée</span>
          </div>
        ) : null}
      </div>
    </article>
  )
}
