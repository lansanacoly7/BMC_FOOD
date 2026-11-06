import React, { useState } from 'react'
import {
  Bike,
  ShoppingBag,
  Utensils,
  AlertTriangle,
  MoreVertical,
  Printer,
  Eye,
  XCircle,
  RotateCcw,
  MessageSquare,
} from 'lucide-react'
import { formatDuration, formatFcfa, getElapsedSeconds } from '../../lib/formatters'
import { DEFAULT_KDS_THRESHOLDS, type ChronoThresholds } from '../../styles/kdsTokens'
import type { KdsOrder, KdsOrderStatus, OrderType } from '../../types/kds'
import { TicketItemLine } from './TicketItemLine'

interface OrderTicketProps {
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
  onTransition,
  onCancel,
  onViewDetails,
  onPrintTicket,
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [doneItems, setDoneItems] = useState<Set<number>>(new Set())

  const toggleItem = (idx: number) => {
    setDoneItems((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const elapsedSec = getElapsedSeconds(order.createdAt, nowMs)
  // Seuil retard uniquement (15 min) : pas de jaune intermédiaire
  const isOverdue = elapsedSec >= thresholds.dangerMinutes * 60
  const durationText = formatDuration(elapsedSec)

  const typeConfig = TYPE_CONFIG[order.orderType] || TYPE_CONFIG.delivery
  const TypeIcon = typeConfig.icon

  const displayRef = order.orderRef.replace(/^#?BMC-?/, '')
  const neighborhood = order.orderType === 'delivery' ? extractNeighborhood(order.address) : ''
  const isDelivery = order.orderType === 'delivery'

  // Étape suivante et style du bouton principal
  const isReadyColumn = order.status === 'ready' || order.status === 'delivering'
  let actionText = 'LANCER LA CUISSON'
  let nextStatus: KdsOrderStatus = 'preparing'

  if (order.status === 'preparing') {
    actionText = 'MARQUER PRÊT'
    nextStatus = 'ready'
  } else if (isReadyColumn) {
    actionText = isDelivery ? 'REMIS AU LIVREUR' : 'REMIS AU CLIENT'
    nextStatus = 'delivered'
  }

  const handleNextAction = () => {
    onTransition(order.orderRef, nextStatus)
  }

  return (
    <article
      className={`rounded-[10px] bg-[#181B22] text-left select-none flex flex-col justify-between shadow-sm transition-colors relative ${
        isOverdue ? 'border border-[#EF4444]' : 'border border-[#262A33]'
      }`}
    >
      <div className="flex-1 flex flex-col">
        {/* LIGNE 1 : EN-TÊTE SANS COULEUR (FLEX STRICT SANS CHEVAUCHEMENT) */}
        <div className="px-3 py-2.5 flex items-center justify-between border-b border-[#262A33]">
          {/* GAUCHE : [#numéro 22px gras] [pastille type grise] */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[22px] font-bold text-[#F2F4F7] tracking-tight shrink-0 leading-none">
              #{displayRef}
            </span>

            {/* Pastille du type : grise avec icône, sans couleur */}
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#262A33] text-[#8A93A3] text-xs font-semibold shrink-0">
              <TypeIcon className="size-3 text-[#8A93A3]" />
              <span>{typeConfig.label}</span>
            </span>
          </div>

          {/* DROITE : [chrono gris ou rouge si retard] [menu ⋯] */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {isOverdue ? (
              <span
                className="font-mono text-base font-bold tabular-nums text-[#EF4444] inline-flex items-center gap-1"
                role="alert"
                aria-label={`En retard de ${durationText}`}
              >
                <AlertTriangle className="size-3.5 stroke-[2.5]" />
                <span>{durationText}</span>
              </span>
            ) : (
              <span className="font-mono text-base font-bold tabular-nums text-[#8A93A3]">
                {durationText}
              </span>
            )}

            {/* Menu ⋯ discret */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                className="p-1 rounded hover:bg-[#262A33] text-[#8A93A3] hover:text-[#F2F4F7] cursor-pointer transition-colors"
                title="Options secondaires"
              >
                <MoreVertical className="size-4" />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-[#262A33] bg-[#181B22] shadow-2xl z-40 py-1 text-xs text-[#F2F4F7]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false)
                      onViewDetails(order)
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[#262A33] flex items-center gap-2 cursor-pointer text-[#F2F4F7]"
                  >
                    <Eye className="size-3.5 text-[#8A93A3]" />
                    <span>Voir ticket complet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false)
                      onPrintTicket(order)
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[#262A33] flex items-center gap-2 cursor-pointer text-[#F2F4F7]"
                  >
                    <Printer className="size-3.5 text-[#8A93A3]" />
                    <span>Imprimer le ticket</span>
                  </button>

                  {order.status === 'preparing' && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false)
                        onTransition(order.orderRef, 'pending')
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-[#262A33] flex items-center gap-2 cursor-pointer text-[#8A93A3] hover:text-[#F2F4F7]"
                    >
                      <RotateCcw className="size-3.5" />
                      <span>Revenir à préparer</span>
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false)
                        onTransition(order.orderRef, 'preparing')
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-[#262A33] flex items-center gap-2 cursor-pointer text-[#8A93A3] hover:text-[#F2F4F7]"
                    >
                      <RotateCcw className="size-3.5" />
                      <span>Revenir en cuisson</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-[#262A33]" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false)
                      onCancel(order.orderRef)
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[#EF4444]/10 text-[#EF4444] flex items-center gap-2 cursor-pointer font-bold"
                  >
                    <XCircle className="size-3.5" />
                    <span>Annuler la commande</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LIGNE 2 : CLIENT (+ QUARTIER) À GAUCHE, TOTAL EN F CFA À DROITE */}
        <div className="px-3 py-2 border-b border-[#262A33]/60 flex items-center justify-between text-sm text-[#8A93A3]">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="font-semibold text-[#F2F4F7] truncate">
              {order.customerName}
            </span>
            {neighborhood && (
              <span className="text-[#8A93A3] truncate">
                · {neighborhood}
              </span>
            )}
          </div>

          <span className="font-mono font-bold text-[#F2F4F7] shrink-0 ml-2">
            {formatFcfa(order.totalAmount)}
          </span>
        </div>

        {/* NOTE DE COMMANDE : Texte blanc avec petite icône accent, SANS fond coloré */}
        {order.notes && (
          <div className="px-3 py-2 border-b border-[#262A33]/60 flex items-start gap-1.5 text-xs leading-snug">
            <MessageSquare className="size-3.5 shrink-0 mt-0.5 text-[#F59E0B]" />
            <span className="line-clamp-2 break-words font-medium text-[#F2F4F7]">
              {order.notes}
            </span>
          </div>
        )}

        {/* PLATS DU TICKET (BARRABLES AU CLIC) */}
        <div className="divide-y divide-[#262A33]/40">
          {order.items.map((item, idx) => (
            <TicketItemLine
              key={idx}
              item={item}
              index={idx}
              isDone={doneItems.has(idx)}
              onToggleDone={toggleItem}
            />
          ))}
        </div>
      </div>

      {/* PIED : BOUTON PRINCIPAL (48PX DE HAUT)
          - Colonnes 1 & 2 : Fond accent #F59E0B, texte noir
          - Colonne PRÊT : Contour gris pour ne pas dominer */}
      <div className="p-2.5 border-t border-[#262A33]">
        <button
          type="button"
          onClick={handleNextAction}
          className={`w-full h-12 rounded-md text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
            isReadyColumn
              ? 'border border-[#262A33] bg-[#181B22] hover:bg-[#262A33] text-[#F2F4F7] font-semibold'
              : 'bg-[#F59E0B] hover:bg-[#D97706] text-[#000000] font-black shadow-sm'
          }`}
        >
          <span>{actionText}</span>
          <span className="font-mono text-xs opacity-75">→</span>
        </button>
      </div>
    </article>
  )
}
