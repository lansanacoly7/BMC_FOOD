import {
  CheckCircle2,
  CookingPot,
  ExternalLink,
  History,
  MapPin,
  RefreshCw,
  Search,
  Timer,
  TrendingUp,
  Truck,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MOCK_ORDERS } from '../../data/mockOrders'
import { getElapsedInfo } from '../../lib/elapsed'
import { formatFcfa } from '../../lib/format'
import { fetchOrders, updateOrderStatus } from '../../services/api'
import type { Order, OrderStatus } from '../../types'
import { OrderDetailModal } from './OrderDetailModal'

interface OrdersDashboardProps {
  onRefreshEvents?: () => void
}

export function OrdersDashboard({ onRefreshEvents }: OrdersDashboardProps) {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS)
  const [activeTab, setActiveTab] = useState<'pipeline' | 'history'>('pipeline')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingRef, setUpdatingRef] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [, setTick] = useState(0)

  // Timer automatique pour actualiser les compteurs de temps écoulé
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(timer)
  }, [])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Chargement des commandes
  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetchOrders()
      if (response && response.success && Array.isArray(response.orders)) {
        setOrders(response.orders)
        setIsUsingFallback(false)
      } else {
        throw new Error('Données invalides')
      }
    } catch {
      setIsUsingFallback(true)
      setOrders((prev) => (prev.length > 0 ? prev : MOCK_ORDERS))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Polling automatique discret toutes les 10 secondes
  useEffect(() => {
    let isMounted = true
    const poll = async () => {
      try {
        const response = await fetchOrders()
        if (isMounted && response?.success && Array.isArray(response.orders)) {
          setOrders(response.orders)
          setIsUsingFallback(false)
        }
      } catch {
        if (isMounted) setIsUsingFallback(true)
      }
    }
    void poll()
    const interval = setInterval(() => void poll(), 10000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Avancement en un clic dans le workflow de cuisine
  const advanceOrderStatus = async (order: Order, nextStatus: OrderStatus) => {
    setUpdatingRef(order.order_ref)
    try {
      if (!isUsingFallback) {
        await updateOrderStatus(order.order_ref, nextStatus)
      }
      // Mise à jour optimiste instantanée
      setOrders((prev) =>
        prev.map((o) => (o.order_ref === order.order_ref ? { ...o, status: nextStatus } : o)),
      )
      if (onRefreshEvents) onRefreshEvents()

      const statusLabels: Record<OrderStatus, string> = {
        pending: 'En attente',
        confirmed: 'Confirmée',
        preparing: 'En cuisine',
        delivering: 'En livraison',
        delivered: 'Livrée avec succès',
        cancelled: 'Annulée',
      }
      showToast(`Commande #${order.order_ref} : ${statusLabels[nextStatus]}`)
    } catch {
      showToast(`Erreur lors de la mise à jour de #${order.order_ref}`)
    } finally {
      setUpdatingRef(null)
    }
  }

  // Filtrage par texte de recherche
  const filterBySearch = useCallback(
    (list: Order[]) => {
      if (!searchQuery.trim()) return list
      const q = searchQuery.trim().toLowerCase()
      return list.filter(
        (o) =>
          o.order_ref.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.phone.toLowerCase().includes(q) ||
          o.address.toLowerCase().includes(q),
      )
    },
    [searchQuery],
  )

  // Répartition par colonne KDS
  const newOrders = useMemo(
    () => filterBySearch(orders.filter((o) => o.status === 'pending' || o.status === 'confirmed')),
    [orders, filterBySearch],
  )
  const cookingOrders = useMemo(
    () => filterBySearch(orders.filter((o) => o.status === 'preparing')),
    [orders, filterBySearch],
  )
  const deliveringOrders = useMemo(
    () => filterBySearch(orders.filter((o) => o.status === 'delivering')),
    [orders, filterBySearch],
  )
  const completedOrders = useMemo(
    () => filterBySearch(orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled')),
    [orders, filterBySearch],
  )

  const activeOrdersCount = newOrders.length + cookingOrders.length + deliveringOrders.length

  const todayRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total_amount, 0)
  }, [orders])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Toast de confirmation en haut à droite */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-bmc-gold/40 bg-zinc-950/95 px-5 py-3 font-display text-sm font-bold text-bmc-gold shadow-2xl backdrop-blur-md"
          >
            <CheckCircle2 className="size-5 shrink-0 text-bmc-gold" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BARRE D'ACTIONS KDS : VUE CUISINE / HISTORIQUE + RECHERCHE */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Bascule Vue KDS en direct / Historique */}
        <div className="inline-flex rounded-2xl border border-white/10 bg-zinc-900/90 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-bmc-gold text-black shadow-md shadow-bmc-gold/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CookingPot className="size-4" />
            <span>Commandes en cours ({activeOrdersCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-bmc-gold text-black shadow-md shadow-bmc-gold/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <History className="size-4" />
            <span>Historique ({completedOrders.length})</span>
          </button>
        </div>

        {/* Chiffre du jour & Recherche rapide */}
        <div className="flex items-center gap-3">
          {/* Badge Chiffre d'Affaires du jour */}
          <div className="hidden md:flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300">
            <TrendingUp className="size-4 text-bmc-gold" />
            <span>Total :</span>
            <span className="font-display font-black text-bmc-gold tabular-nums text-sm">
              {formatFcfa(todayRevenue)}
            </span>
          </div>

          {/* Recherche rapide */}
          <div className="relative flex-1 sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher #réf, client..."
              className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 py-2 pl-9 pr-3 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:border-bmc-gold focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Bouton rafraîchir rapide */}
          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={isLoading}
            title="Rafraîchir les commandes"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-zinc-300 hover:border-bmc-gold hover:text-bmc-gold transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin text-bmc-gold' : ''}`} />
          </button>
        </div>
      </div>

      {/* VUE 1 : WORKFLOW KDS EN 3 COLONNES D'ACTION (NOUVELLES ➔ CUISINE ➔ LIVRAISON) */}
      {activeTab === 'pipeline' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          
          {/* =========================================================
              COLONNE 1 : NOUVELLES COMMANDES (À VALIDER / LANCER)
              ========================================================= */}
          <div className="flex flex-col rounded-3xl border border-amber-500/30 bg-zinc-950/60 p-4 shadow-xl space-y-4">
            {/* Header de colonne */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-amber-400 animate-ping" />
                <h2 className="font-display text-sm font-black uppercase tracking-wider text-amber-400">
                  À Préparer
                </h2>
              </div>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-black text-amber-300">
                {newOrders.length}
              </span>
            </div>

            {/* Liste des cartes de commandes */}
            <div className="space-y-4 min-h-[300px]">
              {newOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                  <CookingPot className="size-10 mb-2 opacity-30 text-amber-400" />
                  <p className="text-xs font-medium">Aucune commande en attente</p>
                </div>
              ) : (
                newOrders.map((order) => (
                  <KitchenOrderCard
                    key={order.order_ref}
                    order={order}
                    isUpdating={updatingRef === order.order_ref}
                    onOpenDetail={() => setSelectedOrder(order)}
                    actionLabel="👨‍🍳 Lancer la préparation ➔"
                    actionClass="bg-gradient-to-r from-bmc-gold to-amber-400 text-black shadow-md shadow-bmc-gold/25 hover:brightness-110"
                    onAction={() => void advanceOrderStatus(order, 'preparing')}
                  />
                ))
              )}
            </div>
          </div>

          {/* =========================================================
              COLONNE 2 : EN CUISINE (AU GRIL / EN COURS DE CUISSON)
              ========================================================= */}
          <div className="flex flex-col rounded-3xl border border-bmc-gold/30 bg-zinc-950/60 p-4 shadow-xl space-y-4">
            {/* Header de colonne */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-bmc-gold animate-pulse" />
                <h2 className="font-display text-sm font-black uppercase tracking-wider text-bmc-gold">
                  En Cuisine (Au Gril)
                </h2>
              </div>
              <span className="rounded-full bg-bmc-gold/20 px-2.5 py-0.5 text-xs font-black text-bmc-gold">
                {cookingOrders.length}
              </span>
            </div>

            {/* Liste des cartes de commandes */}
            <div className="space-y-4 min-h-[300px]">
              {cookingOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                  <CookingPot className="size-10 mb-2 opacity-30 text-bmc-gold" />
                  <p className="text-xs font-medium">Rien sur le gril pour l’instant</p>
                </div>
              ) : (
                cookingOrders.map((order) => (
                  <KitchenOrderCard
                    key={order.order_ref}
                    order={order}
                    isUpdating={updatingRef === order.order_ref}
                    onOpenDetail={() => setSelectedOrder(order)}
                    actionLabel="🛵 Prêt pour livraison ➔"
                    actionClass="bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md hover:brightness-110"
                    onAction={() => void advanceOrderStatus(order, 'delivering')}
                  />
                ))
              )}
            </div>
          </div>

          {/* =========================================================
              COLONNE 3 : EN LIVRAISON (SUR LA ROUTE)
              ========================================================= */}
          <div className="flex flex-col rounded-3xl border border-[#1DC8F2]/30 bg-zinc-950/60 p-4 shadow-xl space-y-4">
            {/* Header de colonne */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#1DC8F2] animate-pulse" />
                <h2 className="font-display text-sm font-black uppercase tracking-wider text-[#1DC8F2]">
                  En Livraison
                </h2>
              </div>
              <span className="rounded-full bg-[#1DC8F2]/20 px-2.5 py-0.5 text-xs font-black text-[#1DC8F2]">
                {deliveringOrders.length}
              </span>
            </div>

            {/* Liste des cartes de commandes */}
            <div className="space-y-4 min-h-[300px]">
              {deliveringOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                  <Truck className="size-10 mb-2 opacity-30 text-[#1DC8F2]" />
                  <p className="text-xs font-medium">Aucun livreur sur la route</p>
                </div>
              ) : (
                deliveringOrders.map((order) => (
                  <KitchenOrderCard
                    key={order.order_ref}
                    order={order}
                    isUpdating={updatingRef === order.order_ref}
                    onOpenDetail={() => setSelectedOrder(order)}
                    actionLabel="✅ Marquer comme livrée"
                    actionClass="bg-emerald-500 text-black font-extrabold shadow-md hover:bg-emerald-400"
                    onAction={() => void advanceOrderStatus(order, 'delivered')}
                  />
                ))
              )}
            </div>
          </div>

        </div>
      ) : (
        /* VUE 2 : HISTORIQUE DES COMMANDES LIVRÉES OU ANNULÉES */
        <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <h3 className="font-display text-lg font-bold text-white">
              Historique des Commandes Terminées
            </h3>
            <span className="text-xs text-zinc-400">{completedOrders.length} commandes</span>
          </div>

          {completedOrders.length === 0 ? (
            <p className="py-12 text-center text-xs text-zinc-500">Aucune commande archivée</p>
          ) : (
            <div className="divide-y divide-white/5">
              {completedOrders.map((order) => (
                <div
                  key={order.order_ref}
                  className="flex flex-wrap items-center justify-between gap-4 py-3.5 hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-black text-bmc-gold">
                      #{order.order_ref}
                    </span>
                    <span className="text-xs text-zinc-300 font-semibold">{order.customer_name}</span>
                    <span className="text-xs text-zinc-500">· {order.address}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-bold text-white tabular-nums">
                      {formatFcfa(order.total_amount)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        order.status === 'delivered'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {order.status === 'delivered' ? 'Livrée' : 'Annulée'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="text-zinc-400 hover:text-bmc-gold underline text-[11px] cursor-pointer"
                    >
                      Détails
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modale de Détail Complète (accessible au clic si besoin) */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={async (_ref, status) => {
          if (selectedOrder) {
            await advanceOrderStatus(selectedOrder, status)
          }
        }}
        isUpdating={Boolean(updatingRef)}
      />
    </div>
  )
}

/* =========================================================================
   COMPOSANT CARTE DE COMMANDE CUISINE (TICKET KDS PROFESSIONNEL)
   ========================================================================= */
interface KitchenOrderCardProps {
  order: Order
  isUpdating: boolean
  actionLabel: string
  actionClass: string
  onAction: () => void
  onOpenDetail: () => void
}

function KitchenOrderCard({
  order,
  isUpdating,
  actionLabel,
  actionClass,
  onAction,
  onOpenDetail,
}: KitchenOrderCardProps) {
  const elapsed = getElapsedInfo(order.created_at)

  // Indicateur d'urgence basé sur le temps d'attente
  const timerBadgeClass =
    elapsed.urgency === 'critical'
      ? 'bg-red-500/20 text-red-300 border border-red-500/50 animate-pulse'
      : elapsed.urgency === 'urgent'
        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
        : 'bg-zinc-800 text-zinc-300 border border-white/10'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col rounded-2xl border border-white/15 bg-zinc-900 p-4 text-left shadow-lg hover:border-bmc-gold/40 transition-all"
    >
      {/* 1. EN-TÊTE TICKET : RÉFÉRENCE & COMPTEUR TEMPS */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div>
          <span className="font-mono text-base font-black text-bmc-gold tracking-tight">
            #{order.order_ref}
          </span>
          <p className="text-[11px] text-zinc-400 font-medium">
            Client : <span className="text-white font-bold">{order.customer_name}</span>
          </p>
        </div>

        {/* Compteur temps écoulé */}
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${timerBadgeClass}`}>
          <Timer className="size-3.5" />
          <span>{elapsed.label}</span>
        </span>
      </div>

      {/* 2. CORPS : LISTE DES PLATS AVEC QUANTITÉS TRÈS LISIBLES */}
      <div className="py-3.5 space-y-2">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-baseline justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-baseline gap-2.5 min-w-0">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-bmc-gold/20 text-bmc-gold font-display font-black text-xs border border-bmc-gold/30">
                {item.quantity}
              </span>
              <span className="font-bold text-white truncate">{item.item_name}</span>
            </div>
          </div>
        ))}

        {/* Instructions spéciales si le client en a laissé */}
        {order.notes && (
          <div className="mt-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2 text-[11px] text-amber-300">
            <span className="font-bold uppercase tracking-wider text-[9px] text-amber-400 block">
              Instructions :
            </span>
            <span>{order.notes}</span>
          </div>
        )}
      </div>

      {/* 3. COORDONNÉES CLIENT & PAIEMENT */}
      <div className="flex items-center justify-between text-[11px] text-zinc-400 py-2 border-t border-white/5">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="size-3 text-bmc-gold shrink-0" />
          <span className="truncate">{order.address}</span>
        </div>
        <span className="font-bold text-white tabular-nums shrink-0">
          {formatFcfa(order.total_amount)}
        </span>
      </div>

      {/* 4. LE BOUTON D'ACTION PRINCIPAL UNIQUE KDS */}
      <div className="pt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onAction}
          disabled={isUpdating}
          className={`flex-1 rounded-xl py-2.5 px-3 font-display text-xs font-extrabold transition-all cursor-pointer disabled:opacity-50 active:scale-98 ${actionClass}`}
        >
          {isUpdating ? 'Mise à jour...' : actionLabel}
        </button>

        <button
          type="button"
          onClick={onOpenDetail}
          title="Voir le ticket complet"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-800 text-zinc-300 hover:border-bmc-gold hover:text-white transition-colors cursor-pointer"
        >
          <ExternalLink className="size-3.5" />
        </button>
      </div>
    </motion.div>
  )
}
