import React from 'react'
import {
  Inbox,
  Flame,
  CheckCircle2,
  Bike,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import type { ColumnDefinition, KdsOrder, KdsOrderStatus } from '../../types/kds'
import { OrderCard } from './OrderCard'

interface KanbanColumnProps {
  definition: ColumnDefinition
  orders: KdsOrder[]
  nowMs: number
  onTransition: (orderRef: string, nextStatus: KdsOrderStatus) => void
  onCancel: (orderRef: string) => void
  onViewDetails: (order: KdsOrder) => void
  onPrintTicket: (order: KdsOrder) => void
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  definition,
  orders,
  nowMs,
  onTransition,
  onCancel,
  onViewDetails,
  onPrintTicket,
}) => {
  // Calcul du temps moyen d'attente dans cette colonne
  const avgWaitMin = orders.length > 0
    ? Math.round(
        orders.reduce((sum, o) => {
          const diff = (nowMs - new Date(o.createdAt).getTime()) / 60000
          return sum + (isNaN(diff) ? 0 : Math.max(0, diff))
        }, 0) / orders.length,
      )
    : 0

  // Icône distincte par colonne pour l'en-tête et l'état vide
  const getColumnIcon = (id: KdsOrderStatus): LucideIcon => {
    switch (id) {
      case 'pending':
        return Inbox
      case 'preparing':
        return Flame
      case 'ready':
        return CheckCircle2
      case 'delivering':
        return Bike
      default:
        return Inbox
    }
  }

  const ColumnIcon = getColumnIcon(definition.id)
  const hasOrders = orders.length > 0

  return (
    <section
      className="flex flex-col rounded-xl border flex-1 min-w-[340px] h-full overflow-hidden select-none snap-start"
      style={{
        backgroundColor: '#14171C',
        borderColor: '#232830',
      }}
      aria-label={`${definition.title} (${orders.length} commandes)`}
    >
      {/* EN-TÊTE FIXE DE COLONNE SANS BORDURE SUPÉRIEURE COLORÉE */}
      <header
        className="px-4 py-3 border-b flex flex-col gap-1 sticky top-0 z-10 shrink-0"
        style={{
          backgroundColor: '#14171C',
          borderColor: '#232830',
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ColumnIcon size={16} className="text-slate-400 shrink-0" />
            <h2
              className="text-sm font-black uppercase tracking-wider"
              style={{ color: '#F2F4F7' }}
            >
              {definition.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {hasOrders && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-bold font-tabular text-slate-400"
                title="Temps d'attente moyen des commandes de cette colonne"
              >
                <Clock size={11} />
                {avgWaitMin}&nbsp;m
              </span>
            )}

            {/* Compteur : pastille grise neutre, ambre uniquement si commandes présentes */}
            <span
              className="px-2 py-0.5 rounded-full text-xs font-black font-tabular transition-colors"
              style={{
                backgroundColor: hasOrders ? '#F5B301' : '#232830',
                color: hasOrders ? '#0B0D10' : '#9AA3AF',
              }}
            >
              {orders.length}
            </span>
          </div>
        </div>

        <p className="text-[11px] font-medium truncate" style={{ color: '#9AA3AF' }}>
          {definition.subtitle}
        </p>
      </header>

      {/* CONTENU AVEC SCROLL VERTICAL INDÉPENDANT */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0 kds-col-scroll">
        {!hasOrders ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none my-auto">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 border"
              style={{
                backgroundColor: '#1C2128',
                borderColor: '#232830',
                color: '#6C7684',
              }}
            >
              <ColumnIcon size={18} strokeWidth={1.75} />
            </div>
            <p className="text-xs font-semibold text-slate-400 max-w-[220px]">
              {definition.emptyMessage}
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              nowMs={nowMs}
              onTransition={onTransition}
              onCancel={onCancel}
              onViewDetails={onViewDetails}
              onPrintTicket={onPrintTicket}
            />
          ))
        )}
      </div>
    </section>
  )
}
