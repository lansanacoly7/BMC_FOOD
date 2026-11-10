import React, { useEffect, useMemo, useState } from 'react'
import {
  X,
  Search,
  CheckCircle2,
  XCircle,
  Printer,
  Eye,
  Bike,
  ShoppingBag,
  Utensils,
  History,
} from 'lucide-react'
import { formatDateTime, formatFcfa } from '../../lib/formatters'
import type { KdsOrder, OrderType } from '../../types/kds'

interface OrderHistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  orders: KdsOrder[]
  onViewDetails: (order: KdsOrder) => void
  onPrintTicket: (order: KdsOrder) => void
}

const TYPE_CONFIG: Record<
  OrderType,
  { label: string; icon: React.FC<{ className?: string }> }
> = {
  delivery: { label: 'Livraison', icon: Bike },
  takeaway: { label: 'À emporter', icon: ShoppingBag },
  dine_in: { label: 'Sur place', icon: Utensils },
}

export const OrderHistoryDrawer: React.FC<OrderHistoryDrawerProps> = ({
  isOpen,
  onClose,
  orders,
  onViewDetails,
  onPrintTicket,
}) => {
  const [filter, setFilter] = useState<'all' | 'delivered' | 'cancelled'>('all')
  const [search, setSearch] = useState<string>('')

  // Touche Échap pour fermer le tiroir
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Filtrer uniquement les commandes livrées ou annulées
  const historyOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'delivered' || o.status === 'cancelled',
    )
  }, [orders])

  const filteredOrders = useMemo(() => {
    return historyOrders.filter((o) => {
      const matchFilter = filter === 'all' || o.status === filter
      if (!matchFilter) return false

      if (!search.trim()) return true
      const q = search.toLowerCase()
      const matchRef = o.orderRef.toLowerCase().includes(q)
      const matchName = o.customerName.toLowerCase().includes(q)
      const matchPhone = o.phone.toLowerCase().includes(q)
      const matchItems = o.items.some((i) => i.name.toLowerCase().includes(q))
      return matchRef || matchName || matchPhone || matchItems
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [historyOrders, filter, search])

  const deliveredCount = useMemo(
    () => historyOrders.filter((o) => o.status === 'delivered').length,
    [historyOrders],
  )
  const cancelledCount = useMemo(
    () => historyOrders.filter((o) => o.status === 'cancelled').length,
    [historyOrders],
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-drawer-title"
    >
      <div
        className="w-full max-w-lg h-full flex flex-col border-l border-line bg-canvas text-ink font-sans shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* EN-TÊTE FIXE */}
        <div className="p-3.5 border-b border-line bg-surface flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <History className="size-4 text-bmc-gold" />
            <h2 id="history-drawer-title" className="font-display text-lg font-bold text-ink">
              Historique des commandes ({historyOrders.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-raised transition-colors cursor-pointer"
            title="Fermer (Échap)"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* BARRE DE RECHERCHE ET FILTRES */}
        <div className="p-3 border-b border-line bg-canvas flex flex-col gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-soft" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par #réf, client, plat..."
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-canvas border border-line text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-bmc-gold transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-raised text-ink font-semibold'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Toutes ({historyOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('delivered')}
              className={`px-2.5 py-1 rounded-lg text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filter === 'delivered'
                  ? 'bg-raised text-ink font-semibold'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <CheckCircle2 className="size-3 text-ink-soft" />
              <span>Remises ({deliveredCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('cancelled')}
              className={`px-2.5 py-1 rounded-lg text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filter === 'cancelled'
                  ? 'bg-raised text-ink font-semibold'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <XCircle className="size-3 text-bad" />
              <span>Annulées ({cancelledCount})</span>
            </button>
          </div>
        </div>

        {/* LISTE DES COMMANDES ARCHIVÉES */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 kds-grid-scroll">
          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-xs text-ink-soft">
              Aucune commande trouvée dans l'historique
            </div>
          ) : (
            filteredOrders.map((order) => {
              const typeCfg = TYPE_CONFIG[order.orderType] || TYPE_CONFIG.delivery
              const TypeIcon = typeCfg.icon
              const isDelivered = order.status === 'delivered'
              const displayRef = order.orderRef.replace(/^#?BMC-?/, '#')

              return (
                <div
                  key={order.id}
                  className="rounded-lg border border-line bg-surface p-3 flex flex-col gap-2 hover:border-field transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-xs font-bold text-ink">
                        {displayRef}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs bg-canvas text-ink-soft border border-line">
                        <TypeIcon className="size-2.5" />
                        <span>{typeCfg.label}</span>
                      </span>
                    </div>

                    {isDelivered ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-raised text-ink">
                        <CheckCircle2 className="size-3 text-ink-soft" />
                        <span>Remise</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-bad-soft text-bad">
                        <XCircle className="size-3 text-bad" />
                        <span>Annulée</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-ink-soft">
                    <span className="font-medium text-ink truncate">
                      {order.customerName}
                    </span>
                    <span className="text-[13px] text-ink-faint">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="text-xs text-ink-soft line-clamp-2">
                    {order.items.map((i) => `${i.quantity}× ${i.name}`).join(' · ')}
                  </div>

                  <div className="pt-2 border-t border-line flex items-center justify-between gap-2">
                    <span className="tabular-nums text-xs font-bold text-ink">
                      {formatFcfa(order.totalAmount)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewDetails(order)}
                        className="px-2 py-1 rounded-lg bg-canvas hover:bg-raised border border-line text-[13px] text-ink flex items-center gap-1 cursor-pointer transition-colors"
                        title="Voir le ticket complet"
                      >
                        <Eye className="size-3 text-ink-soft" />
                        <span>Détails</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onPrintTicket(order)}
                        className="p-1 rounded-lg bg-canvas hover:bg-raised border border-line text-ink-soft hover:text-ink cursor-pointer transition-colors"
                        title="Imprimer le ticket"
                      >
                        <Printer className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

