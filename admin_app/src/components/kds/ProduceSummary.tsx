import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, UtensilsCrossed } from 'lucide-react'
import type { KdsOrder } from '../../types/kds'

interface ProduceSummaryProps {
  orders: KdsOrder[]
}

export const ProduceSummary: React.FC<ProduceSummaryProps> = ({ orders }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true)

  // Agréger les plats des commandes actives (pending + preparing)
  const { summaryList, totalCount } = useMemo(() => {
    const activeOrders = orders.filter(
      (o) => o.status === 'pending' || o.status === 'preparing',
    )
    const map: Record<string, { name: string; quantity: number }> = {}

    activeOrders.forEach((o) => {
      o.items.forEach((item) => {
        const key = item.name.toLowerCase().trim()
        if (!map[key]) {
          map[key] = { name: item.name, quantity: 0 }
        }
        map[key].quantity += item.quantity
      })
    })

    const list = Object.values(map).sort((a, b) => b.quantity - a.quantity)
    const total = list.reduce((sum, item) => sum + item.quantity, 0)

    return { summaryList: list, totalCount: total }
  }, [orders])

  return (
    <div className="flex-1 min-w-0 pr-3 border-r border-[#262D38] flex flex-col justify-center">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <UtensilsCrossed className="size-3.5 text-[#F5B800]" />
          <span className="text-[11px] font-black uppercase tracking-wider text-[#9AA4B2]">
            Total à produire
          </span>
          <span className="font-mono text-xs font-bold text-[#F5B800]">
            ({totalCount} {totalCount > 1 ? 'plats' : 'plat'})
          </span>
        </div>

        {totalCount > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1 rounded text-[#9AA4B2] hover:text-[#FFFFFF] hover:bg-[#262D38] transition-colors cursor-pointer"
            title={isExpanded ? 'Réduire' : 'Déplier'}
          >
            {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
          </button>
        )}
      </div>

      {totalCount === 0 ? (
        <div className="text-[11px] text-[#687385] italic">
          Aucun plat en cours de cuisson
        </div>
      ) : isExpanded ? (
        <div className="flex flex-wrap items-center gap-1.5 max-h-16 overflow-y-auto kds-grid-scroll">
          {summaryList.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0E1116] border border-[#262D38] text-xs text-[#FFFFFF]"
            >
              <strong className="text-[#F5B800] font-mono font-bold">{item.quantity}×</strong>
              <span className="truncate max-w-[150px]">{item.name}</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="text-xs text-[#9AA4B2] truncate">
          {summaryList
            .slice(0, 4)
            .map((i) => `${i.quantity}× ${i.name}`)
            .join(' · ')}
          {summaryList.length > 4 && ' …'}
        </div>
      )}
    </div>
  )
}
