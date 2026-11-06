import React, { useMemo, useState } from 'react'
import { LayoutGrid, Columns3, CheckCircle2 } from 'lucide-react'
import type { ColumnDefinition, KdsOrder, KdsOrderStatus } from '../types/kds'
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
    actionLabel: 'Lancer la préparation',
    actionClass: '',
    nextStatus: 'preparing',
    emptyMessage: 'Aucune commande en attente',
  },
  {
    id: 'preparing',
    title: '2. EN CUISINE',
    subtitle: 'Au gril et cuisson',
    badgeColor: '#F5B301',
    borderColor: '#232830',
    actionLabel: 'Marquer prête',
    actionClass: '',
    nextStatus: 'ready',
    emptyMessage: 'Aucune commande en cours de cuisson',
  },
  {
    id: 'ready',
    title: '3. PRÊT AU COMPTOIR',
    subtitle: 'À servir ou remettre',
    badgeColor: '#10B981',
    borderColor: '#232830',
    actionLabel: 'Terminer / Remise',
    actionClass: '',
    nextStatus: 'delivered',
    emptyMessage: 'Aucune commande prête au comptoir',
  },
  {
    id: 'delivering',
    title: '4. EN LIVRAISON',
    subtitle: 'Livreurs sur la route',
    badgeColor: '#3B82F6',
    borderColor: '#232830',
    actionLabel: 'Confirmer livraison',
    actionClass: '',
    nextStatus: 'delivered',
    emptyMessage: 'Aucun coursier sur la route',
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'delivered' | KdsOrderStatus>('all')

  // Filtrage par recherche
  const filteredOrders = useMemo(() => {
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

  // Regroupement par statut
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

    // Tri FIFO : les plus anciennes en premier
    Object.keys(map).forEach((k) => {
      map[k as KdsOrderStatus].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    })

    return map
  }, [filteredOrders])

  // Filtre actif sur les colonnes à afficher en mode Pipeline Express
  const visibleColumns = useMemo(() => {
    if (activeFilter === 'delivered') return []
    if (activeFilter !== 'all') {
      return KDS_COLUMNS.filter((c) => c.id === activeFilter)
    }
    // Si 'all', on affiche le pipeline Express (1, 2, 3), et 4 seulement s'il y a des commandes en cours de livraison
    const hasDelivering = (ordersByStatus['delivering'] || []).length > 0
    return KDS_COLUMNS.filter((c) => c.id !== 'delivering' || hasDelivering)
  }, [activeFilter, ordersByStatus])

  // Commandes filtrées pour la vue grille
  const gridOrders = useMemo(() => {
    if (activeFilter === 'all') {
      return filteredOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
    }
    return ordersByStatus[activeFilter] || []
  }, [activeFilter, filteredOrders, ordersByStatus])

  const activeOrdersCount = useMemo(() => {
    return filteredOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length
  }, [filteredOrders])

  const deliveredCount = useMemo(() => {
    return (ordersByStatus['delivered'] || []).length
  }, [ordersByStatus])

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden text-left bg-[#0B0D10]">
      {/* BARRE D'OUTILS ET FILTRES RAPIDES DU WORKFLOW EXPRESS */}
      <div className="h-12 min-h-12 px-6 border-b border-[#1A1F26] bg-[#0E1115] flex items-center justify-between gap-4 shrink-0">
        {/* Filtres de statut */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-[#1A1E24] text-white border border-[#2A313C]'
                : 'text-[#8A93A0] hover:text-white hover:bg-[#15191E]'
            }`}
          >
            <span>Express en cours</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeOrdersCount > 0 ? 'bg-[#F5B301] text-black' : 'bg-[#1A1E24] text-[#5F6875]'
              }`}
            >
              {activeOrdersCount}
            </span>
          </button>

          {KDS_COLUMNS.map((col) => {
            const count = (ordersByStatus[col.id] || []).length
            // On masque le bouton filtre 'delivering' s'il n'y a aucune commande en livraison pour garder l'interface épurée
            if (col.id === 'delivering' && count === 0) return null
            const isActive = activeFilter === col.id
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => setActiveFilter(col.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#1A1E24] text-white border border-[#2A313C]'
                    : 'text-[#8A93A0] hover:text-white hover:bg-[#15191E]'
                }`}
              >
                <span>{col.title}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    count > 0 ? 'bg-[#F5B301] text-black' : 'bg-[#1A1E24] text-[#5F6875]'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}

          {/* Onglet Historique / Terminées */}
          <button
            type="button"
            onClick={() => setActiveFilter('delivered')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'delivered'
                ? 'bg-[#1A1E24] text-white border border-[#2A313C]'
                : 'text-[#8A93A0] hover:text-white hover:bg-[#15191E]'
            }`}
          >
            <span>Terminées</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#1A1E24] text-[#8A93A0]">
              {deliveredCount}
            </span>
          </button>
        </div>

        {/* Sélecteur de vue : Pipeline vs Grille */}
        <div className="flex items-center gap-1 bg-[#12151A] p-0.5 rounded-lg border border-[#1F242B] shrink-0">
          <button
            type="button"
            onClick={() => setLayoutView('pipeline')}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              layoutView === 'pipeline'
                ? 'bg-[#1A1E24] text-white shadow-xs'
                : 'text-[#8A93A0] hover:text-white'
            }`}
            title="Vue Colonnes (Pipeline)"
          >
            <Columns3 className="size-3.5" />
            <span className="hidden sm:inline">Pipeline</span>
          </button>
          <button
            type="button"
            onClick={() => setLayoutView('grid')}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              layoutView === 'grid'
                ? 'bg-[#1A1E24] text-white shadow-xs'
                : 'text-[#8A93A0] hover:text-white'
            }`}
            title="Vue Fiches (Grille)"
          >
            <LayoutGrid className="size-3.5" />
            <span className="hidden sm:inline">Grille</span>
          </button>
        </div>
      </div>

      {/* CONTENU PRINCIPAL PLEIN ÉCRAN : PIPELINE EXPRESS OU GRILLE COMPLÈTE */}
      <div className="flex-1 overflow-hidden p-4 w-full">
        {layoutView === 'pipeline' && activeFilter === 'all' ? (
          /* VUE PIPELINE EN COLONNES RÉPARTIES SUR 100% DE LA LARGEUR SANS BARRE DE DÉFILEMENT */
          <div
            className={`grid gap-4 h-full w-full overflow-hidden ${
              visibleColumns.length === 4
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-1 md:grid-cols-3'
            }`}
          >
            {visibleColumns.map((col) => (
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
          /* VUE FILTRÉE OU GRILLE : UTILISE TOUTE LA LARGEUR DE L'ÉCRAN */
          <div className="h-full overflow-y-auto pr-1 w-full">
            {gridOrders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-[#1F242B] bg-[#12151A]/40 text-[#5F6875] space-y-2">
                <CheckCircle2 className="size-8 text-[#5F6875]" />
                <p className="text-sm font-semibold text-[#8A93A0]">
                  Aucune commande dans cette section
                </p>
                <p className="text-xs text-[#5F6875]">
                  Les nouvelles commandes apparaîtront ici dès qu'elles seront passées.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full">
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
