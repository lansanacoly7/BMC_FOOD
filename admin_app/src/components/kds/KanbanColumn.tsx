import React from 'react'
import {
  Inbox,
  Flame,
  CheckCircle2,
  Bike,
  Clock,
  UtensilsCrossed,
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

  const getColumnStyle = (id: KdsOrderStatus): { icon: LucideIcon; accent: string; badgeBg: string; text: string } => {
    switch (id) {
      case 'pending':
        return {
          icon: Inbox,
          accent: 'text-[#F5B301]',
          badgeBg: 'bg-[#F5B301] text-black',
          text: 'text-[#F5B301]',
        }
      case 'preparing':
        return {
          icon: Flame,
          accent: 'text-orange-400',
          badgeBg: 'bg-orange-500 text-white',
          text: 'text-orange-400',
        }
      case 'ready':
        return {
          icon: CheckCircle2,
          accent: 'text-emerald-400',
          badgeBg: 'bg-emerald-500 text-black',
          text: 'text-emerald-400',
        }
      case 'delivering':
        return {
          icon: Bike,
          accent: 'text-blue-400',
          badgeBg: 'bg-blue-500 text-white',
          text: 'text-blue-400',
        }
      default:
        return {
          icon: Inbox,
          accent: 'text-slate-400',
          badgeBg: 'bg-slate-700 text-white',
          text: 'text-slate-400',
        }
    }
  }

  const { icon: ColumnIcon, accent, badgeBg } = getColumnStyle(definition.id)

  return (
    <section
      className="flex flex-col rounded-xl border border-[#202734] bg-[#0E1218] flex-1 min-w-0 w-full h-full overflow-hidden select-none shadow-xs"
      aria-label={`${definition.title} (${orders.length} commandes)`}
    >
      {/* En-tête de colonne compact et haute lisibilité */}
      <header className="px-3.5 py-2.5 border-b border-[#1E2532] bg-[#141922] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ColumnIcon className={`size-4 shrink-0 ${accent}`} />
          <h2 className="text-xs font-black text-white uppercase tracking-wider truncate">
            {definition.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {totalItemsCount > 0 && (
            <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-mono text-[#8C9AA9]">
              <UtensilsCrossed className="size-3" />
              {totalItemsCount} plats
            </span>
          )}

          {orders.length > 0 && avgWaitMin > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#8C9AA9]">
              <Clock className="size-3" />
              {avgWaitMin}m
            </span>
          )}

          <span className={`px-2 py-0.5 rounded-full text-xs font-black font-mono ${badgeBg}`}>
            {orders.length}
          </span>
        </div>
      </header>

      {/* Liste des cartes défilable */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
        {orders.length === 0 ? (
          <div className="h-36 flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-[#202734] bg-[#12161E]/40 text-[#5F6875] space-y-1.5">
            <ColumnIcon className="size-5 stroke-[1.5] text-[#5F6875]" />
            <p className="text-xs font-semibold text-[#8C9AA9]">{definition.emptyMessage}</p>
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
