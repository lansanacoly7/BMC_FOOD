import React, { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { formatDuration, getElapsedSeconds } from '../../lib/formatters'
import { DEFAULT_KDS_THRESHOLDS, KDS_COMPACT_THRESHOLD } from '../../styles/kdsTokens'
import type { ChronoThresholds, KdsOrder, KdsOrderStatus } from '../../types/kds'
import { CompactTicket } from './CompactTicket'
import { OrderTicket } from './OrderTicket'

interface KdsOrderListProps {
  orders: KdsOrder[]
  nowMs: number
  thresholds?: ChronoThresholds
  emptyMessage: string
  doneItems: Record<string, number[]>
  onToggleItem: (orderId: string, itemIndex: number) => void
  onTransition: (orderRef: string, nextStatus: KdsOrderStatus) => void
  onCancel: (orderRef: string) => void
  onViewDetails: (order: KdsOrder) => void
  onPrintTicket: (order: KdsOrder) => void
}

/** Tickets de l'onglet ouvert, sur toute la largeur. Passe en compact quand la liste déborde. */
export const KdsOrderList: React.FC<KdsOrderListProps> = ({
  orders,
  nowMs,
  thresholds = DEFAULT_KDS_THRESHOLDS,
  emptyMessage,
  doneItems,
  onToggleItem,
  onTransition,
  onCancel,
  onViewDetails,
  onPrintTicket,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [hiddenBelow, setHiddenBelow] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const isCompact = orders.length > KDS_COMPACT_THRESHOLD
  const isLate = (order: KdsOrder) =>
    getElapsedSeconds(order.createdAt, nowMs) >= thresholds.dangerMinutes * 60
  const lateOrders = orders.filter(isLate)
  const onTimeOrders = orders.filter((order) => !isLate(order))

  // Compte les tickets situés sous le bas de la zone visible
  const updateHiddenBelow = () => {
    const scroller = scrollRef.current
    if (!scroller) return
    const bottom = scroller.getBoundingClientRect().bottom
    const tickets = scroller.querySelectorAll('[data-ticket]')
    setHiddenBelow([...tickets].filter((t) => t.getBoundingClientRect().top >= bottom).length)
  }

  useEffect(() => {
    const scroller = scrollRef.current
    const list = listRef.current
    if (!scroller || !list) return
    const observer = new ResizeObserver(updateHiddenBelow)
    observer.observe(scroller)
    observer.observe(list)
    return () => observer.disconnect()
  }, [])

  const renderTicket = (order: KdsOrder) => {
    const id = String(order.id)
    const elapsed = getElapsedSeconds(order.createdAt, nowMs)
    const isExpanded = expandedId === id

    return (
      <div key={order.id} data-ticket className="min-w-0">
        {isCompact && !isExpanded ? (
          <CompactTicket
            order={order}
            durationText={formatDuration(elapsed)}
            isOverdue={isLate(order)}
            onExpand={() => setExpandedId(id)}
            onTransition={onTransition}
          />
        ) : (
          <OrderTicket
            order={order}
            nowMs={nowMs}
            thresholds={thresholds}
            doneItems={doneItems[id] ?? []}
            onToggleItem={(itemIndex) => onToggleItem(id, itemIndex)}
            onCollapse={isCompact ? () => setExpandedId(null) : undefined}
            onTransition={onTransition}
            onCancel={onCancel}
            onViewDetails={onViewDetails}
            onPrintTicket={onPrintTicket}
          />
        )}
      </div>
    )
  }

  const groupHeadingClass =
    'sticky top-0 z-10 col-span-full flex h-7 items-center gap-1.5 bg-canvas px-1 text-[13px] font-semibold'

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} onScroll={updateHiddenBelow} className="kds-grid-scroll min-h-0 flex-1 px-3 py-3">
        <div
          ref={listRef}
          className={`grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] items-start ${
            isCompact ? 'gap-1.5' : 'gap-2.5'
          }`}
        >
          {orders.length === 0 ? (
            <div className="col-span-full flex h-40 select-none items-center justify-center rounded-xl border border-dashed border-line text-sm text-ink-faint">
              {emptyMessage}
            </div>
          ) : isCompact && lateOrders.length > 0 ? (
            <>
              {/* En mode dense, le rouge se concentre ici : un seul signal, pas un écran entier */}
              <h3 className={`${groupHeadingClass} text-bad`}>
                <AlertTriangle className="size-3.5" />
                {lateOrders.length} en retard
              </h3>
              {lateOrders.map(renderTicket)}
              {onTimeOrders.length > 0 && (
                <h3 className={`${groupHeadingClass} text-ink-soft`}>
                  {onTimeOrders.length} dans les temps
                </h3>
              )}
              {onTimeOrders.map(renderTicket)}
            </>
          ) : (
            orders.map(renderTicket)
          )}
        </div>
      </div>

      {hiddenBelow > 0 && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-14 bg-gradient-to-t from-canvas to-transparent" />
          <button
            type="button"
            onClick={() =>
              scrollRef.current?.scrollBy({
                top: scrollRef.current.clientHeight * 0.85,
                behavior: 'smooth',
              })
            }
            className="absolute bottom-2 left-1/2 z-20 flex h-9 -translate-x-1/2 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border border-line bg-raised pl-3.5 pr-2.5 text-[13px] font-semibold text-ink shadow-lg transition-colors hover:bg-[#34343A]"
          >
            +{hiddenBelow} {hiddenBelow > 1 ? 'commandes' : 'commande'}
            <ChevronDown className="size-4" />
          </button>
        </>
      )}
    </section>
  )
}
