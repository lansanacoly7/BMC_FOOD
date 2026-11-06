import React from 'react'
import {
  Printer,
  Eye,
  Check,
  ArrowRight,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { formatDuration, formatFcfa, getElapsedSeconds, getUrgencyLevel } from '../../lib/formatters'
import type { KdsOrder, KdsOrderItem, KdsOrderStatus } from '../../types/kds'
import { OrderTypePill } from '../common/StatusPills'

interface OrderCardProps {
  order: KdsOrder
  nowMs: number
  onTransition: (orderRef: string, nextStatus: KdsOrderStatus) => void
  onCancel: (orderRef: string) => void
  onViewDetails: (order: KdsOrder) => void
  onPrintTicket: (order: KdsOrder) => void
}

/**
 * Associe l'image réelle du produit en fonction du premier article commandé
 */
function getOrderImage(items: KdsOrderItem[]): string {
  if (!items || items.length === 0) return '/images/products/tacos-viande-pane.webp'
  const name = (items[0].name || '').toLowerCase()

  if (name.includes('burger')) {
    if (name.includes('complet')) return '/images/products/burger-bmc-complet.webp'
    if (name.includes('poulet') || name.includes('crispy')) return '/images/products/burger-poulet-crispy.webp'
    return '/images/products/burger-cheese-simple.webp'
  }
  if (name.includes('wings') || name.includes('aile')) return '/images/products/chicken-wings-bbq.webp'
  if (name.includes('tender')) return '/images/products/tenders-poulet.webp'
  if (name.includes('chawarma') || name.includes('shawarma')) return '/images/products/sandwich-chawarma.webp'
  if (name.includes('frite')) return '/images/products/frites-maison.webp'
  if (name.includes('pastel')) return '/images/products/pastels-dakar.webp'
  if (name.includes('boisson') || name.includes('coca') || name.includes('jus')) return '/images/products/boissons-fraiches.webp'
  if (name.includes('cordon')) return '/images/products/tacos-cordon-bleu-pane.webp'
  if (name.includes('mixte')) return '/images/products/tacos-mixte-pane.webp'
  if (name.includes('poulet')) return '/images/products/tacos-poulet-pane.webp'
  return '/images/products/tacos-viande-pane.webp'
}


export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  nowMs,
  onTransition,
  onCancel: _onCancel,
  onViewDetails,
  onPrintTicket,
}) => {
  const elapsedSec = getElapsedSeconds(order.createdAt, nowMs)
  const urgency = getUrgencyLevel(elapsedSec)
  const durationText = formatDuration(elapsedSec)
  const orderImage = getOrderImage(order.items)

  const getPrimaryAction = () => {
    switch (order.status) {
      case 'pending':
        return {
          label: 'Lancer la cuisson',
          nextStatus: 'preparing' as KdsOrderStatus,
          colorClass: 'bg-[#F5B301] hover:bg-[#ffc32b] text-black font-extrabold',
        }
      case 'preparing':
        return {
          label: 'Marquer prête',
          nextStatus: 'ready' as KdsOrderStatus,
          colorClass: 'bg-[#F5B301] hover:bg-[#ffc32b] text-black font-extrabold',
        }
      case 'ready':
        return {
          label: order.orderType === 'delivery' ? 'Remettre au livreur' : 'Servir / Remettre',
          nextStatus: 'delivered' as KdsOrderStatus,
          colorClass: 'bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold',
        }
      case 'delivering':
        return {
          label: 'Confirmer livraison',
          nextStatus: 'delivered' as KdsOrderStatus,
          colorClass: 'bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold',
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
      className={`rounded-2xl border bg-[#12151A] text-left transition-all duration-150 select-none overflow-hidden flex flex-col justify-between ${
        isDanger
          ? 'border-red-500/70 shadow-lg shadow-red-500/10'
          : 'border-[#1F242B] hover:border-[#2E3642] shadow-sm'
      }`}
      aria-label={`Commande ${order.orderRef}`}
    >
      {/* 1. EN-TÊTE DU TICKET : Référence, Chrono & Badges sur 2 lignes nettes */}
      <div className="p-4 border-b border-[#1A1F26] space-y-2.5">
        {/* Ligne 1 : Référence (#BMC-XXXXXX) + Chrono d'attente */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-base font-black text-white tracking-tight whitespace-nowrap">
            {order.orderRef}
          </span>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold tabular-nums whitespace-nowrap ${
                isDanger
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-[#1A1E24] text-[#8A93A0] border border-[#232830]'
              }`}
            >
              <Clock className="size-3" />
              {durationText}
            </span>

            <button
              type="button"
              onClick={() => onPrintTicket(order)}
              className="p-1 rounded text-[#5F6875] hover:text-white transition-colors cursor-pointer"
              title="Imprimer ticket"
            >
              <Printer className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onViewDetails(order)}
              className="p-1 rounded text-[#5F6875] hover:text-white transition-colors cursor-pointer"
              title="Détails complets"
            >
              <Eye className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Ligne 2 : Type de commande (Pill) + Nom du client */}
        <div className="flex items-center gap-2">
          <OrderTypePill type={order.orderType} />
          <span className="text-xs text-[#8A93A0] font-medium truncate">
            {order.customerName}
          </span>
        </div>
      </div>

      {/* 2. CORPS : VISUEL DU PLAT ET LISTE DES ARTICLES */}
      <div className="p-4 flex-1 space-y-3">
        <div className="flex items-start gap-3">
          {/* Miniature photo haute définition du plat */}
          <div className="relative size-14 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10 shadow-xs">
            <img
              src={orderImage}
              alt={order.orderRef}
              className="size-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/images/products/tacos-viande-pane.webp'
              }}
            />
          </div>

          {/* Liste des articles */}
          <ul className="flex-1 space-y-2 min-w-0" aria-label="Articles">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs">
                <span className="px-1.5 py-0.2 rounded text-[11px] font-mono font-black bg-[#1A1E24] text-[#F5B301] border border-[#232830] shrink-0 mt-0.5">
                  {item.quantity}×
                </span>
                <span className="text-white font-semibold text-sm leading-snug">
                  {item.name}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Consigne client discrète si présente */}
        {order.notes && (
          <div className="p-2 rounded-lg bg-[#18150C] border border-[#F5B301]/25 flex items-start gap-1.5 text-xs text-[#E5B54F]">
            <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
            <span className="italic leading-relaxed">« {order.notes} »</span>
          </div>
        )}
      </div>

      {/* 3. BAS DE CARTE : MONTANT & GROS BOUTON PLEINE LARGEUR */}
      <div className="p-4 border-t border-[#1A1F26] bg-[#0E1115] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-[#5F6875] tracking-wider">Total</span>
          <span className="text-base font-black font-mono text-[#F5B301]">
            {formatFcfa(order.totalAmount)}
          </span>
        </div>

        {primaryAction && !isDelivered ? (
          <button
            type="button"
            onClick={() => onTransition(order.orderRef, primaryAction.nextStatus)}
            className={`w-full py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm ${primaryAction.colorClass}`}
          >
            <span>{primaryAction.label}</span>
            <ArrowRight className="size-4" />
          </button>
        ) : isDelivered ? (
          <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-500/20">
            <Check className="size-3.5" />
            <span>Commande clôturée</span>
          </div>
        ) : null}
      </div>
    </article>
  )
}

