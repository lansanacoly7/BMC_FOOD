import React from 'react'
import type { ChronoThresholds, KdsOrder, KdsOrderStatus } from '../../types/kds'
import { OrderTicket } from './OrderTicket'

interface TicketGridProps {
  orders: KdsOrder[]
  nowMs: number
  thresholds?: ChronoThresholds
  newOrdersSet: Set<string>
  onTransition: (orderRef: string, nextStatus: KdsOrderStatus) => void
  onCancel: (orderRef: string) => void
  onViewDetails: (order: KdsOrder) => void
  onPrintTicket: (order: KdsOrder) => void
}

export const TicketGrid: React.FC<TicketGridProps> = ({
  orders,
  nowMs,
  thresholds,
  newOrdersSet,
  onTransition,
  onCancel,
  onViewDetails,
  onPrintTicket,
}) => {
  // Uniquement les commandes actives (À préparer + En cuisson)
  // Triées du plus ancien (en haut à gauche) au plus récent
  const activeOrders = orders
    .filter((o) => o.status === 'pending' || o.status === 'preparing')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  if (activeOrders.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="size-16 rounded-full bg-[#1A1F27] border border-[#262D38] flex items-center justify-center text-[#9AA4B2] mb-3">
          ✓
        </div>
        <div className="text-base font-bold text-[#FFFFFF]">Toutes les commandes sont prêtes !</div>
        <div className="text-xs text-[#9AA4B2] mt-1">Aucune commande en attente sur le gril ou au comptoir.</div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 kds-grid-scroll kds-no-hscroll">
      {/* Grille responsive : 4 colonnes en 1080p (xl:), 3 colonnes en tablette (1024px) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full">
        {activeOrders.map((order) => {
          const isMarkedNew = newOrdersSet.has(order.orderRef)
          return (
            <div
              key={order.id}
              className={isMarkedNew ? 'kds-ticket-enter' : undefined}
            >
              <OrderTicket
                order={order}
                nowMs={nowMs}
                thresholds={thresholds}
                isMarkedNew={isMarkedNew}
                onTransition={onTransition}
                onCancel={onCancel}
                onViewDetails={onViewDetails}
                onPrintTicket={onPrintTicket}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
