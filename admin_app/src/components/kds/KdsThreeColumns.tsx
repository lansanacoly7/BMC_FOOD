import React, { useMemo } from 'react'
import type { ChronoThresholds, KdsOrder, KdsOrderStatus } from '../../types/kds'
import { KdsColumn } from './KdsColumn'

interface KdsThreeColumnsProps {
  orders: KdsOrder[]
  nowMs: number
  thresholds?: ChronoThresholds
  onTransition: (orderRef: string, nextStatus: KdsOrderStatus) => void
  onCancel: (orderRef: string) => void
  onViewDetails: (order: KdsOrder) => void
  onPrintTicket: (order: KdsOrder) => void
}

export const KdsThreeColumns: React.FC<KdsThreeColumnsProps> = ({
  orders,
  nowMs,
  thresholds,
  onTransition,
  onCancel,
  onViewDetails,
  onPrintTicket,
}) => {
  // Tri strict : du plus ancien (en haut) au plus récent
  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
  }, [orders])

  // Répartition par colonne
  const pendingOrders = useMemo(
    () => sortedOrders.filter((o) => o.status === 'pending'),
    [sortedOrders],
  )

  const preparingOrders = useMemo(
    () => sortedOrders.filter((o) => o.status === 'preparing'),
    [sortedOrders],
  )

  const readyOrders = useMemo(
    () => sortedOrders.filter((o) => o.status === 'ready' || o.status === 'delivering'),
    [sortedOrders],
  )

  return (
    <main
      className="flex-1 min-h-0 p-3 grid grid-cols-1 md:grid-cols-3 gap-3 overflow-hidden bg-[#0E1116]"
      aria-label="Tableau de cuisine 3 colonnes"
    >
      {/* 1. COLONNE À PRÉPARER (BLEU #3B82F6) */}
      <KdsColumn
        title="1. À PRÉPARER"
        count={pendingOrders.length}
        headerBg="#3B82F6"
        headerTextColor="#FFFFFF"
        orders={pendingOrders}
        nowMs={nowMs}
        thresholds={thresholds}
        emptyMessage="Aucune commande à préparer"
        onTransition={onTransition}
        onCancel={onCancel}
        onViewDetails={onViewDetails}
        onPrintTicket={onPrintTicket}
      />

      {/* 2. COLONNE EN CUISSON (AMBRE #F59E0B) */}
      <KdsColumn
        title="2. EN CUISSON"
        count={preparingOrders.length}
        headerBg="#F59E0B"
        headerTextColor="#0E1116"
        orders={preparingOrders}
        nowMs={nowMs}
        thresholds={thresholds}
        emptyMessage="Aucune cuisson en cours"
        onTransition={onTransition}
        onCancel={onCancel}
        onViewDetails={onViewDetails}
        onPrintTicket={onPrintTicket}
      />

      {/* 3. COLONNE PRÊT (VERT #22C55E) */}
      <KdsColumn
        title="3. PRÊT"
        count={readyOrders.length}
        headerBg="#22C55E"
        headerTextColor="#FFFFFF"
        orders={readyOrders}
        nowMs={nowMs}
        thresholds={thresholds}
        emptyMessage="Aucune commande prête"
        onTransition={onTransition}
        onCancel={onCancel}
        onViewDetails={onViewDetails}
        onPrintTicket={onPrintTicket}
      />
    </main>
  )
}
