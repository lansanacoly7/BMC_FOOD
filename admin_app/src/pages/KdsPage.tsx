import React, { useMemo, useState } from 'react'
import type { ChronoThresholds, KdsOrder, KdsOrderStatus, OrderType } from '../types/kds'
import { DEFAULT_KDS_THRESHOLDS } from '../styles/kdsTokens'
import { getElapsedSeconds } from '../lib/formatters'
import { KdsTopBar } from '../components/kds/KdsTopBar'
import { StatCounters } from '../components/kds/StatCounters'
import { TicketGrid } from '../components/kds/TicketGrid'
import { BottomBar } from '../components/kds/BottomBar'
import { OrderHistoryDrawer } from '../components/kds/OrderHistoryDrawer'

interface KdsPageProps {
  orders: KdsOrder[]
  nowMs: number
  searchQuery: string
  onSearchChange: (query: string) => void
  typeFilter: 'all' | OrderType
  onTypeFilterChange: (type: 'all' | OrderType) => void
  newOrdersSet?: Set<string>
  isAudioMuted?: boolean
  onToggleAudio?: () => void
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  thresholds?: ChronoThresholds
  onTransition: (orderRef: string, nextStatus: KdsOrderStatus) => void
  onCancel: (orderRef: string) => void
  onViewDetails: (order: KdsOrder) => void
  onPrintTicket: (order: KdsOrder) => void
}

export const KdsPage: React.FC<KdsPageProps> = ({
  orders,
  nowMs,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  newOrdersSet = new Set(),
  isAudioMuted = false,
  onToggleAudio = () => {},
  isSidebarCollapsed = false,
  onToggleSidebar = () => {},
  thresholds = DEFAULT_KDS_THRESHOLDS,
  onTransition,
  onCancel,
  onViewDetails,
  onPrintTicket,
}) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false)

  // 1. Filtrage par recherche textuelle (#ticket, client, plat)
  const searchedOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders
    const q = searchQuery.toLowerCase().trim()
    return orders.filter((o) => {
      const matchRef = o.orderRef.toLowerCase().includes(q)
      const matchName = o.customerName.toLowerCase().includes(q)
      const matchPhone = o.phone.toLowerCase().includes(q)
      const matchAddress = o.address.toLowerCase().includes(q)
      const matchItems = o.items.some((i) => i.name.toLowerCase().includes(q))
      return matchRef || matchName || matchPhone || matchAddress || matchItems
    })
  }, [orders, searchQuery])

  // 2. Compteurs par type de commande pour la barre supérieure (sur commandes actives + prêtes)
  const countsByType = useMemo(() => {
    const active = searchedOrders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled',
    )
    return {
      all: active.length,
      delivery: active.filter((o) => o.orderType === 'delivery').length,
      takeaway: active.filter((o) => o.orderType === 'takeaway').length,
      dine_in: active.filter((o) => o.orderType === 'dine_in').length,
    }
  }, [searchedOrders])

  // 3. Filtrage par type sélectionné
  const filteredOrders = useMemo(() => {
    if (typeFilter === 'all') return searchedOrders
    return searchedOrders.filter((o) => o.orderType === typeFilter)
  }, [searchedOrders, typeFilter])

  // 4. Compteurs pour le bandeau géant
  const activeOrders = useMemo(() => {
    return filteredOrders.filter(
      (o) => o.status === 'pending' || o.status === 'preparing',
    )
  }, [filteredOrders])

  const pendingCount = useMemo(
    () => activeOrders.filter((o) => o.status === 'pending').length,
    [activeOrders],
  )

  const preparingCount = useMemo(
    () => activeOrders.filter((o) => o.status === 'preparing').length,
    [activeOrders],
  )

  const lateCount = useMemo(() => {
    const dangerSec = thresholds.dangerMinutes * 60
    return activeOrders.filter((o) => {
      const elapsed = getElapsedSeconds(o.createdAt, nowMs)
      return elapsed >= dangerSec
    }).length
  }, [activeOrders, nowMs, thresholds])

  const avgWaitMinutes = useMemo(() => {
    if (activeOrders.length === 0) return 0
    const totalMs = activeOrders.reduce((sum, o) => {
      const diff = nowMs - new Date(o.createdAt).getTime()
      return sum + (isNaN(diff) ? 0 : Math.max(0, diff))
    }, 0)
    return Math.round(totalMs / (activeOrders.length * 60000))
  }, [activeOrders, nowMs])

  // 5. Historique (commandes livrées ou annulées)
  const historyCount = useMemo(() => {
    return searchedOrders.filter(
      (o) => o.status === 'delivered' || o.status === 'cancelled',
    ).length
  }, [searchedOrders])

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-[#0E1116] text-[#FFFFFF] font-sans select-none kds-no-hscroll">
      {/* 1. BARRE DU HAUT FIXE (UNE LIGNE) */}
      <KdsTopBar
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        typeFilter={typeFilter}
        onTypeFilterChange={onTypeFilterChange}
        countsByType={countsByType}
        historyCount={historyCount}
        onOpenHistory={() => setIsHistoryOpen(true)}
        isAudioMuted={isAudioMuted}
        onToggleAudio={onToggleAudio}
      />

      {/* 2. BANDEAU COMPTEURS GÉANTS : À PRÉPARER / EN CUISSON / EN RETARD */}
      <StatCounters
        pendingCount={pendingCount}
        preparingCount={preparingCount}
        lateCount={lateCount}
        avgWaitMinutes={avgWaitMinutes}
      />

      {/* 3. ZONE PRINCIPALE = GRILLE DE TICKETS (PAS DE KANBAN) */}
      <TicketGrid
        orders={filteredOrders}
        nowMs={nowMs}
        thresholds={thresholds}
        newOrdersSet={newOrdersSet}
        onTransition={onTransition}
        onCancel={onCancel}
        onViewDetails={onViewDetails}
        onPrintTicket={onPrintTicket}
      />

      {/* 4. BARRE DU BAS FIXE (TOTAL À PRODUIRE + PRÊTES À REMETTRE) */}
      <BottomBar
        orders={filteredOrders}
        onTransition={onTransition}
      />

      {/* 5. TIROIR HISTORIQUE (COMMANDES LIVRÉES ET ANNULÉES) */}
      <OrderHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        orders={searchedOrders}
        onViewDetails={onViewDetails}
        onPrintTicket={onPrintTicket}
        onRestoreOrder={(orderRef, status) => {
          onTransition(orderRef, status)
        }}
      />
    </div>
  )
}
