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
  Flame,
  Inbox,
  Check,
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

type WorkflowStage = 'all' | 'pending' | 'preparing' | 'ready' | 'delivered'

export const KdsPage: React.FC<KdsPageProps> = ({
  orders,
  nowMs,
  searchQuery,
  onTransition,
  onCancel,
  onViewDetails,
  onPrintTicket,
}) => {
  // Par défaut, la vue Rack / Grille continue est idéale pour les flux intenses de commandes
  const [layoutView, setLayoutView] = useState<'grid' | 'pipeline'>('grid')
  const [stageFilter, setStageFilter] = useState<WorkflowStage>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | OrderType>('all')
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

  // 2. Filtrage par type de commande (Livraison, Emporter, Sur place)
  const typeFilteredOrders = useMemo(() => {
    if (typeFilter === 'all') return searchedOrders
    return searchedOrders.filter((o) => o.orderType === typeFilter)
  }, [searchedOrders, typeFilter])

  // 3. Regroupement par statut du workflow (FIFO : plus ancienne d'abord)
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

    // Intégrer les commandes en cours de livraison dans la section Prêt / Remise
    const readyAndDelivering = [...map['ready'], ...map['delivering']]
    map['ready'] = readyAndDelivering

    // Tri FIFO : les plus anciennes en premier pour respecter les temps de préparation
    Object.keys(map).forEach((k) => {
      map[k as KdsOrderStatus].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    })

    return map
  }, [typeFilteredOrders])

  // 4. Sommaire de production cumulée (Quels plats sont à cuire au total)
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

  // Comptages rapides pour les onglets du workflow
  const counts = useMemo(() => {
    const active = searchedOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
    const pending = searchedOrders.filter((o) => o.status === 'pending').length
    const preparing = searchedOrders.filter((o) => o.status === 'preparing').length
    const ready = searchedOrders.filter((o) => o.status === 'ready' || o.status === 'delivering').length
    const delivered = searchedOrders.filter((o) => o.status === 'delivered').length

    return {
      all: active.length,
      pending,
      preparing,
      ready,
      delivered,
    }
  }, [searchedOrders])

  // Liste des commandes affichées dans la vue Rack / Grille
  const gridDisplayedOrders = useMemo(() => {
    if (stageFilter === 'all') {
      return typeFilteredOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
    }
    if (stageFilter === 'delivered') {
      return typeFilteredOrders.filter((o) => o.status === 'delivered')
    }
    if (stageFilter === 'ready') {
      return typeFilteredOrders.filter((o) => o.status === 'ready' || o.status === 'delivering')
    }
    return typeFilteredOrders.filter((o) => o.status === stageFilter)
  }, [stageFilter, typeFilteredOrders])

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden text-left bg-[#080A0E] select-none">
      {/* 1. BARRE DE WORKFLOW UNIFIÉE & COMPACTE (46px) */}
      <div className="h-11 min-h-11 px-3 border-b border-[#171D27] bg-[#0E1218] flex items-center justify-between gap-3 shrink-0">
        {/* ÉTAPES DU WORKFLOW (Segmented Control sobre) */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setStageFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              stageFilter === 'all'
                ? 'bg-[#1C2432] text-white border border-[#2B384D] shadow-xs'
                : 'text-[#7D8B9F] hover:text-[#CBD5E1]'
            }`}
          >
            <span>Toutes actives</span>
            <span
              className={`font-mono text-[11px] px-1.5 py-0.2 rounded ${
                stageFilter === 'all' ? 'bg-[#293649] text-white' : 'text-[#64748B]'
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStageFilter('pending')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              stageFilter === 'pending'
                ? 'bg-[#1C2432] text-white border border-[#2B384D] shadow-xs'
                : 'text-[#7D8B9F] hover:text-[#CBD5E1]'
            }`}
          >
            <Inbox className="size-3 text-[#64748B]" />
            <span>1. À préparer</span>
            {counts.pending > 0 && (
              <span
                className={`font-mono text-[11px] px-1.5 py-0.2 rounded ${
                  stageFilter === 'pending'
                    ? 'bg-[#F5B301] text-black font-black'
                    : 'bg-[#1A222E] text-[#F5B301]'
                }`}
              >
                {counts.pending}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStageFilter('preparing')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              stageFilter === 'preparing'
                ? 'bg-[#1C2432] text-white border border-[#2B384D] shadow-xs'
                : 'text-[#7D8B9F] hover:text-[#CBD5E1]'
            }`}
          >
            <Flame className="size-3 text-[#64748B]" />
            <span>2. En cuisson</span>
            {counts.preparing > 0 && (
              <span
                className={`font-mono text-[11px] px-1.5 py-0.2 rounded ${
                  stageFilter === 'preparing'
                    ? 'bg-[#22C55E] text-black font-black'
                    : 'bg-[#1A222E] text-[#22C55E]'
                }`}
              >
                {counts.preparing}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStageFilter('ready')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              stageFilter === 'ready'
                ? 'bg-[#1C2432] text-white border border-[#2B384D] shadow-xs'
                : 'text-[#7D8B9F] hover:text-[#CBD5E1]'
            }`}
          >
            <Check className="size-3 text-[#64748B]" />
            <span>3. Prêtes</span>
            {counts.ready > 0 && (
              <span
                className={`font-mono text-[11px] px-1.5 py-0.2 rounded ${
                  stageFilter === 'ready' ? 'bg-[#293649] text-white' : 'text-[#64748B]'
                }`}
              >
                {counts.ready}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStageFilter('delivered')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              stageFilter === 'delivered'
                ? 'bg-[#1C2432] text-white border border-[#2B384D]'
                : 'text-[#5A6779] hover:text-[#94A3B8]'
            }`}
          >
            <span>Clôturées</span>
            <span className="font-mono text-[11px] text-[#5A6779]">{counts.delivered}</span>
          </button>
        </div>

        {/* CONTRÔLES DROITE : Filtre type + Switch Grille / Colonnes */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Filtres types discrets */}
          <div className="hidden lg:flex items-center gap-1 bg-[#12161E] p-0.5 rounded-lg border border-[#1A212D]">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                typeFilter === 'all' ? 'bg-[#1C2432] text-white' : 'text-[#64748B] hover:text-white'
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('delivery')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                typeFilter === 'delivery'
                  ? 'bg-[#1C2432] text-white'
                  : 'text-[#64748B] hover:text-white'
              }`}
              title="Livraison"
            >
              <Bike className="size-3" />
              <span>Livraison</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('takeaway')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                typeFilter === 'takeaway'
                  ? 'bg-[#1C2432] text-white'
                  : 'text-[#64748B] hover:text-white'
              }`}
              title="À emporter"
            >
              <ShoppingBag className="size-3" />
              <span>Emporter</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('dine_in')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                typeFilter === 'dine_in'
                  ? 'bg-[#1C2432] text-white'
                  : 'text-[#64748B] hover:text-white'
              }`}
              title="Sur place"
            >
              <Utensils className="size-3" />
              <span>Sur place</span>
            </button>
          </div>

          {/* Switch de vue : Grille de flux (recommandé flux intense) ou 3 colonnes */}
          <div className="flex items-center gap-0.5 bg-[#12161E] p-0.5 rounded-lg border border-[#1A212D]">
            <button
              type="button"
              onClick={() => setLayoutView('grid')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                layoutView === 'grid'
                  ? 'bg-[#1C2432] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-white'
              }`}
              title="Grille continue de tickets (Idéal pour grand volume sans goulot d'étranglement)"
            >
              <LayoutGrid className="size-3.5" />
              <span className="hidden sm:inline">Grille Rack</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLayoutView('pipeline')
                if (stageFilter !== 'all') setStageFilter('all')
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                layoutView === 'pipeline'
                  ? 'bg-[#1C2432] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-white'
              }`}
              title="Vue Kanban 3 colonnes"
            >
              <Columns3 className="size-3.5" />
              <span className="hidden sm:inline">3 Colonnes</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CUMUL CUISINE EN COURS (Synthèse de production rétractable) */}
      {productionSummary.totalDishes > 0 && (
        <div className="border-b border-[#171D27] bg-[#0B0E14] px-3.5 py-1.5 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar flex-1">
              <span className="text-[11px] font-black text-[#8C98AA] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1.5">
                <span>À griller / cuire :</span>
                <strong className="text-[#F5B301] font-mono text-xs font-black">
                  {productionSummary.totalDishes} plats
                </strong>
              </span>

              {isSummaryExpanded ? (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {productionSummary.list.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#131822] border border-[#1F2736] text-xs text-white shrink-0"
                    >
                      <strong className="text-[#F5B301] font-mono font-bold">{item.quantity}×</strong>
                      <span className="truncate max-w-[170px] text-[#CBD5E1] font-medium">{item.name}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-[#64748B] truncate">
                  {productionSummary.list
                    .slice(0, 5)
                    .map((i) => `${i.quantity}× ${i.name}`)
                    .join(' · ')}
                  {productionSummary.list.length > 5 && ' …'}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
              className="p-1 text-[#64748B] hover:text-white rounded hover:bg-white/5 shrink-0 transition-colors cursor-pointer"
              title={isSummaryExpanded ? 'Réduire' : 'Déplier'}
            >
              {isSummaryExpanded ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. ZONE PRINCIPALE DES TICKETS (Optimisée pour de fortes charges de commandes) */}
      <div className="flex-1 overflow-hidden p-3 w-full">
        {layoutView === 'pipeline' && stageFilter === 'all' ? (
          /* VUE 3 COLONNES PIPELINE */
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
          /* VUE RACK / GRILLE CONTINUE (Absorption maximale des commandes simultanées) */
          <div className="h-full overflow-y-auto pr-1 w-full no-scrollbar">
            {gridDisplayedOrders.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-[#1A212D] bg-[#0E1218]/40 text-[#475569] space-y-2">
                <CheckCircle2 className="size-7 text-[#334155]" />
                <p className="text-sm font-semibold text-[#64748B]">
                  Aucune commande dans cette section
                </p>
                <p className="text-xs text-[#475569]">
                  Les nouvelles commandes s'afficheront ici automatiquement en temps réel.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 w-full pb-4">
                {gridDisplayedOrders.map((order) => (
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
