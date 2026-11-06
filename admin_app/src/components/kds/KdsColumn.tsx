import React from 'react'
import type { ChronoThresholds, KdsOrder, KdsOrderStatus } from '../../types/kds'
import { OrderTicket } from './OrderTicket'

interface KdsColumnProps {
  title: string
  count: number
  headerBg: string
  headerTextColor?: string
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
  headerBg,
  headerTextColor = '#FFFFFF',
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
    <section className="flex-1 min-w-0 h-full flex flex-col bg-[#11141A] border border-[#262D38] rounded-lg overflow-hidden shadow-sm">
      {/* EN-TÊTE FIXE DE COLONNE (BANDEAU COLORÉ FIN) */}
      <div
        className="h-10 px-3 flex items-center justify-between shrink-0 select-none shadow-sm"
        style={{ backgroundColor: headerBg, color: headerTextColor }}
      >
        <span className="font-sans text-xs font-black uppercase tracking-wider">
          {title}
        </span>
        <span className="font-mono text-sm font-black px-2 py-0.5 rounded bg-black/25">
          {count}
        </span>
      </div>

      {/* LISTE DES TICKETS (DÉFILEMENT VERTICAL INDÉPENDANT) */}
      <div className="flex-1 min-h-0 p-2 overflow-y-auto kds-grid-scroll space-y-2.5">
        {orders.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-xs text-[#687385] italic select-none">
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
