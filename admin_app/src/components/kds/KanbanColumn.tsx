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
      className="flex flex-col rounded-lg border border-[#262A33] bg-[#0F1115] flex-1 min-w-0 w-full h-full overflow-hidden select-none"
      aria-label={`${definition.title} (${orders.length} commandes)`}
    >
      {/* En-tête de colonne sobre et neutre */}
      <header className="px-3 py-2 border-b border-[#262A33] bg-[#171A21] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ColumnIcon className="size-4 shrink-0 text-[#8B93A1]" />
          <h2 className="text-xs font-bold text-[#E6E8EC] uppercase tracking-wider truncate">
            {definition.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs">
          {totalItemsCount > 0 && (
            <span className="hidden lg:inline text-[11px] font-mono text-[#8B93A1]">
              {totalItemsCount} {totalItemsCount > 1 ? 'plats' : 'plat'}
            </span>
          )}

          {orders.length > 0 && avgWaitMin > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#8B93A1]">
              <Clock className="size-3" />
              {avgWaitMin}m
            </span>
          )}

          <span className="px-2 py-0.2 rounded font-mono text-xs font-bold bg-[#262A33] text-[#E6E8EC]">
            {orders.length}
          </span>
        </div>
      </header>

      {/* Défilement vertical STRICTEMENT indépendant pour chaque colonne (aucune barre horizontale) */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 space-y-2 kds-column-scroll">
        {orders.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-center p-4 rounded border border-dashed border-[#262A33] bg-[#171A21]/50 text-[#8B93A1] space-y-1">
            <ColumnIcon className="size-5 stroke-[1.5] text-[#5D6472]" />
            <p className="text-xs font-medium text-[#8B93A1]">{definition.emptyMessage}</p>
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
