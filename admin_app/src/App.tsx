import { useEffect, useRef, useState } from 'react'
import {
  clearAuthToken,
  DEV_DEFAULT_TOKEN,
  getAuthToken,
  getAuthUser,
  SESSION_EXPIRED_EVENT,
  setAuthToken,
} from './api/client'
import { AppHeader, type AdminTab } from './components/common/AppHeader'
import { AdminSidebar } from './components/common/AdminSidebar'
import { ConnectionBanner } from './components/common/ConnectionBanner'
import { Toast } from './components/common/Toast'
import { Notice } from './components/ui/primitives'
import { OrderDetailDrawer } from './components/kds/OrderDetailDrawer'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useNow } from './hooks/useNow'
import { useOrders } from './hooks/useOrders'
import { useWakeLock } from './hooks/useWakeLock'
import { audioAlert } from './lib/audioAlert'
import { DailySpecialPage } from './pages/DailySpecialPage'
import { KdsPage } from './pages/KdsPage'
import { LoginPage } from './pages/LoginPage'
import { PromotionsPage } from './pages/PromotionsPage'
import { StaffPage } from './pages/StaffPage'
import { TransactionsPage } from './pages/TransactionsPage'
import type { KdsOrder, KdsOrderStatus, OrderType } from './types/kds'

export default function App() {
  // 0. État d'authentification administrateur
  const [authToken, setAuthTokenState] = useState<string | null>(() => {
    const storedToken = getAuthToken()
    if (storedToken || !import.meta.env.DEV) return storedToken
    // En développement, la connexion automatique doit aussi servir aux appels API.
    setAuthToken(DEV_DEFAULT_TOKEN)
    return DEV_DEFAULT_TOKEN
  })
  const [currentUser, setCurrentUserState] = useState<string | null>(() => getAuthUser() || 'admin')

  const handleLoginSuccess = (user: string) => {
    setAuthTokenState(getAuthToken())
    setCurrentUserState(user)
    void refresh()
  }

  const handleLogout = () => {
    clearAuthToken()
    setAuthTokenState(null)
    setCurrentUserState(null)
  }

  const [headerTab, setHeaderTab] = useState<AdminTab>('kds')
  // Sur tablette, la cuisine garde toute la largeur : le menu démarre replié.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => window.innerWidth < 1280)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<'all' | OrderType>('all')
  const [selectedOrder, setSelectedOrder] = useState<KdsOrder | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // 1. Horloge globale partagée (1 tick / seconde)
  const nowMs = useNow(1000)

  // 2. Anti-veille écran de cuisine automatique (Screen Wake Lock API)
  useWakeLock()

  // 3. Cycle de vie temps réel et polling des commandes (5s)
  const {
    orders,
    isLoading,
    connectionState,
    actionError,
    newOrdersSet,
    isAudioMuted,
    toggleAudio,
    refresh,
    transitionOrder,
    undoTransition,
    activeUndoAction,
    acknowledgeNewOrders,
  } = useOrders(nowMs)

  // Jeton refusé par le serveur : retour à la page de connexion
  useEffect(() => {
    const handleSessionExpired = () => {
      setAuthTokenState(null)
      setCurrentUserState(null)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
  }, [])

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
    onToggleSound: () => {
      toggleAudio()
    },
  })

  // 6. Handlers de commande
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
      className={`flex h-[100dvh] flex-row overflow-hidden bg-canvas font-sans text-ink antialiased ${
        headerTab === 'kds' ? 'theme-dark select-none' : 'theme-light'
      }`}
    >
      <AdminSidebar
        currentTab={headerTab}
        onTabChange={(tab) => setHeaderTab(tab)}
        onLogout={handleLogout}
        currentUser={currentUser}
        isCollapsed={isSidebarCollapsed}
        liveCount={orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* L'écran cuisine porte sa propre barre (filtres et indicateurs de service). */}
        {headerTab !== 'kds' && (
          <AppHeader
            currentTab={headerTab}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
            isAudioMuted={isAudioMuted}
            onToggleAudio={toggleAudio}
          />
        )}

        <ConnectionBanner
          connectionState={connectionState}
          onRetry={() => void refresh()}
          isRetrying={isLoading}
        />

                <main className="flex-1 flex flex-col min-h-0 overflow-hidden" role="main">
          {headerTab === 'special' ? (
            <DailySpecialPage />
          ) : headerTab === 'promotions' ? (
            <PromotionsPage />
          ) : headerTab === 'transactions' ? (
            <TransactionsPage orders={orders} />
          ) : headerTab === 'staff' ? (
            <StaffPage />
          ) : (
            <KdsPage
              orders={orders}
              nowMs={nowMs}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              newOrdersSet={newOrdersSet}
              isAudioMuted={isAudioMuted}
              onToggleAudio={toggleAudio}
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
              onTransition={handleTransition}
              onCancel={handleCancelOrder}
              onViewDetails={(order) => setSelectedOrder(order)}
              onPrintTicket={handlePrintTicket}
            />
          )}
        </main>
      </div>

      <OrderDetailDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onPrintTicket={handlePrintTicket}
        onTransition={handleTransition}
        onCancel={handleCancelOrder}
      />

      <Notice notice={actionError ? { message: actionError, type: 'error' } : null} />

      <Toast
        undoAction={activeUndoAction}
        onUndo={(orderRef) => undoTransition(orderRef)}
      />
    </div>
  )
}
