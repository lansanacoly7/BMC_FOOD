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
  Sparkles,
} from 'lucide-react'
import { formatDuration, formatFcfa, getElapsedSeconds, getUrgencyLevel } from '../../lib/formatters'
import { DEFAULT_KDS_THRESHOLDS, type ChronoThresholds } from '../../styles/kdsTokens'
import type { KdsOrder, KdsOrderStatus, OrderType } from '../../types/kds'
import { TicketItemLine } from './TicketItemLine'

interface OrderTicketProps {
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
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  delivery: { label: 'Livraison', icon: Bike, color: '#8B5CF6' },
  takeaway: { label: 'À emporter', icon: ShoppingBag, color: '#FB923C' },
  dine_in: { label: 'Sur place', icon: Utensils, color: '#14B8A6' },
}

function extractNeighborhood(address?: string): string {
  if (!address) return ''
  const cleaned = address.replace(/^Position GPS\s*:\s*/i, '').replace(/^Retrait sur place\s*[–-]\s*/i, '').trim()
  if (cleaned.startsWith('http')) return 'GPS'
  const firstPart = cleaned.split(/[,–\-(]/)[0]?.trim()
  return firstPart || ''
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  order,
  nowMs,
  thresholds = DEFAULT_KDS_THRESHOLDS,
  isMarkedNew = false,
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

  const isAllItemsDone = order.items.length > 0 && doneItems.size === order.items.length

  const elapsedSec = getElapsedSeconds(order.createdAt, nowMs)
  // Seuils configurables : 10 min (warning) et 15 min (danger/retard)
  const urgency = getUrgencyLevel(elapsedSec, thresholds)
  const durationText = formatDuration(elapsedSec)

  const typeConfig = TYPE_CONFIG[order.orderType] || TYPE_CONFIG.delivery
  const TypeIcon = typeConfig.icon

  const isOverdue = urgency === 'danger'
  const isWarning = urgency === 'warning'
  const isPreparing = order.status === 'preparing'

  // COULEUR ET STYLE DE L'EN-TÊTE ENTIER (PORTE L'ÉTAT DU TICKET)
  let headerBg = '#2F6FED'      // Nouveau : Bleu #2F6FED
  let headerTextColor = '#FFFFFF'
  let headerBlinkClass = ''

  if (isOverdue) {
    headerBg = '#E5362B'        // Retard : Rouge #E5362B
    headerTextColor = '#FFFFFF'
    headerBlinkClass = 'kds-animate-late'
  } else if (isWarning) {
    headerBg = '#F5B800'        // Attention : Jaune #F5B800
    headerTextColor = '#0E1116' // Texte noir sur jaune
  }

  // ACTION DU BOUTON PRINCIPAL & BUMP D'EN-TÊTE
  // À préparer → "LANCER LA CUISSON" (bleu)
  // En cuisson → "MARQUER PRÊTE" (vert)
  const nextStatus: KdsOrderStatus = isPreparing ? 'ready' : 'preparing'
  const actionButtonText = isPreparing ? 'MARQUER PRÊTE' : 'LANCER LA CUISSON'
  const actionButtonBg = isPreparing ? 'bg-[#1FA855] hover:bg-[#188B46]' : 'bg-[#2F6FED] hover:bg-[#2558BC]'

  const handleBump = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    onTransition(order.orderRef, nextStatus)
  }

  const displayRef = order.orderRef.replace(/^#?BMC-?/, '')
  const neighborhood = order.orderType === 'delivery' ? extractNeighborhood(order.address) : ''

  return (
    <article
      className="rounded-lg bg-[#1A1F27] border border-[#262D38] text-left select-none overflow-hidden flex flex-col justify-between shadow-md transition-shadow relative"
      style={{
        borderLeftWidth: '6px',
        borderLeftColor: typeConfig.color,
      }}
    >
      <div className="flex-1 flex flex-col">
        {/* 1. EN-TÊTE ENTIER COLORÉ SELON L'ÉTAT (CLICKABLE = BUMP BUMP-BAR) */}
        <div
          onClick={handleBump}
          className={`h-12 px-2.5 flex items-center justify-between cursor-pointer transition-colors relative select-none gap-1.5 ${headerBlinkClass}`}
          style={{ backgroundColor: headerBg, color: headerTextColor }}
          title="Cliquer pour faire avancer la commande d'une étape (Bump)"
        >
          {/* GAUCHE : #numéro 32px extra-gras (adaptatif tablette) + Pastille type */}
          <div className="flex items-center gap-1.5 min-w-0 shrink">
            <span className="font-mono text-[22px] lg:text-[24px] xl:text-[32px] font-black tracking-tight leading-none shrink-0 drop-shadow-sm">
              #{displayRef}
            </span>

            {/* Pastille type de commande dans l'en-tête */}
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] xl:text-[11px] font-black uppercase tracking-wider shrink-0 shadow-sm"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                color: headerTextColor,
              }}
              title={typeConfig.label}
            >
              <TypeIcon className="size-3 shrink-0" />
              <span className="hidden xl:inline">{typeConfig.label}</span>
            </span>

            {/* Badge NOUVEAU (uniquement pour les commandes récentes) */}
            {!isOverdue && !isWarning && (isMarkedNew || order.isNew) && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/35 text-[9px] font-extrabold uppercase tracking-wide shrink-0">
                <Sparkles className="size-2.5 shrink-0" />
                <span className="hidden xl:inline">Nouveau</span>
              </span>
            )}
          </div>

          {/* DROITE : Chrono mm:ss en grand (police tabulaire) + Menu ⋯ */}
          <div className="flex items-center gap-1 xl:gap-1.5 shrink-0 ml-auto">
            {isOverdue ? (
              <div
                className="flex items-center gap-1 font-black uppercase tracking-wide bg-black/30 px-1.5 py-0.5 rounded text-xs shrink-0"
                role="alert"
                aria-label={`En retard de ${durationText}`}
              >
                <AlertTriangle className="size-3 xl:size-3.5 stroke-[3] shrink-0" />
                <span className="text-[9px] xl:text-[10px] tracking-wider font-black">RETARD</span>
                <span className="font-mono text-sm xl:text-lg tabular-nums font-black">{durationText}</span>
              </div>
            ) : (
              <span className="font-mono text-sm xl:text-lg font-black tabular-nums tracking-tight">
                {durationText}
              </span>
            )}

            {/* Menu ⋯ discret */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu((prev) => !prev)
              }}
              className="p-1 rounded hover:bg-black/20 cursor-pointer transition-colors"
              title="Options secondaires"
            >
              <MoreVertical className="size-4" />
            </button>

            {/* Menu popup */}
            {showMenu && (
              <div
                className="absolute right-2 top-full mt-1 w-48 rounded-lg border border-[#262D38] bg-[#1A1F27] shadow-2xl z-40 py-1 text-xs text-[#FFFFFF]"
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

                {isPreparing && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false)
                      onTransition(order.orderRef, 'pending')
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[#262D38] flex items-center gap-2 cursor-pointer text-[#F5B800]"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Renvoyer à préparer</span>
                  </button>
                )}

                <div className="my-1 border-t border-[#262D38]" />

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false)
                    onCancel(order.orderRef)
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#E5362B]/10 text-[#E5362B] flex items-center gap-2 cursor-pointer font-bold"
                >
                  <XCircle className="size-3.5" />
                  <span>Annuler la commande</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. NOTE DE COMMANDE : BANDE JAUNE PÂLE SOUS L'EN-TÊTE (SI EXISTANTE) */}
        {order.notes && (
          <div className="px-3 py-1.5 bg-[#FEF3C7] text-[#1E293B] border-b border-[#F5B800]/40 flex items-start gap-1.5 text-[14px] font-bold leading-tight">
            <span className="shrink-0 uppercase text-[11px] font-black bg-[#F5B800] text-[#0E1116] px-1 py-0.2 rounded">
              NOTE
            </span>
            <span className="truncate">« {order.notes} »</span>
          </div>
        )}

        {/* 3. LIGNE CLIENT : NOM + QUARTIER (SI LIVRAISON) AVEC TOTAL EN F CFA À DROITE */}
        <div className="px-3 py-2 border-b border-[#262D38] bg-[#13171E] flex items-center justify-between text-xs text-[#9AA4B2]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-[#FFFFFF] text-sm truncate">
              {order.customerName}
            </span>
            {neighborhood && (
              <span className="text-[#9AA4B2] font-medium truncate">
                · {neighborhood}
              </span>
            )}
          </div>

          <span className="font-mono text-sm font-bold text-[#FFFFFF] shrink-0">
            {formatFcfa(order.totalAmount)}
          </span>
        </div>

        {/* 4. PLATS : ZONE TACTILE DE 56PX BARRABLE AU CLIC */}
        <div className="divide-y divide-[#262D38]/50">
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

      {/* 5. PIED : UN SEUL GROS BOUTON PLEINE LARGEUR (56PX DE HAUT, MAJUSCULES) */}
      <div className="p-2 border-t border-[#262D38] bg-[#13171E]">
        <button
          type="button"
          onClick={handleBump}
          className={`w-full h-14 min-h-[56px] rounded-md text-sm font-black uppercase tracking-wider text-[#FFFFFF] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] shadow-md ${actionButtonBg} ${
            isAllItemsDone ? 'kds-btn-pulse-ready ring-2 ring-[#1FA855]' : ''
          }`}
        >
          <span>{actionButtonText}</span>
          <span className="font-mono text-xs opacity-75">→</span>
        </button>
      </div>
    </article>
  )
}
