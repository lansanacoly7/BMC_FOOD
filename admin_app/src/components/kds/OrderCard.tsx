import React from 'react'
import {
  MapPin,
  Phone,
  Flame,
  CheckCircle,
  Truck,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'

import { formatDuration, formatFcfa, getElapsedSeconds, getUrgencyLevel } from '../../lib/formatters'
import type { KdsOrder, KdsOrderStatus } from '../../types/kds'
import { ChronoBadge, OrderTypePill, PaymentPill } from '../common/StatusPills'
import { OrderActions } from './OrderActions'

interface OrderCardProps {
  order: KdsOrder
  nowMs: number
  onTransition: (orderRef: string, nextStatus: KdsOrderStatus) => void
  onCancel: (orderRef: string) => void
  onViewDetails: (order: KdsOrder) => void
  onPrintTicket: (order: KdsOrder) => void
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  nowMs,
  onTransition,
  onCancel,
  onViewDetails,
  onPrintTicket,
}) => {
  const elapsedSec = getElapsedSeconds(order.createdAt, nowMs)
  const urgency = getUrgencyLevel(elapsedSec)
  const durationText = formatDuration(elapsedSec)

  // Configuration du gros bouton d'action - Couleur Ambre unifiée pour l'action principale
  const getActionConfig = (status: KdsOrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'LANCER LA CUISSON',
          nextStatus: 'preparing' as KdsOrderStatus,
          icon: Flame,
        }
      case 'preparing':
        return {
          label: 'MARQUER PRÊT',
          nextStatus: 'ready' as KdsOrderStatus,
          icon: CheckCircle,
        }
      case 'ready':
        return {
          label: order.orderType === 'delivery' ? 'REMETTRE AU LIVREUR' : 'REMETTRE AU CLIENT',
          nextStatus: (order.orderType === 'delivery' ? 'delivering' : 'delivered') as KdsOrderStatus,
          icon: order.orderType === 'delivery' ? Truck : CheckCircle,
        }
      case 'delivering':
        return {
          label: 'CONFIRMER LIVRAISON',
          nextStatus: 'delivered' as KdsOrderStatus,
          icon: CheckCircle,
        }
      default:
        return null
    }
  }

  const action = getActionConfig(order.status)
  const isDanger = urgency === 'danger'

  return (
    <article
      className={`relative flex flex-col rounded-xl border transition-all duration-150 select-none ${
        isDanger ? 'kds-pulse-danger-soft' : ''
      }`}
      style={{
        backgroundColor: '#14171C',
        borderColor: isDanger ? '#EF4444' : '#232830',
      }}
      aria-label={`Commande ${order.orderRef} de ${order.customerName}`}
    >
      <div className="p-3.5 flex flex-col flex-1 gap-2.5">
        {/* LIGNE 1 : RÉFÉRENCE GÉANTE, BADGE TYPE & CHRONO */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xl font-black font-tabular tracking-tight"
              style={{ color: '#F2F4F7' }}
            >
              {order.orderRef}
            </span>
            <OrderTypePill type={order.orderType} />
            {order.isNew && (
              <span
                className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                style={{
                  backgroundColor: '#F5B301',
                  color: '#0B0D10',
                }}
              >
                NOUVEAU
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ChronoBadge durationText={durationText} urgency={urgency} />
            <OrderActions
              order={order}
              onViewDetails={() => onViewDetails(order)}
              onCancelOrder={() => onCancel(order.orderRef)}
              onPrintTicket={() => onPrintTicket(order)}
            />
          </div>
        </div>

        {/* LIGNE 2 : CLIENT, ADRESSE / TABLE & TÉLÉPHONE */}
        <div className="flex flex-col gap-0.5 pb-2 border-b" style={{ borderColor: '#232830' }}>
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-base font-black tracking-tight truncate"
              style={{ color: '#F2F4F7' }}
            >
              {order.customerName}
            </span>

            {order.phone && (
              <a
                href={`tel:${order.phone}`}
                className="flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded transition-colors shrink-0 text-slate-300 hover:text-white"
                style={{
                  backgroundColor: '#1C2128',
                  border: '1px solid #232830',
                }}
                title="Appeler le client"
              >
                <Phone size={11} className="text-slate-400" />
                <span>{order.phone}</span>
              </a>
            )}
          </div>

          {order.address && (
            <div className="flex items-center gap-1.5 text-xs font-medium truncate" style={{ color: '#9AA3AF' }}>
              <MapPin size={12} className="shrink-0 text-slate-500" />
              <span className="truncate">{order.address}</span>
            </div>
          )}
        </div>

        {/* CORPS : ARTICLES AVEC QUANTITÉ TRÈS VISIBLE */}
        <div className="flex-1 flex flex-col gap-1.5 py-0.5">
          <ul className="flex flex-col gap-1.5" aria-label="Articles de la commande">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex flex-col gap-0.5">
                <div className="flex items-start gap-2 text-sm font-semibold" style={{ color: '#F2F4F7' }}>
                  <span
                    className="px-1.5 py-0.2 rounded text-xs font-black font-tabular shrink-0 border"
                    style={{
                      backgroundColor: '#1C2128',
                      borderColor: '#232830',
                      color: '#F5B301',
                    }}
                  >
                    {item.quantity}×
                  </span>
                  <span className="leading-snug">{item.name}</span>
                </div>

                {item.options && item.options.length > 0 && (
                  <div className="ml-7 text-[11px] font-medium" style={{ color: '#9AA3AF' }}>
                    + {item.options.join(' · ')}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* NOTES SPÉCIALES & CONSIGNES EN ENCART DISCRET */}
          {order.notes && (
            <div
              className="mt-1.5 p-2 rounded-lg border flex items-start gap-1.5"
              style={{
                backgroundColor: 'rgba(245, 179, 1, 0.08)',
                borderColor: 'rgba(245, 179, 1, 0.25)',
              }}
            >
              <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold leading-snug" style={{ color: '#F2F4F7' }}>
                <span className="uppercase text-[10px] tracking-wider text-amber-400 font-black mr-1">
                  Note :
                </span>
                {order.notes}
              </div>
            </div>
          )}
        </div>

        {/* PIED DE CARTE : MONTANT F CFA + PAIEMENT */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: '#232830' }}>
          <span
            className="text-sm font-black font-tabular"
            style={{ color: '#F2F4F7' }}
          >
            {formatFcfa(order.totalAmount)}
          </span>

          <PaymentPill method={order.paymentMethod} status={order.paymentStatus} />
        </div>

        {/* GROS BOUTON D'ACTION 1-TAP UNIFIÉ EN AMBRE */}
        {action && (
          <button
            type="button"
            onClick={() => onTransition(order.orderRef, action.nextStatus)}
            className="w-full h-[46px] min-h-[46px] rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider transition-all transform active:scale-[0.98] select-none shadow-sm cursor-pointer"
            style={{
              backgroundColor: '#F5B301',
              color: '#0B0D10',
            }}
          >
            <action.icon size={16} strokeWidth={2.8} />
            <span>{action.label}</span>
            <ArrowRight size={15} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </article>
  )
}
