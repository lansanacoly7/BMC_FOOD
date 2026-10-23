import React from 'react'
import { Bike, Utensils, ShoppingBag, Clock, AlertTriangle, AlertCircle } from 'lucide-react'
import type { OrderType, PaymentMethod, PaymentStatus, UrgencyLevel } from '../../types/kds'

interface TypePillProps {
  type: OrderType
}

export const OrderTypePill: React.FC<TypePillProps> = ({ type }) => {
  switch (type) {
    case 'delivery':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: '#1C2128',
            color: '#F2F4F7',
            border: '1px solid #232830',
          }}
        >
          <Bike size={13} strokeWidth={2.5} className="text-slate-400" />
          Livraison
        </span>
      )
    case 'dine_in':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: '#1C2128',
            color: '#F2F4F7',
            border: '1px solid #232830',
          }}
        >
          <Utensils size={13} strokeWidth={2.5} className="text-slate-400" />
          Sur place
        </span>
      )
    case 'takeaway':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: '#1C2128',
            color: '#F2F4F7',
            border: '1px solid #232830',
          }}
        >
          <ShoppingBag size={13} strokeWidth={2.5} className="text-slate-400" />
          À emporter
        </span>
      )
  }
}

interface PaymentPillProps {
  method: PaymentMethod
  status: PaymentStatus
}

export const PaymentPill: React.FC<PaymentPillProps> = ({ method, status }) => {
  const isPaid = status === 'paid'

  let label = 'Espèces'
  if (method === 'wave') label = 'Wave'
  else if (method === 'orange_money') label = 'Orange Money'

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium"
      style={{
        backgroundColor: '#14171C',
        border: '1px solid #232830',
        color: '#9AA3AF',
      }}
    >
      <span>{label}</span>
      <span
        className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded"
        style={{
          backgroundColor: isPaid ? '#1C2128' : 'rgba(239, 68, 68, 0.15)',
          color: isPaid ? '#F2F4F7' : '#EF4444',
          border: isPaid ? '1px solid #232830' : '1px solid rgba(239, 68, 68, 0.3)',
        }}
      >
        {isPaid ? 'Payé' : 'À régler'}
      </span>
    </span>
  )
}

interface ChronoBadgeProps {
  durationText: string
  urgency: UrgencyLevel
}

export const ChronoBadge: React.FC<ChronoBadgeProps> = ({ durationText, urgency }) => {
  // Retard critique (> 15 min) : rouge avec icône alerte et pulsation douce
  if (urgency === 'danger') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black font-tabular tracking-wider kds-pulse-danger-soft"
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.16)',
          color: '#EF4444',
          border: '1.5px solid #EF4444',
        }}
        title="Délai supérieur à 15 minutes (Retard critique)"
      >
        <AlertCircle size={14} strokeWidth={2.8} />
        {durationText}
      </span>
    )
  }

  // Attention (10 à 15 min) : ambre avec icône warning
  if (urgency === 'warning') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold font-tabular"
        style={{
          backgroundColor: 'rgba(245, 179, 1, 0.12)',
          color: '#F5B301',
          border: '1px solid rgba(245, 179, 1, 0.35)',
        }}
        title="Délai entre 10 et 15 minutes"
      >
        <AlertTriangle size={13} strokeWidth={2.5} />
        {durationText}
      </span>
    )
  }

  // Normal (< 10 min) : blanc/gris sobre
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium font-tabular"
      style={{
        backgroundColor: '#1C2128',
        color: '#9AA3AF',
        border: '1px solid #232830',
      }}
    >
      <Clock size={13} strokeWidth={2} />
      <span className="text-[#F2F4F7] font-semibold">{durationText}</span>
    </span>
  )
}
