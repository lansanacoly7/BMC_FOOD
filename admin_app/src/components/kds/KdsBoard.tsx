import React, { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { getElapsedSeconds } from '../../lib/formatters'
import { DEFAULT_KDS_THRESHOLDS } from '../../styles/kdsTokens'
import type { ChronoThresholds, KdsOrder, KdsOrderStatus } from '../../types/kds'
import { KdsOrderList } from './KdsOrderList'

type BoardTab = 'pending' | 'preparing' | 'ready'

const TABS: { id: BoardTab; label: string; emptyMessage: string; statuses: KdsOrderStatus[] }[] = [
  { id: 'pending', label: 'À préparer', emptyMessage: 'Aucune commande à préparer', statuses: ['pending'] },
  { id: 'preparing', label: 'En cuisson', emptyMessage: 'Aucune cuisson en cours', statuses: ['preparing'] },
  { id: 'ready', label: 'Prêt', emptyMessage: 'Aucune commande prête', statuses: ['ready', 'delivering'] },
]

interface KdsBoardProps {
  orders: KdsOrder[]
  nowMs: number
  thresholds?: ChronoThresholds
  onTransition: (orderRef: string, nextStatus: KdsOrderStatus) => void
  onCancel: (orderRef: string) => void
  onViewDetails: (order: KdsOrder) => void
  onPrintTicket: (order: KdsOrder) => void
}

export const KdsBoard: React.FC<KdsBoardProps> = ({
  orders,
  nowMs,
  thresholds = DEFAULT_KDS_THRESHOLDS,
  onTransition,
  onCancel,
  onViewDetails,
  onPrintTicket,
}) => {
  const [activeTab, setActiveTab] = useState<BoardTab>('pending')

  // Les plats rayés survivent au passage en compact et aux changements d'étape
  const [doneItems, setDoneItems] = useState<Record<string, number[]>>({})

  const toggleItem = (orderId: string, itemIndex: number) => {
    setDoneItems((prev) => {
      const current = prev[orderId] ?? []
      return {
        ...prev,
        [orderId]: current.includes(itemIndex)
          ? current.filter((index) => index !== itemIndex)
          : [...current, itemIndex],
      }
    })
  }

  // Tri strict : du plus ancien au plus récent
  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [orders],
  )

  const ordersFor = (tab: (typeof TABS)[number]) =>
    sortedOrders.filter((o) => tab.statuses.includes(o.status))

  const current = TABS.find((tab) => tab.id === activeTab) ?? TABS[0]

  return (
    <>
      {/* Chaque onglet garde son compteur et ses retards : rien ne passe inaperçu ailleurs */}
      <div role="tablist" aria-label="Étapes de la commande" className="grid shrink-0 grid-cols-3 gap-2 px-3 pt-3">
        {TABS.map((tab) => {
          const tabOrders = ordersFor(tab)
          const lateCount = tabOrders.filter(
            (o) => getElapsedSeconds(o.createdAt, nowMs) >= thresholds.dangerMinutes * 60,
          ).length
          const isActive = tab.id === activeTab

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`kds-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls="kds-tab-panel"
              onClick={() => setActiveTab(tab.id)}
              className={`flex h-14 min-w-0 cursor-pointer select-none items-center gap-2.5 rounded-lg border px-4 text-left transition-colors ${
                isActive
                  ? 'border-bmc-gold bg-surface text-ink'
                  : 'border-line text-ink-soft hover:bg-surface hover:text-ink'
              }`}
            >
              <span className="truncate font-display text-base font-bold">{tab.label}</span>
              <span className="min-w-7 rounded-md bg-raised px-2 py-0.5 text-center text-[13px] font-semibold tabular-nums text-ink">
                {tabOrders.length}
              </span>
              {lateCount > 0 && (
                <span className="ml-auto flex shrink-0 items-center gap-1 whitespace-nowrap text-[13px] font-semibold text-bad">
                  <AlertTriangle className="size-3.5" />
                  {lateCount}
                  <span className="hidden lg:inline">en retard</span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id="kds-tab-panel"
        aria-labelledby={`kds-tab-${current.id}`}
        className="flex min-h-0 flex-1 flex-col bg-canvas"
      >
        <KdsOrderList
          key={current.id}
          orders={ordersFor(current)}
          nowMs={nowMs}
          thresholds={thresholds}
          emptyMessage={current.emptyMessage}
          doneItems={doneItems}
          onToggleItem={toggleItem}
          onTransition={onTransition}
          onCancel={onCancel}
          onViewDetails={onViewDetails}
          onPrintTicket={onPrintTicket}
        />
      </div>
    </>
  )
}
