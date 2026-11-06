import React, { useMemo, useState } from 'react'
import {
  Bike,
  ShoppingBag,
  Utensils,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Archive,
} from 'lucide-react'
import type { ColumnDefinition, KdsOrder, KdsOrderStatus, OrderType } from '../types/kds'
import { KanbanColumn } from '../components/kds/KanbanColumn'
import { OrderCard } from '../components/kds/OrderCard'

interface KdsPageProps {
  orders: KdsOrder[]
  nowMs: number
  searchQuery: string
  onTransition: (orderRef: string, nextStatus: KdsOrderStatus) => void
  onCancel: (orderRef: string) => void
  onViewDetails: (order: KdsOrder) => void
  onPrintTicket: (order: KdsOrder) => void
}

export const KDS_COLUMNS: ColumnDefinition[] = [
  {
    id: 'pending',
    title: '1. À préparer',
    subtitle: 'En attente de prise en charge',
    badgeColor: '#262A33',
    borderColor: '#262A33',
    actionLabel: 'Lancer la préparation',
    actionClass: '',
    nextStatus: 'preparing',
    emptyMessage: 'Aucune commande à préparer',
  },
  {
    id: 'preparing',
    title: '2. En préparation',
    subtitle: 'En cuisson / au gril',
    badgeColor: '#262A33',
    borderColor: '#262A33',
    actionLabel: 'Marquer prêt',
    actionClass: '',
    nextStatus: 'ready',
    emptyMessage: 'Aucune commande en cuisson',
  },
  {
    id: 'ready',
    title: '3. Prêt au comptoir',
    subtitle: 'À servir ou départ coursier',
    badgeColor: '#262A33',
    borderColor: '#262A33',
    actionLabel: 'Remettre / Servir',
    actionClass: '',
    nextStatus: 'delivered',
    emptyMessage: 'Aucune commande prête',
  },
]

export const KdsPage: React.FC<KdsPageProps> = ({
  orders,
  nowMs,
  searchQuery,
  onTransition,
  onCancel,
  onViewDetails,
  onPrintTicket,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')
  const [typeFilter, setTypeFilter] = useState<'all' | OrderType>('all')
  const [isSummaryExpanded, setIsSummaryExpanded] = useState<boolean>(true)

  // 1. Filtrage par recherche textuelle (réf, nom client, téléphone, plat)
  const searchedOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders
    const q = searchQuery.toLowerCase()
    return orders.filter((o) => {
      const matchRef = o.orderRef.toLowerCase().includes(q)
      const matchName = o.customerName.toLowerCase().includes(q)
      const matchPhone = o.phone.toLowerCase().includes(q)
      const matchAddress = o.address.toLowerCase().includes(q)
      const matchItems = o.items.some((i) => i.name.toLowerCase().includes(q))
      return matchRef || matchName || matchPhone || matchAddress || matchItems
    })
  }, [orders, searchQuery])

  // 2. Filtrage par type de commande
  const typeFilteredOrders = useMemo(() => {
    if (typeFilter === 'all') return searchedOrders
    return searchedOrders.filter((o) => o.orderType === typeFilter)
  }, [searchedOrders, typeFilter])

  // 3. Répartition des commandes par colonne Kanban (tri FIFO strict)
  const ordersByStatus = useMemo(() => {
    const map: Record<KdsOrderStatus, KdsOrder[]> = {
      pending: [],
      preparing: [],
      ready: [],
      delivering: [],
      delivered: [],
      cancelled: [],
    }

    typeFilteredOrders.forEach((o) => {
      if (map[o.status]) {
        map[o.status].push(o)
      }
    })

    // Intégrer les commandes "delivering" dans la colonne Prêt / Remise
    const readyGroup = [...map['ready'], ...map['delivering']]
    map['ready'] = readyGroup

    // Tri FIFO : la plus ancienne en premier
    Object.keys(map).forEach((k) => {
      map[k as KdsOrderStatus].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    })

    return map
  }, [typeFilteredOrders])

  // 4. Sommaire de production cumulée (plats à cuire au total)
  const productionSummary = useMemo(() => {
    const activeOrders = searchedOrders.filter(
      (o) => o.status === 'pending' || o.status === 'preparing',
    )
    const itemMap: Record<string, { name: string; quantity: number }> = {}

    activeOrders.forEach((o) => {
      o.items.forEach((item) => {
        const key = item.name.toLowerCase().trim()
        if (!itemMap[key]) {
          itemMap[key] = { name: item.name, quantity: 0 }
        }
        itemMap[key].quantity += item.quantity
      })
    })

    const list = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity)
    const totalDishes = list.reduce((s, i) => s + i.quantity, 0)

    return { list, totalDishes }
  }, [searchedOrders])

  // Comptages
  const activeCount = useMemo(() => {
    return searchedOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length
  }, [searchedOrders])

  const deliveredOrders = useMemo(() => {
    return typeFilteredOrders.filter((o) => o.status === 'delivered')
  }, [typeFilteredOrders])

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden text-left bg-[#0F1115] font-sans text-[#E6E8EC] select-none kds-no-hscroll">
      {/* 1. BARRE D'OUTILS ET FILTRES (Fine, sombre, sans dégradé) */}
      <div className="h-10 min-h-10 px-3 border-b border-[#262A33] bg-[#171A21] flex items-center justify-between gap-3 shrink-0">
        {/* Navigation Actives / Terminées */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-[#262A33] text-[#E6E8EC]'
                : 'text-[#8B93A1] hover:text-[#E6E8EC]'
            }`}
          >
            <span>En cours</span>
            <span
              className={`font-mono text-[11px] px-1 rounded ${
                activeTab === 'active' ? 'bg-[#0F1115] text-[#E8A33D]' : 'text-[#8B93A1]'
              }`}
            >
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-[#262A33] text-[#E6E8EC]'
                : 'text-[#8B93A1] hover:text-[#E6E8EC]'
            }`}
          >
            <Archive className="size-3 text-[#8B93A1]" />
            <span>Terminées</span>
            <span className="font-mono text-[11px] text-[#8B93A1]">
              {deliveredOrders.length}
            </span>
          </button>
        </div>

        {/* Filtre par type de commande */}
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors ${
              typeFilter === 'all'
                ? 'bg-[#262A33] text-[#E6E8EC]'
                : 'text-[#8B93A1] hover:text-[#E6E8EC]'
            }`}
          >
            Tous types
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('dine_in')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors flex items-center gap-1 ${
              typeFilter === 'dine_in'
                ? 'bg-[#262A33] text-[#E6E8EC]'
                : 'text-[#8B93A1] hover:text-[#E6E8EC]'
            }`}
            title="Sur place"
          >
            <Utensils className="size-3" />
            <span>Sur place</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('takeaway')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors flex items-center gap-1 ${
              typeFilter === 'takeaway'
                ? 'bg-[#262A33] text-[#E6E8EC]'
                : 'text-[#8B93A1] hover:text-[#E6E8EC]'
            }`}
            title="À emporter"
          >
            <ShoppingBag className="size-3" />
            <span>À emporter</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('delivery')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors flex items-center gap-1 ${
              typeFilter === 'delivery'
                ? 'bg-[#262A33] text-[#E6E8EC]'
                : 'text-[#8B93A1] hover:text-[#E6E8EC]'
            }`}
            title="Livraison"
          >
            <Bike className="size-3" />
            <span>Livraison</span>
          </button>
        </div>
      </div>

      {/* 2. BANDEAU DE SYNTHÈSE DE PRODUCTION CUMULÉE (Rétractable) */}
      {activeTab === 'active' && productionSummary.totalDishes > 0 && (
        <div className="border-b border-[#262A33] bg-[#12141A] px-3 py-1.5 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              <span className="text-[11px] font-semibold text-[#8B93A1] uppercase tracking-wider shrink-0 flex items-center gap-1">
                <span>À préparer :</span>
                <strong className="text-[#E8A33D] font-mono text-xs">
                  {productionSummary.totalDishes} {productionSummary.totalDishes > 1 ? 'plats' : 'plat'}
                </strong>
              </span>

              {isSummaryExpanded ? (
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {productionSummary.list.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#171A21] border border-[#262A33] text-xs text-[#E6E8EC] shrink-0"
                    >
                      <strong className="text-[#E8A33D] font-mono font-medium">{item.quantity}×</strong>
                      <span className="truncate max-w-[150px]">{item.name}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-[#8B93A1] truncate">
                  {productionSummary.list
                    .slice(0, 4)
                    .map((i) => `${i.quantity}× ${i.name}`)
                    .join(' · ')}
                  {productionSummary.list.length > 4 && ' …'}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
              className="p-1 text-[#8B93A1] hover:text-[#E6E8EC] rounded hover:bg-[#262A33] shrink-0 transition-colors cursor-pointer"
              title={isSummaryExpanded ? 'Réduire' : 'Déplier'}
            >
              {isSummaryExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* 3. COLONNES KDS (Aucune barre de défilement horizontale, défilement vertical indépendant) */}
      <div className="flex-1 min-h-0 overflow-hidden p-2.5 w-full">
        {activeTab === 'active' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 h-full w-full overflow-hidden">
            {KDS_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                definition={col}
                orders={ordersByStatus[col.id] || []}
                nowMs={nowMs}
                onTransition={onTransition}
                onCancel={onCancel}
                onViewDetails={onViewDetails}
                onPrintTicket={onPrintTicket}
              />
            ))}
          </div>
        ) : (
          /* Vue Commandes terminées */
          <div className="h-full overflow-y-auto overflow-x-hidden p-1 space-y-2 kds-column-scroll">
            {deliveredOrders.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-6 rounded border border-dashed border-[#262A33] bg-[#171A21] text-[#8B93A1] space-y-1">
                <CheckCircle2 className="size-6 text-[#5D6472]" />
                <p className="text-xs font-medium text-[#8B93A1]">
                  Aucune commande terminée
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {deliveredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    nowMs={nowMs}
                    onTransition={onTransition}
                    onCancel={onCancel}
                    onViewDetails={onViewDetails}
                    onPrintTicket={onPrintTicket}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
