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
import { formatDuration, formatFcfa, getElapsedSeconds, getUrgencyLevel } from '../../lib/formatters'
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
  const urgency = getUrgencyLevel(elapsedSec, thresholds)
  const durationText = formatDuration(elapsedSec)

  const isOverdue = urgency === 'danger'
  const isWarning = urgency === 'warning'

  const typeConfig = TYPE_CONFIG[order.orderType] || TYPE_CONFIG.delivery
  const TypeIcon = typeConfig.icon

  const displayRef = order.orderRef.replace(/^#?BMC-?/, '')
  const neighborhood = order.orderType === 'delivery' ? extractNeighborhood(order.address) : ''
  const isDelivery = order.orderType === 'delivery'

  // Étape suivante et couleur du bouton
  let actionText = 'LANCER LA CUISSON'
  let actionColor = 'bg-[#F59E0B] hover:bg-[#D97706] text-[#000000]'
  let nextStatus: KdsOrderStatus = 'preparing'

  if (order.status === 'preparing') {
    actionText = 'MARQUER PRÊT'
    actionColor = 'bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF]'
    nextStatus = 'ready'
  } else if (order.status === 'ready' || order.status === 'delivering') {
    actionText = isDelivery ? 'REMIS AU LIVREUR' : 'REMIS AU CLIENT'
    actionColor = 'bg-[#374151] hover:bg-[#4B5563] text-[#FFFFFF]'
    nextStatus = 'delivered'
  }

  const handleNextAction = () => {
    onTransition(order.orderRef, nextStatus)
  }

  return (
    <article
      className={`rounded-[10px] bg-[#1A1F27] text-left select-none flex flex-col justify-between shadow-md transition-shadow relative ${
        isOverdue ? 'border-2 border-[#EF4444]' : 'border border-[#262D38]'
      }`}
    >
      <div className="flex-1 flex flex-col">
        {/* LIGNE 1 : EN-TÊTE FLEX STRICT SANS CHEVAUCHEMENT */}
        <div className="px-3 py-2.5 flex items-center justify-between border-b border-[#262D38]">
          {/* GAUCHE : [#numéro (22px gras)] [pastille du type en gris] */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[22px] font-bold text-[#FFFFFF] tracking-tight shrink-0 leading-none">
              #{displayRef}
            </span>

            {/* Pastille neutre en gris (icône + texte, sans couleur vive) */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#262D38] text-[#9AA4B2] text-xs font-semibold shrink-0">
              <TypeIcon className="size-3 text-[#9AA4B2]" />
              <span>{typeConfig.label}</span>
            </span>
          </div>

          {/* DROITE : [chrono coloré uniquement] [menu ⋯] */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {isOverdue ? (
              <div
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#2D1214] border border-[#EF4444]/40 text-[#EF4444] font-mono text-base font-bold tabular-nums"
                role="alert"
                aria-label={`En retard de ${durationText}`}
              >
                <AlertTriangle className="size-3.5 stroke-[2.5]" />
                <span>{durationText}</span>
              </div>
            ) : (
              <span
                className={`font-mono text-base font-bold tabular-nums ${
                  isWarning ? 'text-[#F59E0B]' : 'text-[#9AA4B2]'
                }`}
              >
                {durationText}
              </span>
            )}

            {/* Menu ⋯ discret */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                className="p-1 rounded hover:bg-[#262D38] text-[#9AA4B2] hover:text-[#FFFFFF] cursor-pointer transition-colors"
                title="Options secondaires"
              >
                <MoreVertical className="size-4" />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-[#262D38] bg-[#1A1F27] shadow-2xl z-40 py-1 text-xs text-[#FFFFFF]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false)
                      onViewDetails(order)
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[#262D38] flex items-center gap-2 cursor-pointer"
                  >
                    <Eye className="size-3.5 text-[#9AA4B2]" />
                    <span>Voir ticket complet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false)
                      onPrintTicket(order)
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[#262D38] flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="size-3.5 text-[#9AA4B2]" />
                    <span>Imprimer le ticket</span>
                  </button>

                  {order.status === 'preparing' && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false)
                        onTransition(order.orderRef, 'pending')
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-[#262D38] flex items-center gap-2 cursor-pointer text-[#F59E0B]"
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
                      className="w-full px-3 py-2 text-left hover:bg-[#262D38] flex items-center gap-2 cursor-pointer text-[#F59E0B]"
                    >
                      <RotateCcw className="size-3.5" />
                      <span>Revenir en cuisson</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-[#262D38]" />

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

        {/* LIGNE 2 : CLIENT (+ QUARTIER) À GAUCHE, TOTAL EN F CFA À DROITE (14PX) */}
        <div className="px-3 py-2 border-b border-[#262D38]/60 flex items-center justify-between text-sm text-[#9AA4B2]">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="font-semibold text-[#FFFFFF] truncate">
              {order.customerName}
            </span>
            {neighborhood && (
              <span className="text-[#8B93A1] truncate">
                · {neighborhood}
              </span>
            )}
          </div>

          <span className="font-mono font-bold text-[#FFFFFF] shrink-0 ml-2">
            {formatFcfa(order.totalAmount)}
          </span>
        </div>

        {/* NOTE DE COMMANDE : BANDE AMBRE PÂLE (#3A2E12), TEXTE AMBRE (#F5C451), 2 LIGNES MAX */}
        {order.notes && (
          <div className="px-3 py-2 bg-[#3A2E12] text-[#F5C451] border-b border-[#524119] flex items-start gap-2 text-xs leading-snug">
            <MessageSquare className="size-3.5 shrink-0 mt-0.5 text-[#F5C451]" />
            <span className="line-clamp-2 break-words font-medium">
              {order.notes}
            </span>
          </div>
        )}

        {/* PLATS DU TICKET (BARRABLES AU CLIC) */}
        <div className="divide-y divide-[#262D38]/40">
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

      {/* PIED : BOUTON PLEINE LARGEUR (48PX DE HAUT, COULEUR ÉTAPE SUIVANTE) */}
      <div className="p-2.5 border-t border-[#262D38]">
        <button
          type="button"
          onClick={handleNextAction}
          className={`w-full h-12 rounded-md text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] shadow ${actionColor}`}
        >
          <span>{actionText}</span>
          <span className="font-mono text-xs">→</span>
        </button>
      </div>
    </article>
  )
}
