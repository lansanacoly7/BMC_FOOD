import React, { useMemo, useState } from 'react'
import {
  LayoutGrid,
  Columns3,
  CheckCircle2,
  Bike,
  ShoppingBag,
  Utensils,
  ChevronDown,
  ChevronUp,
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
    title: '1. À PRÉPARER',
    subtitle: 'Nouvelles commandes',
    badgeColor: '#1E2532',
    borderColor: '#1A1F28',
    actionLabel: 'Lancer cuisson',
    actionClass: '',
    nextStatus: 'preparing',
    emptyMessage: 'Aucune commande en attente',
  },
  {
    id: 'preparing',
    title: '2. EN CUISSON',
    subtitle: 'Sur le gril',
    badgeColor: '#1E2532',
    borderColor: '#1A1F28',
    actionLabel: 'Marquer prête',
    actionClass: '',
    nextStatus: 'ready',
    emptyMessage: 'Aucune cuisson en cours',
  },
  {
    id: 'ready',
    title: '3. PRÊT AU COMPTOIR',
    subtitle: 'À servir ou emballer',
    badgeColor: '#1E2532',
    borderColor: '#1A1F28',
    actionLabel: 'Terminer / Remise',
    actionClass: '',
    nextStatus: 'delivered',
    emptyMessage: 'Aucune commande prête au comptoir',
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
  const [layoutView, setLayoutView] = useState<'pipeline' | 'grid'>('pipeline')
  const [typeFilter, setTypeFilter] = useState<'all' | OrderType | 'delivered'>('all')
  const [isSummaryExpanded, setIsSummaryExpanded] = useState<boolean>(true)

  // 1. Filtrage par recherche
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

  // 2. Filtrage par type
  const filteredOrders = useMemo(() => {
    if (typeFilter === 'delivered') {
      return searchedOrders.filter((o) => o.status === 'delivered')
    }
    if (typeFilter === 'all') {
      return searchedOrders
    }
    return searchedOrders.filter((o) => o.orderType === typeFilter)
  }, [searchedOrders, typeFilter])

  // 3. Regroupement par colonne KDS
  const ordersByStatus = useMemo(() => {
    const map: Record<KdsOrderStatus, KdsOrder[]> = {
      pending: [],
      preparing: [],
      ready: [],
      delivering: [],
      delivered: [],
      cancelled: [],
    }

    filteredOrders.forEach((o) => {
      if (map[o.status]) {
        map[o.status].push(o)
      }
    })

    // Intégrer les éventuelles commandes delivering dans la colonne Prêt
    const readyAndDelivering = [...map['ready'], ...map['delivering']]
    map['ready'] = readyAndDelivering

    // Tri FIFO : les plus anciennes en premier
    Object.keys(map).forEach((k) => {
      map[k as KdsOrderStatus].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    })

    return map
  }, [filteredOrders])

  // 4. Sommaire de production cumulée (sobre et monochrome)
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

  // Comptages rapides
  const activeOrdersCount = useMemo(() => {
    return searchedOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length
  }, [searchedOrders])

  const deliveryCount = useMemo(() => {
    return searchedOrders.filter((o) => o.orderType === 'delivery' && o.status !== 'delivered' && o.status !== 'cancelled').length
  }, [searchedOrders])

  const takeawayCount = useMemo(() => {
    return searchedOrders.filter((o) => o.orderType === 'takeaway' && o.status !== 'delivered' && o.status !== 'cancelled').length
  }, [searchedOrders])

  const dineInCount = useMemo(() => {
    return searchedOrders.filter((o) => o.orderType === 'dine_in' && o.status !== 'delivered' && o.status !== 'cancelled').length
  }, [searchedOrders])

  const deliveredCount = useMemo(() => {
    return searchedOrders.filter((o) => o.status === 'delivered').length
  }, [searchedOrders])

  const gridOrders = useMemo(() => {
    if (typeFilter === 'delivered') {
      return ordersByStatus['delivered']
    }
    return filteredOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
  }, [typeFilter, filteredOrders, ordersByStatus])

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden text-left bg-[#0A0C10]">
      {/* 1. BARRE DE SYNTHÈSE DES PLATS : Monochrome & reposante */}
      {productionSummary.totalDishes > 0 && (
        <div className="border-b border-[#181D26] bg-[#0E1218] px-4 py-2 shrink-0 select-none">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar flex-1">
              <span className="text-xs font-semibold text-[#8590A2] uppercase tracking-wider shrink-0 mr-1">
                À cuire ({productionSummary.totalDishes}) :
              </span>

              {isSummaryExpanded ? (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {productionSummary.list.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#151922] border border-[#202734] text-xs text-white shrink-0"
                    >
                      <strong className="text-[#F5B301] font-mono">{item.quantity}×</strong>
                      <span className="truncate max-w-[160px] text-[#C2C9D6]">{item.name}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-[#6B7687] truncate">
                  {productionSummary.list.slice(0, 4).map((i) => `${i.quantity}× ${i.name}`).join(' · ')}
                  {productionSummary.list.length > 4 && '…'}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
              className="p-1 text-[#6B7687] hover:text-white rounded hover:bg-white/5 shrink-0 transition-colors"
              title={isSummaryExpanded ? 'Réduire' : 'Déplier'}
            >
              {isSummaryExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* 2. BARRE DE FILTRES : Sobres, unifiées, zéro effet arc-en-ciel */}
      <div className="h-11 min-h-11 px-4 border-b border-[#181D26] bg-[#0C0F14] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              typeFilter === 'all'
                ? 'bg-[#181D26] text-white border border-[#283140]'
                : 'text-[#6B7687] hover:text-[#C2C9D6]'
            }`}
          >
            <span>Toutes</span>
            <span className="font-mono text-[11px] text-[#8590A2]">
              {activeOrdersCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter('delivery')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              typeFilter === 'delivery'
                ? 'bg-[#181D26] text-white border border-[#283140]'
                : 'text-[#6B7687] hover:text-[#C2C9D6]'
            }`}
          >
            <Bike className="size-3 text-[#6B7687]" />
            <span>Livraison</span>
            {deliveryCount > 0 && (
              <span className="font-mono text-[11px] text-[#8590A2]">
                {deliveryCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter('takeaway')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              typeFilter === 'takeaway'
                ? 'bg-[#181D26] text-white border border-[#283140]'
                : 'text-[#6B7687] hover:text-[#C2C9D6]'
            }`}
          >
            <ShoppingBag className="size-3 text-[#6B7687]" />
            <span>À emporter</span>
            {takeawayCount > 0 && (
              <span className="font-mono text-[11px] text-[#8590A2]">
                {takeawayCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter('dine_in')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              typeFilter === 'dine_in'
                ? 'bg-[#181D26] text-white border border-[#283140]'
                : 'text-[#6B7687] hover:text-[#C2C9D6]'
            }`}
          >
            <Utensils className="size-3 text-[#6B7687]" />
            <span>Sur place</span>
            {dineInCount > 0 && (
              <span className="font-mono text-[11px] text-[#8590A2]">
                {dineInCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter('delivered')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              typeFilter === 'delivered'
                ? 'bg-[#181D26] text-white border border-[#283140]'
                : 'text-[#6B7687] hover:text-[#C2C9D6]'
            }`}
          >
            <span>Terminées</span>
            <span className="font-mono text-[11px] text-[#6B7687]">
              {deliveredCount}
            </span>
          </button>
        </div>

        {/* Sélecteur de vue épuré */}
        <div className="flex items-center gap-0.5 bg-[#12161E] p-0.5 rounded-lg border border-[#1E2532] shrink-0">
          <button
            type="button"
            onClick={() => setLayoutView('pipeline')}
            className={`p-1.5 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
              layoutView === 'pipeline'
                ? 'bg-[#1C2330] text-white'
                : 'text-[#6B7687] hover:text-white'
            }`}
            title="Vue 3 Colonnes"
          >
            <Columns3 className="size-3.5" />
            <span className="hidden sm:inline">Colonnes</span>
          </button>
          <button
            type="button"
            onClick={() => setLayoutView('grid')}
            className={`p-1.5 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
              layoutView === 'grid'
                ? 'bg-[#1C2330] text-white'
                : 'text-[#6B7687] hover:text-white'
            }`}
            title="Vue Grille"
          >
            <LayoutGrid className="size-3.5" />
            <span className="hidden sm:inline">Grille</span>
          </button>
        </div>
      </div>

      {/* 3. COLONNES KDS PRO */}
      <div className="flex-1 overflow-hidden p-3 w-full">
        {layoutView === 'pipeline' && typeFilter !== 'delivered' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-full w-full overflow-hidden">
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
          <div className="h-full overflow-y-auto pr-1 w-full">
            {gridOrders.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-[#1C212B] bg-[#10131A]/40 text-[#556070] space-y-2">
                <CheckCircle2 className="size-6 text-[#556070]" />
                <p className="text-sm font-medium text-[#7A8699]">
                  Aucune commande dans cette section
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 w-full">
                {gridOrders.map((order) => (
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
