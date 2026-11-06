import React from 'react'
import {
  Inbox,
  Flame,
  CheckCircle2,
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

  const totalItemsCount = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0,
  )

  const getColumnIcon = (id: KdsOrderStatus): LucideIcon => {
    switch (id) {
      case 'pending':
        return Inbox
      case 'preparing':
        return Flame
      case 'ready':
      default:
        return CheckCircle2
    }
  }

  const ColumnIcon = getColumnIcon(definition.id)

  return (
    <section
      className="flex flex-col rounded-xl border border-[#1A212D] bg-[#0A0D12] flex-1 min-w-0 w-full h-full overflow-hidden select-none"
      aria-label={`${definition.title} (${orders.length} commandes)`}
    >
      {/* En-tête de colonne sobre et harmonieux */}
      <header className="px-3.5 py-2.5 border-b border-[#1A212D] bg-[#121720] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ColumnIcon className="size-4 shrink-0 text-[#8C98AA]" />
          <h2 className="text-xs font-black text-white uppercase tracking-wider truncate">
            {definition.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {totalItemsCount > 0 && (
            <span className="hidden xl:inline text-[11px] font-mono text-[#64748B]">
              {totalItemsCount} plats
            </span>
          )}

          {orders.length > 0 && avgWaitMin > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#64748B]">
              <Clock className="size-3" />
              {avgWaitMin}m
            </span>
          )}

          <span
            className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
              orders.length > 0
                ? 'bg-[#1E2736] text-white border border-[#2B3749]'
                : 'bg-[#141A23] text-[#475569]'
            }`}
          >
            {orders.length}
          </span>
        </div>
      </header>

      {/* Liste des cartes défilable */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 no-scrollbar">
        {orders.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-[#1A212D] bg-[#0E1218]/40 text-[#475569] space-y-1">
            <ColumnIcon className="size-5 stroke-[1.5] text-[#334155]" />
            <p className="text-xs font-medium text-[#64748B]">{definition.emptyMessage}</p>
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
