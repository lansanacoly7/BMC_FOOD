import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CircleCheck, Flame, Inbox, type LucideIcon } from 'lucide-react'
import { getElapsedSeconds } from '../../lib/formatters'
import { DEFAULT_KDS_THRESHOLDS } from '../../styles/kdsTokens'
import type { ChronoThresholds, KdsOrder, KdsOrderStatus } from '../../types/kds'
import { KdsOrderList } from './KdsOrderList'

type BoardTab = 'pending' | 'preparing' | 'ready'

const TABS: { id: BoardTab; label: string; icon: LucideIcon; emptyMessage: string; statuses: KdsOrderStatus[] }[] = [
  { id: 'pending', label: 'À préparer', icon: Inbox, emptyMessage: 'Aucune commande à préparer', statuses: ['pending'] },
  { id: 'preparing', label: 'En cuisson', icon: Flame, emptyMessage: 'Aucune cuisson en cours', statuses: ['preparing'] },
  { id: 'ready', label: 'Prêt', icon: CircleCheck, emptyMessage: 'Aucune commande prête', statuses: ['ready', 'delivering'] },
]

interface KdsBoardProps {
  orders: KdsOrder[]
  nowMs: number
  thresholds?: ChronoThresholds
  onTransition: (orderRef: string, nextStatus: KdsOrderStatus) => void
  onCancel: (orderRef: string) => void
  onViewDetails: (order: KdsOrder) => void
  onPrintTicket: (order: KdsOrder) => void
  /** Vrai pendant les 5 s où la dernière action peut encore être annulée. */
  isUndoPending?: boolean
}

/** Où aller quand l'onglet ouvert se vide : là où il reste du travail, dans cet ordre. */
const NEXT_TAB: Record<BoardTab, BoardTab[]> = {
  pending: ['preparing', 'ready'],
  preparing: ['pending', 'ready'],
  ready: ['pending', 'preparing'],
}

/** Temps pendant lequel le message est lu avant le changement d'onglet. */
const AUTO_SWITCH_DELAY_MS = 1800

export const KdsBoard: React.FC<KdsBoardProps> = ({
  orders,
  nowMs,
  thresholds = DEFAULT_KDS_THRESHOLDS,
  onTransition,
  onCancel,
  onViewDetails,
  onPrintTicket,
  isUndoPending = false,
}) => {
  const [activeTab, setActiveTab] = useState<BoardTab>('pending')
  // Onglet vers lequel l'écran va passer tout seul (message affiché pendant le délai)
  const [autoSwitchTarget, setAutoSwitchTarget] = useState<BoardTab | null>(null)
  // Vrai quand l'onglet ouvert vient de se vider pendant que l'équipe le regardait
  const emptiedRef = useRef(false)
  const previousCountRef = useRef(0)
  // « Rester ici » : l'équipe garde cet onglet vide tant qu'il ne se remplit pas à nouveau
  const [stayOnTab, setStayOnTab] = useState<BoardTab | null>(null)

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

  const counts = useMemo(() => {
    const result = { pending: 0, preparing: 0, ready: 0 } as Record<BoardTab, number>
    for (const tab of TABS) result[tab.id] = sortedOrders.filter((o) => tab.statuses.includes(o.status)).length
    return result
  }, [sortedOrders])

  const openTab = (tab: BoardTab) => {
    emptiedRef.current = false
    previousCountRef.current = counts[tab]
    setAutoSwitchTarget(null)
    setStayOnTab(null)
    setActiveTab(tab)
  }

  // Onglet vidé : après la fenêtre d'annulation, on montre où l'on va, puis on y va.
  // Un onglet déjà vide à l'ouverture ne déclenche rien : seul le fait de le vider compte.
  useEffect(() => {
    const count = counts[activeTab]
    if (count > 0) emptiedRef.current = false
    else if (previousCountRef.current > 0) emptiedRef.current = true
    previousCountRef.current = count

    const target = NEXT_TAB[activeTab].find((tab) => counts[tab] > 0) ?? null
    const wantsToStay = stayOnTab === activeTab && count === 0
    if (!emptiedRef.current || isUndoPending || !target || wantsToStay) {
      const reset = setTimeout(() => setAutoSwitchTarget(null), 0)
      return () => clearTimeout(reset)
    }

    const announce = setTimeout(() => setAutoSwitchTarget(target), 0)
    const go = setTimeout(() => {
      emptiedRef.current = false
      previousCountRef.current = counts[target]
      setAutoSwitchTarget(null)
      setActiveTab(target)
    }, AUTO_SWITCH_DELAY_MS)
    return () => {
      clearTimeout(announce)
      clearTimeout(go)
    }
  }, [counts, activeTab, isUndoPending, stayOnTab])

  const targetLabel = TABS.find((tab) => tab.id === autoSwitchTarget)?.label

  return (
    <>
      {/* Onglets des trois parcours de commande - Centrés et Mis en valeur */}
      <div className="flex shrink-0 justify-center bg-canvas px-4 pt-3 pb-1">
        <div
          role="tablist"
          aria-label="Étapes de la commande"
          className="grid w-full max-w-6xl grid-cols-3 gap-3.5"
        >
          {TABS.map((tab) => {
            const tabOrders = ordersFor(tab)
            const lateCount = tabOrders.filter(
              (o) => getElapsedSeconds(o.createdAt, nowMs) >= thresholds.dangerMinutes * 60,
            ).length
            const isActive = tab.id === activeTab
            const TabIcon = tab.icon
            const count = tabOrders.length
            const countLabel = `${count} commande${count > 1 ? 's' : ''}`
            const lateLabel = `${lateCount} commande${lateCount > 1 ? 's' : ''} en retard`

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`kds-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls="kds-tab-panel"
                aria-label={`${tab.label}, ${countLabel}${lateCount > 0 ? `, ${lateLabel}` : ''}`}
                title={lateCount > 0 ? lateLabel : undefined}
                onClick={() => openTab(tab.id)}
                className={`group relative flex min-w-0 cursor-pointer select-none items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                  isActive
                    ? 'border-[#FCB800] bg-gradient-to-b from-[#181A22] to-[#12141B] shadow-xl shadow-black/40 ring-1 ring-[#FCB800]/50'
                    : 'border-white/10 bg-[#101217] hover:border-white/20 hover:bg-[#14161F]'
                }`}
              >
                {/* Indicateur lumineux actif en haut de carte */}
                {isActive && (
                  <span
                    className="absolute -top-px left-6 right-6 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#FCB800] to-transparent shadow-[0_0_8px_#FCB800]"
                    aria-hidden="true"
                  />
                )}

                {/* Icône de parcours */}
                <span
                  className={`grid size-12 shrink-0 place-items-center rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-[#FCB800] text-[#08090D] shadow-md shadow-[#FCB800]/30'
                      : 'bg-white/5 text-neutral-400 group-hover:bg-white/10 group-hover:text-white'
                  }`}
                >
                  <TabIcon className="size-6" aria-hidden="true" />
                </span>

                {/* Corps de l'onglet */}
                <span className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`block truncate font-display text-[16px] font-bold tracking-tight ${
                        isActive ? 'text-white' : 'text-neutral-300 group-hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums shrink-0 ${
                        isActive
                          ? 'bg-[#FCB800]/20 text-[#FCB800]'
                          : 'bg-white/5 text-neutral-400 group-hover:text-neutral-300'
                      }`}
                    >
                      {count}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 whitespace-nowrap text-xs">
                    <span className={isActive ? 'text-neutral-300 font-medium' : 'text-neutral-500'}>
                      {countLabel}
                    </span>

                    {lateCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 px-1.5 py-0.5 text-[11px] font-bold text-red-400 border border-red-500/30">
                        {lateCount} retard
                      </span>
                    )}
                  </div>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {autoSwitchTarget && targetLabel && (
        <div
          role="status"
          className="mx-3 mt-2 flex shrink-0 items-center justify-between gap-3 rounded-lg border border-bmc-gold/50 bg-gold-soft px-4 py-2.5 text-sm font-semibold text-ink"
        >
          <span className="flex items-center gap-2">
            Plus rien dans « {current.label} » · passage à « {targetLabel} »
            <ArrowRight className="size-4 text-bmc-gold" />
          </span>
          <button
            type="button"
            onClick={() => {
              emptiedRef.current = false
              setAutoSwitchTarget(null)
              setStayOnTab(activeTab)
            }}
            className="h-8 cursor-pointer rounded-md px-3 text-[13px] font-semibold text-ink-soft transition-colors hover:bg-raised hover:text-ink"
          >
            Rester ici
          </button>
        </div>
      )}

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
          onTransition={onTransition}
          onCancel={onCancel}
          onViewDetails={onViewDetails}
          onPrintTicket={onPrintTicket}
        />
      </div>
    </>
  )
}
