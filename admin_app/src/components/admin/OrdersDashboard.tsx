import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Columns3,
  CookingPot,
  Eye,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  Timer,
  TrendingUp,
  Truck,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MOCK_ORDERS } from '../../data/mockOrders'
import { getElapsedInfo } from '../../lib/elapsed'
import { formatFcfa, formatTime } from '../../lib/format'
import { ORDER_STATUS_CONFIG, PAYMENT_METHOD_LABELS } from '../../lib/labels'
import { fetchOrders, updateOrderStatus } from '../../services/api'
import type { Order, OrderStatus } from '../../types'
import { OrderDetailModal } from './OrderDetailModal'

interface OrdersDashboardProps {
  onRefreshEvents?: () => void
}

type FilterTab = 'all' | OrderStatus
type ViewMode = 'grid' | 'table' | 'kanban'

/** Kanban columns in logical flow order. */
const KANBAN_COLUMNS: { status: OrderStatus; label: string; emptyLabel: string; accentVar: string }[] = [
  { status: 'pending', label: 'Nouvelles', emptyLabel: 'Aucune commande en attente', accentVar: '#F59E0B' },
  { status: 'preparing', label: 'En Cuisine', emptyLabel: 'Rien au gril pour l\'instant', accentVar: '#FCB800' },
  { status: 'delivering', label: 'En Livraison', emptyLabel: 'Aucune livraison en cours', accentVar: '#1DC8F2' },
  { status: 'delivered', label: 'Terminées', emptyLabel: 'Pas encore de commandes livrées', accentVar: '#10B981' },
]

export function OrdersDashboard({ onRefreshEvents }: OrdersDashboardProps) {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS)
  const [selectedStatus, setSelectedStatus] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [, setTick] = useState(0) // Force re-render for elapsed timers

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  // Timer ticker: re-render every 30s to update elapsed counters
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(interval)
  }, [])

  // Chargement des commandes depuis l'API ou fallback MOCK_ORDERS
  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetchOrders()
      if (response && response.success && Array.isArray(response.orders)) {
        setOrders(response.orders)
        setIsUsingFallback(false)
      } else {
        throw new Error('Réponse invalide du serveur')
      }
    } catch {
      // Si le backend n'est pas lancé, on conserve les fausses commandes réalistes
      setIsUsingFallback(true)
      setOrders((prev) => (prev.length > 0 ? prev : MOCK_ORDERS))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const fetchAndUpdate = () => {
      void fetchOrders()
        .then((response) => {
          if (!isMounted) return
          if (response && response.success && Array.isArray(response.orders)) {
            setOrders(response.orders)
            setIsUsingFallback(false)
          } else {
            setIsUsingFallback(true)
            setOrders((prev) => (prev.length > 0 ? prev : MOCK_ORDERS))
          }
        })
        .catch(() => {
          if (!isMounted) return
          setIsUsingFallback(true)
          setOrders((prev) => (prev.length > 0 ? prev : MOCK_ORDERS))
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false)
          }
        })
    }

    fetchAndUpdate()
    // Polling doux toutes les 15s pour actualiser les commandes
    const interval = setInterval(fetchAndUpdate, 15000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Changement de statut d'une commande
  const handleStatusChange = async (orderRef: string, newStatus: OrderStatus) => {
    setIsUpdatingStatus(true)
    try {
      if (!isUsingFallback) {
        await updateOrderStatus(orderRef, newStatus)
      }
      // Mise à jour locale optimiste
      setOrders((prev) =>
        prev.map((o) => (o.order_ref === orderRef ? { ...o, status: newStatus } : o)),
      )
      if (selectedOrder && selectedOrder.order_ref === orderRef) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
      const label = ORDER_STATUS_CONFIG[newStatus]?.shortLabel ?? newStatus
      showNotification(`Commande ${orderRef} passée en statut « ${label} »`)
      onRefreshEvents?.()
    } catch (err: unknown) {
      showNotification(
        err instanceof Error ? err.message : 'Impossible de changer le statut',
        'error',
      )
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Statistiques en direct (KPIs)
  const stats = useMemo(() => {
    const total = orders.length
    const pending = orders.filter((o) => o.status === 'pending').length
    const preparing = orders.filter((o) => o.status === 'preparing').length
    const delivering = orders.filter((o) => o.status === 'delivering').length
    const delivered = orders.filter((o) => o.status === 'delivered').length
    const cancelled = orders.filter((o) => o.status === 'cancelled').length
    const revenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total_amount, 0)

    return { total, pending, preparing, delivering, delivered, cancelled, revenue }
  }, [orders])

  // Filtrage combiné : onglet statut + texte de recherche
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchStatus = selectedStatus === 'all' || order.status === selectedStatus
      const q = searchQuery.trim().toLowerCase()
      const matchSearch =
        q === '' ||
        order.order_ref.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.phone.toLowerCase().includes(q) ||
        order.address.toLowerCase().includes(q)

      return matchStatus && matchSearch
    })
  }, [orders, selectedStatus, searchQuery])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-left">
      {/* Toast de Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 rounded-2xl px-4 py-3 shadow-2xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 backdrop-blur-md ${
              notification.type === 'success'
                ? 'bg-zinc-900/95 border-bmc-gold/40 text-bmc-gold'
                : 'bg-red-950/95 border-red-500/40 text-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0 text-bmc-gold" />
            ) : (
              <AlertCircle className="size-4 shrink-0 text-red-400" />
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. SECTION KPI PREMIUM : Statistiques en direct de la cuisine */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* KPI 1 : En Attente (Urgent) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`kpi-card rounded-3xl border p-4 sm:p-5 transition-all ${
            stats.pending > 0
              ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-950 shadow-lg shadow-amber-500/10 animate-shimmer-gold'
              : 'border-white/10 bg-zinc-900/70'
          }`}
          style={{ '--kpi-accent': '#F59E0B' } as React.CSSProperties}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <span>En attente</span>
            </span>
            {stats.pending > 0 && (
              <span className="size-2.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <motion.span
              key={stats.pending}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-display text-3xl sm:text-4xl font-black tabular-nums text-white"
            >
              {stats.pending}
            </motion.span>
            <span className="text-xs text-zinc-400">À valider</span>
          </div>
        </motion.div>

        {/* KPI 2 : En Cuisine */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="kpi-card rounded-3xl border border-white/10 bg-zinc-900/70 p-4 sm:p-5"
          style={{ '--kpi-accent': '#FCB800' } as React.CSSProperties}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-bmc-gold flex items-center gap-1.5">
              <CookingPot className="size-3.5" />
              <span>En cuisine</span>
            </span>
            {stats.preparing > 0 && <span className="size-2 rounded-full bg-bmc-gold animate-pulse" />}
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <motion.span
              key={stats.preparing}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-display text-3xl sm:text-4xl font-black tabular-nums text-white"
            >
              {stats.preparing}
            </motion.span>
            <span className="text-xs text-zinc-400">Au gril</span>
          </div>
        </motion.div>

        {/* KPI 3 : En Livraison */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="kpi-card rounded-3xl border border-white/10 bg-zinc-900/70 p-4 sm:p-5"
          style={{ '--kpi-accent': '#1DC8F2' } as React.CSSProperties}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1DC8F2] flex items-center gap-1.5">
              <Truck className="size-3.5" />
              <span>En livraison</span>
            </span>
            {stats.delivering > 0 && <span className="size-2 rounded-full bg-[#1DC8F2] animate-pulse" />}
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <motion.span
              key={stats.delivering}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-display text-3xl sm:text-4xl font-black tabular-nums text-white"
            >
              {stats.delivering}
            </motion.span>
            <span className="text-xs text-zinc-400">Sur la route</span>
          </div>
        </motion.div>

        {/* KPI 4 : Livrées */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="kpi-card rounded-3xl border border-white/10 bg-zinc-900/70 p-4 sm:p-5"
          style={{ '--kpi-accent': '#10B981' } as React.CSSProperties}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              <span>Livrées</span>
            </span>
            <span className="size-2 rounded-full bg-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <motion.span
              key={stats.delivered}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-display text-3xl sm:text-4xl font-black tabular-nums text-white"
            >
              {stats.delivered}
            </motion.span>
            <span className="text-xs text-zinc-400">Terminées</span>
          </div>
        </motion.div>

        {/* KPI 5 : Total Recettes */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="kpi-card col-span-2 lg:col-span-1 rounded-3xl border border-bmc-gold/20 bg-gradient-to-br from-bmc-gold/10 via-zinc-900 to-zinc-950 p-4 sm:p-5"
          style={{ '--kpi-accent': '#FCB800' } as React.CSSProperties}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-bmc-gold flex items-center gap-1.5">
              <TrendingUp className="size-3.5" />
              <span>Chiffre du jour</span>
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <motion.span
              key={stats.revenue}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-display text-xl sm:text-2xl font-black tabular-nums text-gradient-gold truncate"
              style={{ WebkitTextFillColor: 'unset' }}
            >
              {formatFcfa(stats.revenue)}
            </motion.span>
            <span className="text-xs text-zinc-400 shrink-0">{stats.total} cmd</span>
          </div>
        </motion.div>
      </div>

      {/* 2. BARRE D'OUTILS : Recherche, Filtres & Bascule Vue */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        {/* Recherche rapide */}
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par réf (ex: BMC-849201), client, téléphone..."
            className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:border-bmc-gold focus:outline-none shadow-xs"
          />
        </div>

        {/* Actions et Contrôles */}
        <div className="flex items-center justify-between md:justify-end gap-2.5">
          {/* Indicateur Mode API / Fallback */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border ${
              isUsingFallback
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
            title={isUsingFallback ? 'Mode démonstration local actif' : 'Connecté à l\'API Django REST'}
          >
            <span
              className={`size-1.5 rounded-full ${isUsingFallback ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`}
            />
            <span>{isUsingFallback ? 'Mode Démo' : 'API En direct'}</span>
          </span>

          {/* Bouton Rafraîchir */}
          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={isLoading}
            title="Rafraîchir les commandes"
            className="grid size-10 place-items-center rounded-2xl bg-zinc-900 border border-white/10 text-zinc-300 hover:border-bmc-gold hover:text-bmc-gold transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin text-bmc-gold' : ''}`} />
          </button>

          {/* Bascule Grille / Kanban / Tableau */}
          <div className="inline-flex rounded-2xl border border-white/10 bg-zinc-900 p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Vue grille"
              title="Vue Grille"
              className={`grid size-8 place-items-center rounded-xl transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-bmc-gold text-black shadow-xs font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              aria-label="Vue Kanban"
              title="Vue Kanban Cuisine"
              className={`grid size-8 place-items-center rounded-xl transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-bmc-gold text-black shadow-xs font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Columns3 className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Vue liste"
              title="Vue Tableau"
              className={`grid size-8 place-items-center rounded-xl transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-bmc-gold text-black shadow-xs font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. ONGLETS DE STATUT FILTRABLES (hidden in kanban mode) */}
      {viewMode !== 'kanban' && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1 shrink-0 mr-1">
            <Filter className="size-3.5" />
            <span>Filtres :</span>
          </span>

          {[
            { id: 'all', label: 'Toutes', count: stats.total },
            { id: 'pending', label: 'En attente', count: stats.pending },
            { id: 'preparing', label: 'En cuisine', count: stats.preparing },
            { id: 'delivering', label: 'En livraison', count: stats.delivering },
            { id: 'delivered', label: 'Livrées', count: stats.delivered },
            { id: 'cancelled', label: 'Annulées', count: stats.cancelled },
          ].map((tab) => {
            const isActive = selectedStatus === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id as FilterTab)}
                className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-bmc-gold text-black shadow-md shadow-bmc-gold/20'
                    : 'bg-zinc-900 border border-white/10 text-zinc-300 hover:border-white/25 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                    isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* 4. VUES DES COMMANDES */}
      {viewMode === 'kanban' ? (
        <KanbanView
          orders={orders}
          searchQuery={searchQuery}
          isUpdatingStatus={isUpdatingStatus}
          onStatusChange={handleStatusChange}
          onSelectOrder={setSelectedOrder}
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState searchQuery={searchQuery} onClear={() => setSearchQuery('')} />
      ) : viewMode === 'grid' ? (
        <GridView
          orders={filteredOrders}
          isUpdatingStatus={isUpdatingStatus}
          onStatusChange={handleStatusChange}
          onSelectOrder={setSelectedOrder}
        />
      ) : (
        <TableView
          orders={filteredOrders}
          isUpdatingStatus={isUpdatingStatus}
          onStatusChange={handleStatusChange}
          onSelectOrder={setSelectedOrder}
        />
      )}

      {/* 5. MODALE DE DÉTAIL COMMANDE */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleStatusChange}
        isUpdating={isUpdatingStatus}
      />
    </div>
  )
}

/* ─────────────────────── SOUS-COMPOSANTS ─────────────────────── */

/** Card component réutilisable pour Grille et Kanban */
function OrderCard({
  order,
  compact = false,
  isUpdatingStatus,
  onStatusChange,
  onSelectOrder,
}: {
  order: Order
  compact?: boolean
  isUpdatingStatus: boolean
  onStatusChange: (ref: string, status: OrderStatus) => Promise<void>
  onSelectOrder: (order: Order) => void
}) {
  const statusConfig = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending
  const elapsed = getElapsedInfo(order.created_at)
  const isActive = order.status === 'pending' || order.status === 'preparing'

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={`flex flex-col justify-between rounded-2xl border glass-card glass-card-hover p-4 shadow-lg transition-all ${
        order.status === 'pending'
          ? 'animate-urgent-border ring-1 ring-amber-500/20'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div className="space-y-3">
        {/* En-tête de la carte */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-black text-white">
                {order.order_ref}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${statusConfig.bgLight} ${statusConfig.color} ${statusConfig.border}`}
              >
                <span className={`size-1 rounded-full ${statusConfig.dotColor}`} />
                {statusConfig.shortLabel}
              </span>
            </div>
            {/* Elapsed timer for active orders */}
            {isActive && (
              <div className={`flex items-center gap-1 mt-1 text-[11px] font-bold timer-${elapsed.urgency}`}>
                <Timer className="size-3" />
                <span>{elapsed.label}</span>
              </div>
            )}
            {!isActive && (
              <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-1">
                <Clock className="size-3" />
                <span>{formatTime(order.created_at)}</span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelectOrder(order)}
            className="inline-flex items-center gap-1 rounded-xl bg-white/5 hover:bg-white/10 px-2 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <Eye className="size-3.5" />
            {!compact && <span>Détails</span>}
          </button>
        </div>

        {/* Infos Client & Adresse */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm truncate">{order.customer_name}</span>
            <a
              href={`tel:${order.phone.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-1 font-semibold text-bmc-gold hover:underline shrink-0"
            >
              <Phone className="size-3" />
              <span>{order.phone}</span>
            </a>
          </div>
          {!compact && (
            <p className="text-zinc-400 flex items-start gap-1.5 line-clamp-1">
              <MapPin className="size-3 shrink-0 text-zinc-500 mt-0.5" />
              <span>{order.address}</span>
            </p>
          )}
        </div>

        {/* Articles résumés */}
        <div className="space-y-1 rounded-xl bg-black/40 p-2.5 border border-white/5">
          {order.items.slice(0, compact ? 2 : undefined).map((item) => (
            <div key={item.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 truncate max-w-[150px]">
                <strong className="text-bmc-gold font-bold">{item.quantity}×</strong>{' '}
                {item.item_name}
              </span>
              <span className="text-zinc-400 tabular-nums shrink-0 font-medium">
                {formatFcfa(item.subtotal)}
              </span>
            </div>
          ))}
          {compact && order.items.length > 2 && (
            <p className="text-[10px] text-zinc-500 text-center pt-0.5">
              +{order.items.length - 2} autre{order.items.length - 2 > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Notes spéciales si présentes */}
        {order.notes && !compact && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-2 text-[11px] text-amber-200 line-clamp-2 italic">
            « {order.notes} »
          </div>
        )}
      </div>

      {/* Pied de carte avec Montant et Actions rapides */}
      <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method}
            </span>
            <span className="font-display text-base font-black text-bmc-gold tabular-nums">
              {formatFcfa(order.total_amount)}
            </span>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              order.payment_status === 'paid'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-amber-500/15 text-amber-400'
            }`}
          >
            {order.payment_status === 'paid' ? 'Payé' : 'À encaisser'}
          </span>
        </div>

        {/* Boutons d'action rapides de transition */}
        <StatusActionButtons
          order={order}
          isUpdating={isUpdatingStatus}
          onStatusChange={onStatusChange}
          compact={compact}
        />
      </div>
    </motion.article>
  )
}

/** Boutons d'action de transition de statut, réutilisés partout */
function StatusActionButtons({
  order,
  isUpdating,
  onStatusChange,
  compact = false,
}: {
  order: Order
  isUpdating: boolean
  onStatusChange: (ref: string, status: OrderStatus) => Promise<void>
  compact?: boolean
}) {
  const btnText = compact ? 'text-[10px]' : 'text-xs'

  return (
    <div className="flex items-center gap-2">
      {order.status === 'pending' && (
        <>
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => void onStatusChange(order.order_ref, 'cancelled')}
            title="Refuser"
            className="grid size-8 shrink-0 place-items-center rounded-xl border border-red-500/30 text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => void onStatusChange(order.order_ref, 'preparing')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 py-2 px-3 font-display ${btnText} font-black uppercase tracking-wider text-black shadow-md shadow-bmc-gold/20 hover:brightness-110 active:scale-97 transition-all cursor-pointer`}
          >
            <CookingPot className="size-3.5" />
            <span>{compact ? 'Cuisine' : 'Lancer en Cuisine'}</span>
            <ArrowRight className="size-3.5" />
          </button>
        </>
      )}

      {order.status === 'preparing' && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => void onStatusChange(order.order_ref, 'delivering')}
          className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1DC8F2] to-sky-600 py-2 px-3 font-display ${btnText} font-black uppercase tracking-wider text-white shadow-md shadow-sky-900/30 hover:brightness-110 active:scale-97 transition-all cursor-pointer`}
        >
          <Truck className="size-3.5" />
          <span>{compact ? 'Livreur' : 'Prêt · Confier au Livreur'}</span>
          <ArrowRight className="size-3.5" />
        </button>
      )}

      {order.status === 'delivering' && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => void onStatusChange(order.order_ref, 'delivered')}
          className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-2 px-3 font-display ${btnText} font-black uppercase tracking-wider text-white shadow-md shadow-green-900/30 hover:brightness-110 active:scale-97 transition-all cursor-pointer`}
        >
          <CheckCircle2 className="size-3.5" />
          <span>{compact ? 'Livré' : 'Confirmer Livraison'}</span>
        </button>
      )}

      {order.status === 'delivered' && (
        <span className={`w-full py-1.5 text-center ${btnText} font-bold text-emerald-400 bg-emerald-500/10 rounded-xl`}>
          ✓ Terminée
        </span>
      )}

      {order.status === 'cancelled' && (
        <span className={`w-full py-1.5 text-center ${btnText} font-bold text-red-400 bg-red-500/10 rounded-xl`}>
          ✕ Annulée
        </span>
      )}
    </div>
  )
}

/** Vue Grille (originale, améliorée) */
function GridView({
  orders,
  isUpdatingStatus,
  onStatusChange,
  onSelectOrder,
}: {
  orders: Order[]
  isUpdatingStatus: boolean
  onStatusChange: (ref: string, status: OrderStatus) => Promise<void>
  onSelectOrder: (order: Order) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence mode="popLayout">
        {orders.map((order) => (
          <OrderCard
            key={order.order_ref}
            order={order}
            isUpdatingStatus={isUpdatingStatus}
            onStatusChange={onStatusChange}
            onSelectOrder={onSelectOrder}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

/** Vue Kanban — colonnes par statut avec cartes compactes */
function KanbanView({
  orders,
  searchQuery,
  isUpdatingStatus,
  onStatusChange,
  onSelectOrder,
}: {
  orders: Order[]
  searchQuery: string
  isUpdatingStatus: boolean
  onStatusChange: (ref: string, status: OrderStatus) => Promise<void>
  onSelectOrder: (order: Order) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Filter by search but not by status (kanban shows all statuses)
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (q === '') return orders
    return orders.filter(
      (o) =>
        o.order_ref.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q),
    )
  }, [orders, searchQuery])

  return (
    <div
      ref={scrollRef}
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {KANBAN_COLUMNS.map((col) => {
        const columnOrders = filteredOrders.filter((o) => o.status === col.status)
        return (
          <motion.div
            key={col.status}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="kanban-column flex flex-col gap-3"
          >
            {/* Column header */}
            <div
              className="flex items-center justify-between rounded-2xl px-4 py-3 border border-white/10"
              style={{
                background: `linear-gradient(135deg, ${col.accentVar}15, transparent)`,
                borderTopColor: `${col.accentVar}40`,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: col.accentVar }}
                />
                <span className="font-display text-sm font-black text-white">
                  {col.label}
                </span>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-black"
                style={{
                  backgroundColor: `${col.accentVar}20`,
                  color: col.accentVar,
                }}
              >
                {columnOrders.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3 flex-1">
              <AnimatePresence mode="popLayout">
                {columnOrders.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-900/30 p-6 min-h-[120px]"
                  >
                    <p className="text-xs text-zinc-500 text-center">{col.emptyLabel}</p>
                  </motion.div>
                ) : (
                  columnOrders.map((order) => (
                    <OrderCard
                      key={order.order_ref}
                      order={order}
                      compact
                      isUpdatingStatus={isUpdatingStatus}
                      onStatusChange={onStatusChange}
                      onSelectOrder={onSelectOrder}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/** Vue Tableau compact */
function TableView({
  orders,
  isUpdatingStatus,
  onStatusChange,
  onSelectOrder,
}: {
  orders: Order[]
  isUpdatingStatus: boolean
  onStatusChange: (ref: string, status: OrderStatus) => Promise<void>
  onSelectOrder: (order: Order) => void
}) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-zinc-900/60 shadow-lg">
      <table className="w-full text-left text-xs sm:text-sm">
        <thead className="border-b border-white/10 bg-zinc-900 text-zinc-400 text-xs font-bold uppercase tracking-wider">
          <tr>
            <th className="p-4">Réf & Heure</th>
            <th className="p-4">Client</th>
            <th className="p-4">Articles</th>
            <th className="p-4">Statut</th>
            <th className="p-4">Temps</th>
            <th className="p-4">Règlement</th>
            <th className="p-4 text-right">Montant</th>
            <th className="p-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {orders.map((order) => {
            const statusConfig = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending
            const elapsed = getElapsedInfo(order.created_at)
            const isActive = order.status === 'pending' || order.status === 'preparing'

            return (
              <tr
                key={order.order_ref}
                className={`hover:bg-white/5 transition-colors ${
                  order.status === 'pending' ? 'bg-amber-500/5' : ''
                }`}
              >
                <td className="p-4 font-bold text-white">
                  <div>{order.order_ref}</div>
                  <div className="text-xs text-zinc-400 font-normal">{formatTime(order.created_at)}</div>
                </td>
                <td className="p-4">
                  <div className="font-semibold text-white">{order.customer_name}</div>
                  <div className="text-xs text-bmc-gold">{order.phone}</div>
                </td>
                <td className="p-4 text-xs text-zinc-300 max-w-[200px] truncate">
                  {order.items.map((i) => `${i.quantity}× ${i.item_name}`).join(', ')}
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${statusConfig.bgLight} ${statusConfig.color} ${statusConfig.border}`}
                  >
                    <span className={`size-1.5 rounded-full ${statusConfig.dotColor}`} />
                    {statusConfig.shortLabel}
                  </span>
                </td>
                <td className="p-4">
                  {isActive ? (
                    <span className={`text-xs font-bold timer-${elapsed.urgency} flex items-center gap-1`}>
                      <Timer className="size-3" />
                      {elapsed.label}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500">—</span>
                  )}
                </td>
                <td className="p-4 text-xs text-zinc-300">
                  <div>{PAYMENT_METHOD_LABELS[order.payment_method]}</div>
                  <div className={order.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}>
                    {order.payment_status === 'paid' ? 'Payé' : 'À encaisser'}
                  </div>
                </td>
                <td className="p-4 text-right font-display font-black text-bmc-gold tabular-nums text-base">
                  {formatFcfa(order.total_amount)}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => onSelectOrder(order)}
                      className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      Gérer
                    </button>
                    {order.status === 'pending' && (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => void onStatusChange(order.order_ref, 'preparing')}
                        className="rounded-xl bg-bmc-gold/20 text-bmc-gold hover:bg-bmc-gold/30 px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Cuisine →
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Empty state */
function EmptyState({ searchQuery, onClear }: { searchQuery: string; onClear: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-zinc-900/30 p-12 text-center space-y-3">
      <ShoppingBag className="mx-auto size-10 text-zinc-600" />
      <p className="font-display text-lg font-bold text-white">Aucune commande trouvée</p>
      <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
        {searchQuery
          ? `Aucune commande ne correspond au critère « ${searchQuery} ».`
          : 'Aucune commande dans cette catégorie pour le moment.'}
      </p>
      {searchQuery && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl border border-white/10 bg-zinc-800 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          Réinitialiser la recherche
        </button>
      )}
    </div>
  )
}
