import React, { useMemo, useState } from 'react'
import type { ChronoThresholds, KdsOrder, KdsOrderStatus, OrderType } from '../types/kds'
import { DEFAULT_KDS_THRESHOLDS } from '../styles/kdsTokens'
import { getElapsedSeconds } from '../lib/formatters'
import { KdsProduceBar } from '../components/kds/KdsProduceBar'
import { KdsTopBar } from '../components/kds/KdsTopBar'
import { KdsBoard } from '../components/kds/KdsBoard'
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

  // 1. Filtrage par recherche textuelle (#ticket, client, plat, etc.)
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

  // 2. Compteurs par type de commande pour la barre supérieure (sur commandes non clôturées)
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

  // Retards sur les 3 colonnes : le compteur correspond aux tickets rouges affichés
  const lateCount = useMemo(() => {
    const dangerSec = thresholds.dangerMinutes * 60
    return filteredOrders.filter(
      (o) =>
        o.status !== 'delivered' &&
        o.status !== 'cancelled' &&
        getElapsedSeconds(o.createdAt, nowMs) >= dangerSec,
    ).length
  }, [filteredOrders, nowMs, thresholds])

  // 4. Historique (commandes livrées ou annulées)
  const historyCount = useMemo(() => {
    return searchedOrders.filter(
      (o) => o.status === 'delivered' || o.status === 'cancelled',
    ).length
  }, [searchedOrders])

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-[#0F1115] text-[#F2F4F7] font-sans select-none kds-no-hscroll">
      {/* 1. BARRE DU HAUT SIMPLIFIÉE (UNE LIGNE) */}
      <KdsTopBar
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        typeFilter={typeFilter}
        onTypeFilterChange={onTypeFilterChange}
        countsByType={countsByType}
        lateCount={lateCount}
        historyCount={historyCount}
        onOpenHistory={() => setIsHistoryOpen(true)}
        isAudioMuted={isAudioMuted}
        onToggleAudio={onToggleAudio}
      />

      <KdsProduceBar orders={filteredOrders} />

      {/* 2. ZONE PRINCIPALE : UN ONGLET PAR ÉTAPE, TICKETS SUR TOUTE LA LARGEUR */}
      <KdsBoard
        orders={filteredOrders}
        nowMs={nowMs}
        thresholds={thresholds}
        onTransition={onTransition}
        onCancel={onCancel}
        onViewDetails={onViewDetails}
        onPrintTicket={onPrintTicket}
      />

      {/* 3. TIROIR HISTORIQUE (COMMANDES LIVRÉES ET ANNULÉES) */}
      <OrderHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        orders={searchedOrders}
        onViewDetails={onViewDetails}
        onPrintTicket={onPrintTicket}
      />
    </div>
  )
}
