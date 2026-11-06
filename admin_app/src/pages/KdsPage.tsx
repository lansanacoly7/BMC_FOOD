import React, { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { ColumnDefinition, KdsOrder, KdsOrderStatus, OrderType } from '../types/kds'
import { KanbanColumn } from '../components/kds/KanbanColumn'

interface KdsPageProps {
  orders: KdsOrder[]
  nowMs: number
  searchQuery: string
  typeFilter?: 'all' | OrderType
  onTransition: (orderRef: string, nextStatus: KdsOrderStatus) => void
  onCancel: (orderRef: string) => void
  onViewDetails: (order: KdsOrder) => void
  onPrintTicket: (order: KdsOrder) => void
}

export const KDS_COLUMNS: ColumnDefinition[] = [
  {
    id: 'pending',
    title: 'À préparer',
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
    title: 'En cuisson',
    subtitle: 'Sur le gril',
    badgeColor: '#262A33',
    borderColor: '#262A33',
    actionLabel: 'Marquer prêt',
    actionClass: '',
    nextStatus: 'ready',
    emptyMessage: 'Aucune commande en cuisson',
  },
  {
    id: 'ready',
    title: 'Prêt',
    subtitle: 'Au comptoir / départ coursier',
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
  typeFilter = 'all',
  onTransition,
  onCancel,
  onViewDetails,
  onPrintTicket,
}) => {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState<boolean>(true)

  // 1. Filtrage par recherche textuelle (#ticket, client, plat)
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

  // 2. Filtrage par type de commande (Tous · Livraison · À emporter · Sur place)
  const filteredOrders = useMemo(() => {
    if (typeFilter === 'all') return searchedOrders
    return searchedOrders.filter((o) => o.orderType === typeFilter)
  }, [searchedOrders, typeFilter])

  // 3. Répartition des commandes par colonne (tri FIFO : plus ancienne en premier)
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

    // Intégrer les commandes en cours de livraison dans la colonne "Prêt"
    const readyGroup = [...map['ready'], ...map['delivering']]
    map['ready'] = readyGroup

    // Tri FIFO : la plus ancienne en premier pour le flux cuisine
    Object.keys(map).forEach((k) => {
      map[k as KdsOrderStatus].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    })

    return map
  }, [filteredOrders])

  // 4. Métriques pour le bandeau de synthèse fin (Point 2)
  const pendingCount = ordersByStatus['pending'].length
  const preparingCount = ordersByStatus['preparing'].length
  const readyCount = ordersByStatus['ready'].length

  const avgWaitMinutes = useMemo(() => {
    const active = filteredOrders.filter(
      (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready' || o.status === 'delivering',
    )
    if (active.length === 0) return 0
    const totalMs = active.reduce((sum, o) => {
      const diff = nowMs - new Date(o.createdAt).getTime()
      return sum + (isNaN(diff) ? 0 : Math.max(0, diff))
    }, 0)
    return Math.round(totalMs / (active.length * 60000))
  }, [filteredOrders, nowMs])

  // 5. Bandeau "À griller / cuire" compact regroupant par produit (Point 3)
  const productionSummary = useMemo(() => {
    const activeOrders = filteredOrders.filter(
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
  }, [filteredOrders])

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden text-left bg-[#0F1115] font-sans text-[#E6E8EC] select-none kds-no-hscroll">
      {/* 2. BANDEAU DE SYNTHÈSE FIN : En attente / En cuisson / Prêtes + temps d'attente moyen */}
      <div className="h-7 min-h-7 px-3 border-b border-[#262A33] bg-[#12141A] flex items-center justify-between text-xs text-[#8B93A1] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>En attente :</span>
            <span className="font-mono font-semibold text-[#E6E8EC]">{pendingCount}</span>
          </div>
          <span className="text-[#262A33]">·</span>
          <div className="flex items-center gap-1.5">
            <span>En cuisson :</span>
            <span className="font-mono font-semibold text-[#E6E8EC]">{preparingCount}</span>
          </div>
          <span className="text-[#262A33]">·</span>
          <div className="flex items-center gap-1.5">
            <span>Prêtes :</span>
            <span className="font-mono font-semibold text-[#E6E8EC]">{readyCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span>Attente moy. :</span>
          <span className="font-mono font-semibold text-[#E6E8EC]">{avgWaitMinutes} min</span>
        </div>
      </div>

      {/* 3. BANDEAU "À GRILLER / CUIRE" COMPACT : groupé par produit, repliable, sans scroll horizontal */}
      {productionSummary.totalDishes > 0 && (
        <div className="border-b border-[#262A33] bg-[#171A21] px-3 py-1.5 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-[#8B93A1] uppercase tracking-wider">
                  À griller / cuire :
                </span>
                <span className="font-mono text-xs font-bold text-[#E8A33D]">
                  {productionSummary.totalDishes} {productionSummary.totalDishes > 1 ? 'plats' : 'plat'}
                </span>
              </div>

              {isSummaryExpanded ? (
                /* flex-wrap : aucune barre de défilement horizontale */
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {productionSummary.list.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0F1115] border border-[#262A33] text-xs text-[#E6E8EC]"
                    >
                      <strong className="text-[#E8A33D] font-mono font-semibold">{item.quantity}×</strong>
                      <span>{item.name}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-[#8B93A1] truncate block">
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
              className="p-1 text-[#8B93A1] hover:text-[#E6E8EC] rounded hover:bg-[#262A33] shrink-0 transition-colors cursor-pointer mt-0.5"
              title={isSummaryExpanded ? 'Réduire' : 'Déplier'}
            >
              {isSummaryExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* 4. TROIS COLONNES DE LARGEUR ÉGALE, PLEINE HAUTEUR, EN-TÊTES FIXES, SCROLL VERTICAL INDÉPENDANT */}
      <div className="flex-1 min-h-0 overflow-hidden p-2.5 w-full">
        <div className="grid grid-cols-3 gap-2.5 h-full w-full overflow-hidden">
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
      </div>
    </div>
  )
}
