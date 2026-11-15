import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { KdsOrder } from '../../types/kds'

/** Bandeau toujours visible : les plats à lancer, cumulés, pour cuisiner par lots. */
export const KdsProduceBar: React.FC<{ orders: KdsOrder[] }> = ({ orders }) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const { dishes, total } = useMemo(() => {
    const byName = new Map<string, { name: string; quantity: number }>()
    orders
      .filter((o) => o.status === 'pending' || o.status === 'preparing')
      .forEach((o) => {
        o.items.forEach((item) => {
          const key = item.name.toLowerCase().trim()
          const entry = byName.get(key) ?? { name: item.name, quantity: 0 }
          entry.quantity += item.quantity
          byName.set(key, entry)
        })
      })
    const list = [...byName.values()].sort((a, b) => b.quantity - a.quantity)
    return { dishes: list, total: list.reduce((sum, dish) => sum + dish.quantity, 0) }
  }, [orders])

  return (
    <div className="relative z-20 flex h-12 shrink-0 select-none items-center gap-3 border-b border-line bg-canvas px-4 text-left text-ink">
      <div className="relative shrink-0" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className="-ml-2 flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-raised hover:text-ink"
        >
          À produire
          <strong className="font-semibold tabular-nums text-ink">{total}</strong>
          <ChevronDown className={`size-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="kds-grid-scroll absolute left-0 top-full z-50 mt-1 max-h-96 w-80 rounded-xl border border-line bg-surface shadow-2xl">
            {dishes.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-soft">Aucun plat en cours</p>
            ) : (
              <ul className="p-1.5">
                {dishes.map((dish) => (
                  <li
                    key={dish.name}
                    className="flex items-center justify-between gap-3 rounded-md px-2.5 py-2 text-sm"
                  >
                    <span className="truncate">{dish.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-bmc-gold">{dish.quantity}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Les plats qui ne tiennent pas passent à la ligne, masquée : la liste complète est au-dessus */}
      <ul className="flex h-7 min-w-0 flex-1 flex-wrap items-center gap-x-4 overflow-hidden text-[13px] leading-7">
        {dishes.map((dish) => (
          <li key={dish.name} className="whitespace-nowrap">
            <span className="font-semibold tabular-nums text-bmc-gold">{dish.quantity}</span>{' '}
            <span className="text-ink">{dish.name}</span>
          </li>
        ))}
        {dishes.length === 0 && <li className="text-ink-faint">Aucun plat à lancer</li>}
      </ul>
    </div>
  )
}
