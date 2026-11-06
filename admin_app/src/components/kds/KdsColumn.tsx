import React from 'react'
import type { ChronoThresholds, KdsOrder, KdsOrderStatus } from '../../types/kds'
import { OrderTicket } from './OrderTicket'

interface KdsColumnProps {
  title: string
  count: number
  orders: KdsOrder[]
  nowMs: number
  thresholds?: ChronoThresholds
  emptyMessage: string
  onTransition: (orderRef: string, nextStatus: KdsOrderStatus) => void
  onCancel: (orderRef: string) => void
  onViewDetails: (order: KdsOrder) => void
  onPrintTicket: (order: KdsOrder) => void
}

export const KdsColumn: React.FC<KdsColumnProps> = ({
  title,
  count,
  orders,
  nowMs,
  thresholds,
  emptyMessage,
  onTransition,
  onCancel,
  onViewDetails,
  onPrintTicket,
}) => {
  return (
    <section className="flex-1 min-w-0 h-full flex flex-col bg-[#13151A] border border-[#262A33] rounded-lg overflow-hidden shadow-sm">
      {/* EN-TÊTE DE COLONNE NEUTRE : Titre en blanc, compteur en gris dans une petite pastille, AUCUNE couleur */}
      <div className="h-10 px-3.5 flex items-center justify-between shrink-0 select-none bg-[#181B22] border-b border-[#262A33]">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-[#F2F4F7]">
          {title}
        </span>
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#262A33] text-[#8A93A3]">
          {count}
        </span>
      </div>

      {/* LISTE DES TICKETS (DÉFILEMENT VERTICAL INDÉPENDANT) */}
      <div className="flex-1 min-h-0 p-2 overflow-y-auto kds-grid-scroll space-y-2.5">
        {orders.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-xs text-[#5E6676] italic select-none">
            {emptyMessage}
          </div>
        ) : (
          orders.map((order) => (
            <OrderTicket
              key={order.id}
              order={order}
              nowMs={nowMs}
              thresholds={thresholds}
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
