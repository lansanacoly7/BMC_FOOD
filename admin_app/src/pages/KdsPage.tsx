import React, { useMemo, useState } from 'react'
import {
  LayoutGrid,
  Columns3,
  CheckCircle2,
  Bike,
  ShoppingBag,
  Utensils,
  Flame,
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
    badgeColor: '#F5B301',
    borderColor: '#232830',
    actionLabel: 'Lancer cuisson',
    actionClass: '',
    nextStatus: 'preparing',
    emptyMessage: 'Aucune commande en attente',
  },
  {
    id: 'preparing',
    title: '2. EN CUISSON',
    subtitle: 'Au gril & cuisson',
    badgeColor: '#F97316',
    borderColor: '#232830',
    actionLabel: 'Marquer prête',
    actionClass: '',
    nextStatus: 'ready',
    emptyMessage: 'Aucune cuisson en cours',
  },
  {
    id: 'ready',
    title: '3. PRÊT AU COMPTOIR',
    subtitle: 'À servir ou emballer',
    badgeColor: '#10B981',
    borderColor: '#232830',
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

  // 2. Filtrage par type de commande (Livraison, Emporter, Sur place) ou statut
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

    // Dans la 3e colonne "Prêt au comptoir", intégrer également les éventuelles commandes "delivering"
    // afin que tout reste parfaitement accessible en 3 colonnes nettes
    const readyAndDelivering = [...map['ready'], ...map['delivering']]
    map['ready'] = readyAndDelivering

    // Tri FIFO : les plus anciennes en premier (gestion des priorités)
    Object.keys(map).forEach((k) => {
      map[k as KdsOrderStatus].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    })

    return map
  }, [filteredOrders])

  // 4. Sommaire de production cumulée (Qu'est-ce qu'on doit cuire en ce moment même ?)
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

  // Comptages rapides pour les filtres
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

  // Commandes pour la vue grille
  const gridOrders = useMemo(() => {
    if (typeFilter === 'delivered') {
      return ordersByStatus['delivered']
    }
    return filteredOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
  }, [typeFilter, filteredOrders, ordersByStatus])

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden text-left bg-[#0A0D12]">
      {/* 1. BARRE DE PRODUCTION CUMULÉE (Anti-rush : que poser sur le gril ?) */}
      {productionSummary.totalDishes > 0 && (
        <div className="border-b border-[#1E2532] bg-[#111620] px-4 py-2 shrink-0 transition-all select-none">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar flex-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
                <Flame className="size-3 text-orange-400" />
                <span>En cuisine ({productionSummary.totalDishes})</span>
              </span>

              {isSummaryExpanded ? (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {productionSummary.list.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#18202C] border border-[#273346] text-xs text-white shrink-0 font-medium"
                    >
                      <strong className="text-[#F5B301] font-mono font-black">{item.quantity}×</strong>
                      <span className="truncate max-w-[160px]">{item.name}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-[#8C9AA9] truncate">
                  {productionSummary.list.slice(0, 4).map((i) => `${i.quantity}× ${i.name}`).join(' · ')}
                  {productionSummary.list.length > 4 && '…'}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
              className="p-1 text-[#8C9AA9] hover:text-white rounded hover:bg-white/10 shrink-0 transition-colors"
              title={isSummaryExpanded ? 'Réduire la synthèse' : 'Afficher tout le cumul'}
            >
              {isSummaryExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          </div>
        </div>
      )}

      {/* 2. BARRE D'OUTILS ET FILTRES RAPIDES PAR TYPE (LIVRAISON / EMPORTER / SUR PLACE) */}
      <div className="h-11 min-h-11 px-4 border-b border-[#1E2532] bg-[#0E1218] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
          {/* Tous en cours */}
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              typeFilter === 'all'
                ? 'bg-[#1C2330] text-white border border-[#2F3C50]'
                : 'text-[#8C9AA9] hover:text-white hover:bg-[#151A22]'
            }`}
          >
            <span>Toutes</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeOrdersCount > 0 ? 'bg-[#F5B301] text-black' : 'bg-[#1C2330] text-[#5F6875]'
              }`}
            >
              {activeOrdersCount}
            </span>
          </button>

          {/* Filtre Livraison */}
          <button
            type="button"
            onClick={() => setTypeFilter('delivery')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              typeFilter === 'delivery'
                ? 'bg-[#1C2330] text-blue-300 border border-blue-500/40'
                : 'text-[#8C9AA9] hover:text-white hover:bg-[#151A22]'
            }`}
          >
            <Bike className="size-3.5 text-blue-400" />
            <span>Livraisons</span>
            {deliveryCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-500/30 text-blue-300">
                {deliveryCount}
              </span>
            )}
          </button>

          {/* Filtre À emporter */}
          <button
            type="button"
            onClick={() => setTypeFilter('takeaway')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              typeFilter === 'takeaway'
                ? 'bg-[#1C2330] text-emerald-300 border border-emerald-500/40'
                : 'text-[#8C9AA9] hover:text-white hover:bg-[#151A22]'
            }`}
          >
            <ShoppingBag className="size-3.5 text-emerald-400" />
            <span>À emporter</span>
            {takeawayCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-500/30 text-emerald-300">
                {takeawayCount}
              </span>
            )}
          </button>

          {/* Filtre Sur place */}
          <button
            type="button"
            onClick={() => setTypeFilter('dine_in')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              typeFilter === 'dine_in'
                ? 'bg-[#1C2330] text-amber-300 border border-amber-500/40'
                : 'text-[#8C9AA9] hover:text-white hover:bg-[#151A22]'
            }`}
          >
            <Utensils className="size-3.5 text-amber-400" />
            <span>Sur place</span>
            {dineInCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/30 text-amber-300">
                {dineInCount}
              </span>
            )}
          </button>

          {/* Terminées */}
          <button
            type="button"
            onClick={() => setTypeFilter('delivered')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              typeFilter === 'delivered'
                ? 'bg-[#1C2330] text-white border border-[#2F3C50]'
                : 'text-[#8C9AA9] hover:text-white hover:bg-[#151A22]'
            }`}
          >
            <span>Terminées</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#1C2330] text-[#7E8B9E]">
              {deliveredCount}
            </span>
          </button>
        </div>

        {/* Sélecteur de vue : 3 Colonnes Pipeline vs Grille */}
        <div className="flex items-center gap-1 bg-[#12161E] p-0.5 rounded-lg border border-[#222A37] shrink-0">
          <button
            type="button"
            onClick={() => setLayoutView('pipeline')}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              layoutView === 'pipeline'
                ? 'bg-[#1C2330] text-white shadow-xs'
                : 'text-[#8C9AA9] hover:text-white'
            }`}
            title="Vue 3 Colonnes Pipeline"
          >
            <Columns3 className="size-3.5" />
            <span className="hidden sm:inline">Colonnes</span>
          </button>
          <button
            type="button"
            onClick={() => setLayoutView('grid')}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              layoutView === 'grid'
                ? 'bg-[#1C2330] text-white shadow-xs'
                : 'text-[#8C9AA9] hover:text-white'
            }`}
            title="Vue Grille compacte"
          >
            <LayoutGrid className="size-3.5" />
            <span className="hidden sm:inline">Grille</span>
          </button>
        </div>
      </div>

      {/* 3. CONTENU PRINCIPAL : 3 COLONNES PIPELINE OU GRILLE COMPACTE */}
      <div className="flex-1 overflow-hidden p-3 w-full">
        {layoutView === 'pipeline' && typeFilter !== 'delivered' ? (
          /* PIPELINE PURE CUISINE EN 3 COLONNES RÉPARTIES SUR 100% DE L'ÉCRAN */
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
          /* VUE GRILLE COMPACTE */
          <div className="h-full overflow-y-auto pr-1 w-full">
            {gridOrders.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-[#202734] bg-[#12161E]/40 text-[#5F6875] space-y-2">
                <CheckCircle2 className="size-7 text-[#5F6875]" />
                <p className="text-sm font-semibold text-[#8C9AA9]">
                  Aucune commande dans cette section
                </p>
                <p className="text-xs text-[#5F6875]">
                  Les commandes actives apparaîtront ici dès leur enregistrement.
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
