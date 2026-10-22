import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
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
  TrendingUp,
  Truck,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MOCK_ORDERS } from '../../data/mockOrders'
import { formatFcfa, formatTime } from '../../lib/format'
import { ORDER_STATUS_CONFIG, PAYMENT_METHOD_LABELS } from '../../lib/labels'
import { fetchOrders, updateOrderStatus } from '../../services/api'
import type { Order, OrderStatus } from '../../types'
import { OrderDetailModal } from './OrderDetailModal'

interface OrdersDashboardProps {
  onRefreshEvents?: () => void
}

type FilterTab = 'all' | OrderStatus

export function OrdersDashboard({ onRefreshEvents }: OrdersDashboardProps) {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS)
  const [selectedStatus, setSelectedStatus] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

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
    const revenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total_amount, 0)

    return { total, pending, preparing, delivering, revenue }
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

      {/* 1. SECTION KPI : Statistiques en direct de la cuisine */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1 : En Attente (Urgent) */}
        <div
          className={`rounded-3xl border p-4 sm:p-5 transition-all ${
            stats.pending > 0
              ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-950 shadow-lg shadow-amber-500/10'
              : 'border-white/10 bg-zinc-900/70'
          }`}
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
            <span className="font-display text-3xl sm:text-4xl font-black tabular-nums text-white">
              {stats.pending}
            </span>
            <span className="text-xs text-zinc-400">À valider</span>
          </div>
        </div>

        {/* KPI 2 : En Cuisine */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-bmc-gold flex items-center gap-1.5">
              <CookingPot className="size-3.5" />
              <span>En cuisine</span>
            </span>
            <span className="size-2 rounded-full bg-bmc-gold" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-3xl sm:text-4xl font-black tabular-nums text-white">
              {stats.preparing}
            </span>
            <span className="text-xs text-zinc-400">Au gril</span>
          </div>
        </div>

        {/* KPI 3 : En Livraison */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1DC8F2] flex items-center gap-1.5">
              <Truck className="size-3.5" />
              <span>En livraison</span>
            </span>
            <span className="size-2 rounded-full bg-[#1DC8F2]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-3xl sm:text-4xl font-black tabular-nums text-white">
              {stats.delivering}
            </span>
            <span className="text-xs text-zinc-400">Sur la route</span>
          </div>
        </div>

        {/* KPI 4 : Total Recettes */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="size-3.5" />
              <span>Chiffre du jour</span>
            </span>
            <span className="size-2 rounded-full bg-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-2xl sm:text-3xl font-black tabular-nums text-bmc-gold truncate">
              {formatFcfa(stats.revenue)}
            </span>
            <span className="text-xs text-zinc-400">{stats.total} cmd</span>
          </div>
        </div>
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
            title={isUsingFallback ? 'Mode démonstration local actif' : 'Connecté à l’API Django REST'}
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

          {/* Bascule Grille / Tableau */}
          <div className="inline-flex rounded-2xl border border-white/10 bg-zinc-900 p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Vue grille"
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
              onClick={() => setViewMode('table')}
              aria-label="Vue liste"
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

      {/* 3. ONGLETS DE STATUT FILTRABLES */}
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
          {
            id: 'delivered',
            label: 'Livrées',
            count: orders.filter((o) => o.status === 'delivered').length,
          },
          {
            id: 'cancelled',
            label: 'Annulées',
            count: orders.filter((o) => o.status === 'cancelled').length,
          },
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
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                  isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* 4. LISTE OU GRILLE DES COMMANDES */}
      {filteredOrders.length === 0 ? (
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
              onClick={() => setSearchQuery('')}
              className="rounded-xl border border-white/10 bg-zinc-800 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Réinitialiser la recherche
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const statusConfig = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending

            return (
              <motion.article
                key={order.order_ref}
                layout
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                className={`flex flex-col justify-between rounded-3xl border bg-zinc-900/70 p-5 shadow-lg transition-all ${
                  order.status === 'pending'
                    ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="space-y-4">
                  {/* En-tête de la carte */}
                  <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base sm:text-lg font-black text-white">
                          {order.order_ref}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${statusConfig.bgLight} ${statusConfig.color} ${statusConfig.border}`}
                        >
                          <span className={`size-1 rounded-full ${statusConfig.dotColor}`} />
                          {statusConfig.shortLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-1">
                        <Clock className="size-3" />
                        <span>{formatTime(order.created_at)}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-1 rounded-xl bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Eye className="size-3.5" />
                      <span>Détails</span>
                    </button>
                  </div>

                  {/* Infos Client & Adresse */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{order.customer_name}</span>
                      <a
                        href={`tel:${order.phone.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1 font-semibold text-bmc-gold hover:underline"
                      >
                        <Phone className="size-3" />
                        <span>{order.phone}</span>
                      </a>
                    </div>
                    <p className="text-zinc-400 flex items-start gap-1.5 line-clamp-2">
                      <MapPin className="size-3.5 shrink-0 text-zinc-500 mt-0.5" />
                      <span>{order.address}</span>
                    </p>
                  </div>

                  {/* Articles résumés */}
                  <div className="space-y-1 rounded-2xl bg-black/40 p-3 border border-white/5">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-300 truncate max-w-[180px]">
                          <strong className="text-bmc-gold font-bold">{item.quantity}×</strong>{' '}
                          {item.item_name}
                        </span>
                        <span className="text-zinc-400 tabular-nums shrink-0 font-medium">
                          {formatFcfa(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Notes spéciales si présentes */}
                  {order.notes && (
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-2.5 text-[11px] text-amber-200 line-clamp-2 italic">
                      « {order.notes} »
                    </div>
                  )}
                </div>

                {/* Pied de carte avec Montant et Actions rapides */}
                <div className="mt-4 pt-3.5 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        {PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method}
                      </span>
                      <span className="font-display text-lg font-black text-bmc-gold tabular-nums">
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
                  <div className="flex items-center gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleStatusChange(order.order_ref, 'cancelled')}
                          title="Refuser"
                          className="grid size-9 shrink-0 place-items-center rounded-xl border border-red-500/30 text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                        >
                          <X className="size-4" />
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleStatusChange(order.order_ref, 'preparing')}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 py-2.5 px-3 font-display text-xs font-black uppercase tracking-wider text-black shadow-md shadow-bmc-gold/20 hover:brightness-110 active:scale-97 transition-all cursor-pointer"
                        >
                          <CookingPot className="size-3.5" />
                          <span>Lancer en Cuisine</span>
                          <ArrowRight className="size-3.5" />
                        </button>
                      </>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleStatusChange(order.order_ref, 'delivering')}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1DC8F2] to-sky-600 py-2.5 px-3 font-display text-xs font-black uppercase tracking-wider text-white shadow-md shadow-sky-900/30 hover:brightness-110 active:scale-97 transition-all cursor-pointer"
                      >
                        <Truck className="size-3.5" />
                        <span>Prêt · Confier au Livreur</span>
                        <ArrowRight className="size-3.5" />
                      </button>
                    )}

                    {order.status === 'delivering' && (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleStatusChange(order.order_ref, 'delivered')}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-2.5 px-3 font-display text-xs font-black uppercase tracking-wider text-white shadow-md shadow-green-900/30 hover:brightness-110 active:scale-97 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>Confirmer Livraison</span>
                      </button>
                    )}

                    {order.status === 'delivered' && (
                      <span className="w-full py-2 text-center text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-xl">
                        ✓ Commande terminée
                      </span>
                    )}

                    {order.status === 'cancelled' && (
                      <span className="w-full py-2 text-center text-xs font-bold text-red-400 bg-red-500/10 rounded-xl">
                        ✕ Commande annulée
                      </span>
                    )}
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      ) : (
        /* Vue Tableau compact */
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-zinc-900/60 shadow-lg">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-white/10 bg-zinc-900 text-zinc-400 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Réf & Heure</th>
                <th className="p-4">Client</th>
                <th className="p-4">Articles</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Règlement</th>
                <th className="p-4 text-right">Montant</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredOrders.map((order) => {
                const statusConfig = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending

                return (
                  <tr key={order.order_ref} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white">
                      <div>{order.order_ref}</div>
                      <div className="text-xs text-zinc-400 font-normal">{formatTime(order.created_at)}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{order.customer_name}</div>
                      <div className="text-xs text-bmc-gold">{order.phone}</div>
                    </td>
                    <td className="p-4 text-xs text-zinc-300">
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
                    <td className="p-4 text-xs text-zinc-300">
                      <div>{PAYMENT_METHOD_LABELS[order.payment_method]}</div>
                      <div className={order.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}>
                        {order.payment_status === 'paid' ? 'Payé' : 'À encaisser'}
                      </div>
                    </td>
                    <td className="p-4 text-right font-display font-black text-bmc-gold tabular-nums text-base">
                      {formatFcfa(order.total_amount)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
                      >
                        Gérer
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
