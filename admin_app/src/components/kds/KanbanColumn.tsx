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
  const avgWaitMin =
    orders.length > 0
      ? Math.round(
          orders.reduce((sum, o) => {
            const diff = (nowMs - new Date(o.createdAt).getTime()) / 60000
            return sum + (isNaN(diff) ? 0 : Math.max(0, diff))
          }, 0) / orders.length,
        )
      : 0

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

  return (
    <section
      className="flex flex-col rounded-2xl border border-[#1F242B] bg-[#0E1115] flex-1 min-w-0 w-full h-full overflow-hidden select-none"
      aria-label={`${definition.title} (${orders.length} commandes)`}
    >
      {/* En-tête de colonne */}
      <header className="px-4 py-3 border-b border-[#1A1F26] bg-[#12151A] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <ColumnIcon className="size-4 text-[#F5B301]" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            {definition.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {orders.length > 0 && avgWaitMin > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#8A93A0]">
              <Clock className="size-3" />
              {avgWaitMin}m
            </span>
          )}

          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
              orders.length > 0
                ? 'bg-[#F5B301] text-black'
                : 'bg-[#1A1E24] text-[#5F6875]'
            }`}
          >
            {orders.length}
          </span>
        </div>
      </header>

      {/* Liste des cartes défilable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {orders.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-[#1F242B] bg-[#12151A]/40 text-[#5F6875] space-y-1">
            <ColumnIcon className="size-6 stroke-[1.5]" />
            <p className="text-xs font-medium text-[#8A93A0]">{definition.emptyMessage}</p>
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
