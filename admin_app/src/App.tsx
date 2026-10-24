import { useEffect, useMemo, useRef, useState } from 'react'
import { clearAuthToken, getAuthToken, getAuthUser } from './api/client'
import { calculateTodayKpis } from './api/orders'
import { AppHeader, type AdminTab } from './components/common/AppHeader'
import { ConnectionBanner } from './components/common/ConnectionBanner'
import { KpiBar } from './components/common/KpiBar'
import { Toast } from './components/common/Toast'
import { OrderDetailDrawer } from './components/kds/OrderDetailDrawer'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useNow } from './hooks/useNow'
import { useOrders } from './hooks/useOrders'
import { useWakeLock } from './hooks/useWakeLock'
import { audioAlert } from './lib/audioAlert'
import { DailySpecialPage } from './pages/DailySpecialPage'
import { HistoryPage } from './pages/HistoryPage'
import { KdsPage } from './pages/KdsPage'
import { LoginPage } from './pages/LoginPage'
import { PromotionsPage } from './pages/PromotionsPage'
import { TransactionsPage } from './pages/TransactionsPage'
import type { KdsOrder, KdsOrderStatus } from './types/kds'

export default function App() {
  // 0. État d'authentification administrateur
  const [authToken, setAuthTokenState] = useState<string | null>(() => getAuthToken())
  const [currentUser, setCurrentUserState] = useState<string | null>(() => getAuthUser() || 'admin')

  const handleLoginSuccess = (user: string) => {
    setAuthTokenState(getAuthToken())
    setCurrentUserState(user)
  }

  const handleLogout = () => {
    clearAuthToken()
    setAuthTokenState(null)
    setCurrentUserState(null)
  }

  const [headerTab, setHeaderTab] = useState<AdminTab>('kds')
  const [viewMode, setViewMode] = useState<'kanban' | 'history'>('kanban')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedOrder, setSelectedOrder] = useState<KdsOrder | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // 1. Horloge globale partagée (1 tick / seconde)
  const nowMs = useNow(1000)

  // 2. Anti-veille écran de cuisine automatique (Screen Wake Lock API)
  useWakeLock()

  // 3. Cycle de vie temps réel et polling des commandes
  const {
    orders,
    isLoading,
    lastSyncTime,
    connectionState,
    refresh,
    transitionOrder,
    undoTransition,
    activeUndoAction,
    acknowledgeNewOrders,
  } = useOrders()

  // 4. Déverrouillage audio sur la première interaction utilisateur
  useEffect(() => {
    const unlock = () => {
      audioAlert.unlock()
      acknowledgeNewOrders()
      window.removeEventListener('click', unlock)
      window.removeEventListener('touchstart', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('click', unlock, { once: true })
    window.addEventListener('touchstart', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('touchstart', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [acknowledgeNewOrders])

  // 5. Raccourcis clavier pour le poste de travail
  useKeyboardShortcuts({
    onSearchFocus: () => {
      searchInputRef.current?.focus()
    },
    onEscape: () => {
      if (selectedOrder) setSelectedOrder(null)
      else if (searchQuery) setSearchQuery('')
    },
    onRefresh: () => void refresh(),
    onToggleSound: () => audioAlert.toggleMute(),
  })

  // 6. Calcul des KPI et séparation En cours / Historique
  const { activeOrders, historyOrders } = useMemo(() => {
    const active = orders.filter(
      (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready' || o.status === 'delivering',
    )
    const history = orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled')
    return { activeOrders: active, historyOrders: history }
  }, [orders])

  const kpis = useMemo(() => calculateTodayKpis(orders), [orders])

  // 7. Handlers de commande
  const handleTransition = async (orderRef: string, nextStatus: KdsOrderStatus) => {
    await transitionOrder(orderRef, nextStatus)
  }

  const handleCancelOrder = async (orderRef: string) => {
    await transitionOrder(orderRef, 'cancelled')
  }

  const handlePrintTicket = (order: KdsOrder) => {
    const printWindow = window.open('', '_blank', 'width=350,height=600')
    if (!printWindow) {
      window.print()
      return
    }

    const itemsHtml = order.items
      .map(
        (i) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:14px;">
          <span><strong>${i.quantity}x</strong> ${i.name}</span>
          <span>${i.unitPrice * i.quantity} F</span>
        </div>
        ${i.notes ? `<div style="font-size:11px; font-style:italic; margin-left:14px; margin-bottom:4px;">* ${i.notes}</div>` : ''}
      `,
      )
      .join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket Cuisine ${order.orderRef}</title>
          <style>
            body { font-family: monospace; width: 280px; margin: 0 auto; padding: 12px; color: #000; }
            h1 { font-size: 20px; text-align: center; margin: 4px 0; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .ref { font-size: 24px; font-weight: bold; text-align: center; margin: 6px 0; }
          </style>
        </head>
        <body>
          <h1>BMC FOOD · DAKAR</h1>
          <div style="text-align:center; font-size:12px;">Grillades & Spécialités</div>
          <div class="divider"></div>
          <div class="ref">${order.orderRef}</div>
          <div style="font-size:13px; text-align:center; margin-bottom:4px;">Type : <strong>${order.orderType.toUpperCase()}</strong></div>
          <div style="font-size:12px;">Client : ${order.customerName}</div>
          <div style="font-size:12px;">Tél : ${order.phone}</div>
          <div style="font-size:12px;">Adresse : ${order.address}</div>
          <div class="divider"></div>
          <div style="margin: 8px 0;">${itemsHtml}</div>
          ${order.notes ? `<div class="divider"></div><div style="font-size:12px; font-weight:bold;">NOTE : ${order.notes}</div>` : ''}
          <div class="divider"></div>
          <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:bold;">
            <span>TOTAL :</span>
            <span>${order.totalAmount} F CFA</span>
          </div>
          <div style="font-size:12px; text-align:right; margin-top:2px;">Paiement : ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})</div>
          <div class="divider"></div>
          <div style="text-align:center; font-size:10px;">Imprimé le ${new Date().toLocaleString('fr-FR')}</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  // Si non connecté, afficher la page de connexion administrateur
  if (!authToken) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div
      className="h-screen max-h-screen h-[100dvh] flex flex-col antialiased text-white select-none overflow-hidden kds-cuisine"
      style={{ backgroundColor: '#0B0D10' }}
    >
      <AppHeader
        currentTab={headerTab}
        onTabChange={(tab) => setHeaderTab(tab)}
        connectionState={connectionState}
        lastSyncTime={lastSyncTime}
        onManualRefresh={() => void refresh()}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      <ConnectionBanner
        connectionState={connectionState}
        onRetry={() => void refresh()}
        isRetrying={isLoading}
      />

      {headerTab === 'kds' && (
        <KpiBar
          viewMode={viewMode}
          onViewModeChange={(mode) => setViewMode(mode)}
          activeCount={activeOrders.length}
          historyCount={historyOrders.length}
          kpis={kpis}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={() => void refresh()}
          isRefreshing={isLoading}
          lastSyncTime={lastSyncTime}
          searchInputRef={searchInputRef}
        />
      )}

      {/* ZONE PRINCIPALE (100% de la hauteur restante) */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden" role="main">
        {headerTab === 'special' ? (
          <DailySpecialPage />
        ) : headerTab === 'promotions' ? (
          <PromotionsPage />
        ) : headerTab === 'transactions' ? (
          <TransactionsPage
            orders={orders}
            onRefresh={() => void refresh()}
            isRefreshing={isLoading}
          />
        ) : viewMode === 'kanban' ? (
          <KdsPage
            orders={orders}
            nowMs={nowMs}
            searchQuery={searchQuery}
            onTransition={handleTransition}
            onCancel={handleCancelOrder}
            onViewDetails={(order) => setSelectedOrder(order)}
            onPrintTicket={handlePrintTicket}
          />
        ) : (
          <HistoryPage orders={historyOrders} onSelectOrder={(order) => setSelectedOrder(order)} />
        )}
      </main>

      <OrderDetailDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onPrintTicket={handlePrintTicket}
      />

      <Toast
        undoAction={activeUndoAction}
        onUndo={(orderRef) => undoTransition(orderRef)}
        onDismiss={() => {}}
      />
    </div>
  )
}
