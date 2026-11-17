import { useEffect, useState, useTransition } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  Check,
  ChefHat,
  Clock,
  Copy,
  Package,
  Phone,
  RefreshCw,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { formatFcfa } from '../../lib/format'
import {
  cancelClientOrder,
  fetchOrderTrack,
  type OrderTrackData,
} from '../../services/tracking'
import { loadHistory, ORDERS_CHANGED_EVENT, updateOrderStatus, type OrderSummary } from '../../services/clientData'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import type { OrderStatus } from '../../types'

const RESTAURANT_PHONE = '+221 77 856 13 13'
const RESTAURANT_TEL = 'tel:+221778561313'

interface TrackOrderViewProps {
  initialRef?: string
  onBack?: () => void
  backLabel?: string
  onExploreMenu?: () => void
}

interface StepInfo {
  id: string
  label: string
  sublabel: string
}

const STEPS_DELIVERY: StepInfo[] = [
  { id: 'pending', label: 'Reçue', sublabel: 'En attente' },
  { id: 'preparing', label: 'En cuisine', sublabel: 'En préparation' },
  { id: 'delivering', label: 'En route', sublabel: 'Livraison' },
  { id: 'delivered', label: 'Livrée', sublabel: 'Remise' },
]

const STEPS_PICKUP: StepInfo[] = [
  { id: 'pending', label: 'Reçue', sublabel: 'En attente' },
  { id: 'preparing', label: 'En cuisine', sublabel: 'En préparation' },
  { id: 'ready', label: 'Prête', sublabel: 'Au comptoir' },
  { id: 'delivered', label: 'Retirée', sublabel: 'Terminée' },
]

function getStepIndex(status: OrderStatus, isPickup: boolean): number {
  switch (status) {
    case 'pending':
      return 0
    case 'confirmed':
    case 'preparing':
      return 1
    case 'ready':
      return isPickup ? 2 : 1
    case 'delivering':
      return 2
    case 'delivered':
      return 3
    case 'cancelled':
      return -1
    default:
      return 0
  }
}

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return {
        label: 'En attente',
        bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        dot: 'bg-amber-400 animate-pulse',
        icon: Clock,
      }
    case 'confirmed':
    case 'preparing':
      return {
        label: 'En préparation',
        bg: 'bg-bmc-gold/15 border-bmc-gold/30 text-bmc-gold',
        dot: 'bg-bmc-gold animate-pulse',
        icon: ChefHat,
      }
    case 'ready':
      return {
        label: 'Prête au comptoir',
        bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
        dot: 'bg-cyan-400 animate-pulse',
        icon: Package,
      }
    case 'delivering':
      return {
        label: 'En cours de livraison',
        bg: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
        dot: 'bg-sky-400 animate-pulse',
        icon: Truck,
      }
    case 'delivered':
      return {
        label: 'Commande livrée',
        bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
        dot: 'bg-emerald-400',
        icon: Check,
      }
    case 'cancelled':
      return {
        label: 'Commande annulée',
        bg: 'bg-red-500/15 border-red-500/30 text-red-400',
        dot: 'bg-red-500',
        icon: Ban,
      }
    default:
      return {
        label: status,
        bg: 'bg-zinc-800 border-zinc-700 text-zinc-300',
        dot: 'bg-zinc-400',
        icon: Clock,
      }
  }
}

function getStatusDescription(status: OrderStatus, isPickup: boolean, cancelReason?: string | null): string {
  switch (status) {
    case 'pending':
      return 'Votre commande a bien été reçue. Notre équipe va la valider sous peu et lancer sa préparation.'
    case 'confirmed':
    case 'preparing':
      return 'Votre commande est en cuisine. Nos cuisiniers s’activent pour préparer vos plats avec les ingrédients les plus frais.'
    case 'ready':
      return isPickup
        ? 'Votre commande est prête ! Vous pouvez vous présenter au restaurant pour la récupérer au comptoir.'
        : 'Votre commande est prête et attend la prise en charge par le livreur.'
    case 'delivering':
      return 'Le livreur est en route avec votre commande. Merci de garder votre téléphone à proximité.'
    case 'delivered':
      return isPickup
        ? 'Commande retirée au restaurant. Merci pour votre fidélité et bon appétit !'
        : 'Commande livrée à votre adresse. Merci pour votre confiance et bon appétit avec BMC Food !'
    case 'cancelled':
      return cancelReason
        ? `Cette commande a été annulée. Motif : ${cancelReason}`
        : 'Cette commande a été annulée. Si vous avez des questions, n’hésitez pas à contacter notre équipe.'
    default:
      return 'Suivi de votre commande en direct.'
  }
}

function getChipStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'En attente'
    case 'confirmed':
      return 'Confirmée'
    case 'preparing':
      return 'En préparation'
    case 'ready':
      return 'Prête'
    case 'delivering':
      return 'En route'
    case 'delivered':
      return 'Livrée'
    case 'cancelled':
      return 'Annulée'
    default:
      return 'En cours'
  }
}

export function TrackOrderView({
  initialRef = '',
  onBack,
  backLabel = 'Retour',
  onExploreMenu,
}: TrackOrderViewProps) {
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>(() => {
    try {
      return loadHistory().slice(0, 4)
    } catch {
      return []
    }
  })
  const [selectedRef, setSelectedRef] = useState<string>(() => {
    const fromProp = initialRef.trim().toUpperCase()
    if (fromProp) return fromProp
    try {
      return loadHistory()[0]?.order_ref?.trim().toUpperCase() || ''
    } catch {
      return ''
    }
  })
  const [currentOrder, setCurrentOrder] = useState<OrderTrackData | null>(null)
  const [isLoading, setIsLoading] = useState(() => Boolean(selectedRef))
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const executeTrack = async (targetRef: string) => {
    const clean = targetRef.trim().toUpperCase()
    if (!clean) {
      setError('Aucune commande à afficher.')
      setCurrentOrder(null)
      return
    }

    setIsLoading(true)
    setError(null)
    setCancelFeedback(null)

    try {
      const data = await fetchOrderTrack(clean)
      updateOrderStatus(data.order_ref, data.status)
      startTransition(() => {
        setCurrentOrder(data)
        setRecentOrders(loadHistory().slice(0, 4))
      })
    } catch (err) {
      setCurrentOrder(null)
      setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.')
    } finally {
      setIsLoading(false)
    }
  }

  // Chargement de la commande active ou sélectionnée
  useEffect(() => {
    const clean = selectedRef.trim().toUpperCase()
    if (!clean) return

    let cancelled = false
    fetchOrderTrack(clean)
      .then((data) => {
        if (cancelled) return
        updateOrderStatus(data.order_ref, data.status)
        startTransition(() => {
          setCurrentOrder(data)
          setError(null)
          setIsLoading(false)
          setRecentOrders(loadHistory().slice(0, 4))
        })
      })
      .catch((err) => {
        if (cancelled) return
        setCurrentOrder(null)
        setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.')
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedRef])

  // Garde la liste des commandes récentes synchronisée avec l'historique local
  useEffect(() => {
    const onOrdersChanged = () => {
      startTransition(() => {
        setRecentOrders(loadHistory().slice(0, 4))
      })
    }
    window.addEventListener(ORDERS_CHANGED_EVENT, onOrdersChanged)
    return () => window.removeEventListener(ORDERS_CHANGED_EVENT, onOrdersChanged)
  }, [])

  // Met à jour une fois les autres pastilles récentes non terminées pour afficher le vrai statut serveur
  useEffect(() => {
    let cancelled = false
    const syncChips = async () => {
      const others = loadHistory()
        .slice(0, 4)
        .filter((o) => o.order_ref.toUpperCase() !== selectedRef && o.status !== 'delivered' && o.status !== 'cancelled')
        .slice(0, 3)
      if (others.length === 0) return

      await Promise.allSettled(
        others.map(async (item) => {
          const track = await fetchOrderTrack(item.order_ref)
          if (!cancelled) updateOrderStatus(track.order_ref, track.status)
        }),
      )
      if (!cancelled) {
        startTransition(() => {
          setRecentOrders(loadHistory().slice(0, 4))
        })
      }
    }
    void syncChips()
    return () => {
      cancelled = true
    }
  }, [selectedRef])

  // Actualisation silencieuse en direct toutes les 20 s tant que la commande est en cours
  const activeRef = currentOrder?.order_ref
  const activeStatus = currentOrder?.status
  useEffect(() => {
    if (!activeRef || !activeStatus || activeStatus === 'delivered' || activeStatus === 'cancelled') return
    let cancelled = false
    const poll = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const data = await fetchOrderTrack(activeRef)
        if (cancelled) return
        updateOrderStatus(data.order_ref, data.status)
        startTransition(() => {
          setCurrentOrder(data)
          setRecentOrders(loadHistory().slice(0, 4))
        })
      } catch {
        /* réseau indisponible : on garde le dernier état affiché */
      }
    }
    const timer = window.setInterval(poll, 20_000)
    document.addEventListener('visibilitychange', poll)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', poll)
    }
  }, [activeRef, activeStatus])

  const handleSelectOrder = (ref: string) => {
    const clean = ref.trim().toUpperCase()
    if (!clean || clean === selectedRef) return
    setError(null)
    setCancelFeedback(null)
    setIsLoading(true)
    setSelectedRef(clean)
  }

  const handleCopyRef = () => {
    if (!currentOrder) return
    navigator.clipboard.writeText(currentOrder.order_ref).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleConfirmCancel = async () => {
    if (!currentOrder) return
    setIsCancelling(true)
    setIsCancelConfirmOpen(false)

    try {
      const result = await cancelClientOrder(currentOrder.order_ref)
      setCancelFeedback(result.message)
      // Met à jour l'état local affiché
      setCurrentOrder((prev) =>
        prev
          ? {
              ...prev,
              status: 'cancelled',
              status_label: 'Annulée',
            }
          : null,
      )
      // Met à jour l'historique local + notifie le dock flottant immédiatement
      updateOrderStatus(currentOrder.order_ref, 'cancelled')
      setRecentOrders(loadHistory().slice(0, 4))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'annuler la commande.")
    } finally {
      setIsCancelling(false)
    }
  }

  const isPickup = currentOrder?.order_type === 'pickup'
  const steps = isPickup ? STEPS_PICKUP : STEPS_DELIVERY
  const activeStepIndex = currentOrder ? getStepIndex(currentOrder.status, isPickup) : 0
  const badge = currentOrder ? getStatusBadge(currentOrder.status) : null
  const isCancelled = currentOrder?.status === 'cancelled'
  const isPending = currentOrder?.status === 'pending'
  const canCancel = isPending
  const showRecentSwitcher =
    recentOrders.length > 1 ||
    (recentOrders.length === 1 &&
      Boolean(selectedRef) &&
      recentOrders[0].order_ref.toUpperCase() !== selectedRef.toUpperCase())

  return (
    <div className="min-h-[85vh] bg-zinc-950 px-3.5 py-4 sm:px-6 sm:py-8 text-zinc-100 selection:bg-bmc-gold selection:text-black">
      <div className="mx-auto w-full max-w-2xl">
        {/* Barre supérieure avec retour explicite */}
        <div className="mb-5 flex items-center justify-between gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label={backLabel}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-zinc-900/90 px-4 text-xs sm:text-sm font-semibold text-zinc-200 transition-colors hover:border-bmc-gold hover:text-bmc-gold focus-visible:outline-2 focus-visible:outline-bmc-gold cursor-pointer"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span>{backLabel}</span>
            </button>
          )}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-bmc-gold ml-auto">
            <Clock className="size-3.5" aria-hidden="true" />
            <span>Suivi en temps réel</span>
          </div>
        </div>

        {/* En-tête de la page */}
        <header className="mb-5 text-center sm:mb-6">
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Suivre ma commande
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Suivez l’avancement de votre commande en direct.
          </p>
        </header>

        {/* Sélecteur rapide des commandes récentes sur cet appareil (sans champ ni bouton Vérifier) */}
        {showRecentSwitcher && (
          <div className="mb-5 rounded-2xl border border-white/10 bg-zinc-900/80 p-3.5 sm:p-4 shadow-xl backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-2.5">
              Vos commandes récentes sur cet appareil :
            </p>
            <div className="flex flex-wrap gap-2">
              {recentOrders.map((order) => {
                const isSelected = selectedRef.toUpperCase() === order.order_ref.toUpperCase()
                return (
                  <button
                    key={order.order_ref}
                    type="button"
                    onClick={() => handleSelectOrder(order.order_ref)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'border-bmc-gold bg-bmc-gold/15 text-bmc-gold font-bold'
                        : 'border-white/10 bg-zinc-950/80 text-zinc-300 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <span>{order.order_ref}</span>
                    <span className="text-[10px] text-zinc-400 font-sans">
                      ({getChipStatusLabel(order.status)})
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* État de chargement initial */}
        {isLoading && !currentOrder && (
          <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-8 text-center shadow-xl">
            <RefreshCw className="mx-auto size-6 animate-spin text-bmc-gold" />
            <p className="mt-3 text-sm font-medium text-zinc-300">
              Chargement de votre commande...
            </p>
          </div>
        )}

        {/* Message d'erreur clair */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              role="alert"
              className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-950/50 p-4 text-xs sm:text-sm text-red-200"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 shrink-0 text-red-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-red-100">{error}</p>
                  <p className="text-[11px] text-red-300/80">
                    Besoin d'aide ? Contactez notre restaurant au{' '}
                    <a href={RESTAURANT_TEL} className="underline font-bold text-white hover:text-bmc-gold">
                      {RESTAURANT_PHONE}
                    </a>
                    .
                  </p>
                </div>
              </div>
              {selectedRef && (
                <button
                  type="button"
                  onClick={() => executeTrack(selectedRef)}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-400/40 bg-red-950/80 px-3 text-xs font-semibold text-red-100 hover:bg-red-900 transition-colors cursor-pointer"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Réessayer</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* État vide : aucune commande enregistrée sur cet appareil */}
        {!isLoading && !currentOrder && !error && (
          <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-6 sm:p-8 text-center shadow-xl">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-bmc-gold">
              <ShoppingBag className="size-6" />
            </div>
            <h2 className="mt-4 font-display text-lg sm:text-xl font-bold text-white">
              Aucune commande en cours sur cet appareil
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Passez commande sur la carte pour suivre sa préparation et sa livraison ici en direct.
            </p>
            {onExploreMenu && (
              <button
                type="button"
                onClick={onExploreMenu}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-bmc-gold px-5 font-display text-sm font-bold text-black transition-all hover:bg-amber-400 active:scale-95 cursor-pointer"
              >
                <span>Découvrir la carte</span>
                <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        )}

        {/* Message de succès après annulation */}
        <AnimatePresence>
          {cancelFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs sm:text-sm text-emerald-200"
            >
              <Check className="size-5 shrink-0 text-emerald-400" />
              <p className="font-semibold">{cancelFeedback}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Résultat du suivi */}
        <AnimatePresence>
          {currentOrder && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="mt-6 space-y-4"
              aria-label="Détail du suivi de commande"
            >
              {/* Carte principale de statut */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
                {/* En-tête de référence & bouton rafraîchir */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-400">
                      Commande
                    </span>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-xl sm:text-2xl font-black text-bmc-gold tracking-wider">
                        {currentOrder.order_ref}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyRef}
                        aria-label="Copier la référence"
                        className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded"
                      >
                        {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => executeTrack(currentOrder.order_ref)}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-bmc-gold hover:text-white transition-all cursor-pointer active:scale-95"
                    >
                      <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>Actualiser</span>
                    </button>
                  </div>
                </div>

                {/* Badge d'état visuel grand format */}
                {badge && (
                  <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`grid size-10 sm:size-11 shrink-0 place-items-center rounded-xl border ${badge.bg}`}>
                        <badge.icon className="size-5 sm:size-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`size-2.5 rounded-full ${badge.dot}`} />
                          <h2 className="font-display text-lg sm:text-xl font-black text-white">
                            {badge.label}
                          </h2>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {currentOrder.order_type === 'pickup' ? 'Retrait au restaurant' : 'Livraison à domicile'}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-zinc-400">Montant total</span>
                      <p className="font-display text-lg sm:text-xl font-bold text-bmc-gold tabular-nums">
                        {formatFcfa(currentOrder.total_amount)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Message explicatif de l'état */}
                <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950/60 p-3.5 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  <p>{getStatusDescription(currentOrder.status, isPickup, currentOrder.cancel_reason)}</p>
                </div>

                {/* Timeline interactive des étapes (si non annulée) */}
                {!isCancelled && (
                  <div className="mt-6 pt-5 border-t border-white/10">
                    <div className="relative">
                      {/* Ligne d'arrière-plan */}
                      <div className="absolute left-4 right-4 top-4 h-0.5 bg-zinc-800 -z-0" />
                      {/* Ligne de progression dorée */}
                      <div
                        className="absolute left-4 top-4 h-0.5 bg-bmc-gold transition-all duration-500 -z-0"
                        style={{
                          width: `${Math.max(0, Math.min(100, (activeStepIndex / (steps.length - 1)) * 100))}%`,
                        }}
                      />

                      <div className="relative z-10 grid grid-cols-4 gap-1 text-center">
                        {steps.map((step, idx) => {
                          const isDone = idx < activeStepIndex
                          const isCurrent = idx === activeStepIndex
                          return (
                            <div key={step.id} className="flex flex-col items-center">
                              <div
                                className={`grid size-8 place-items-center rounded-full border-2 transition-all ${
                                  isDone
                                    ? 'border-bmc-gold bg-bmc-gold text-black'
                                    : isCurrent
                                      ? 'border-bmc-gold bg-zinc-950 text-bmc-gold ring-4 ring-amber-500/20'
                                      : 'border-zinc-700 bg-zinc-900 text-zinc-500'
                                }`}
                              >
                                {isDone ? (
                                  <Check className="size-4 stroke-[3]" />
                                ) : (
                                  <span className="text-xs font-bold">{idx + 1}</span>
                                )}
                              </div>
                              <span
                                className={`mt-2 text-[11px] sm:text-xs font-bold leading-tight ${
                                  isCurrent ? 'text-bmc-gold' : isDone ? 'text-zinc-200' : 'text-zinc-500'
                                }`}
                              >
                                {step.label}
                              </span>
                              <span className="hidden sm:block text-[10px] text-zinc-400 mt-0.5">
                                {step.sublabel}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION ANNULATION OU MESSAGE RESTAURANT (RÈGLE MÉTIER V1) */}
                <div className="mt-6 pt-5 border-t border-white/10">
                  {canCancel ? (
                    /* Bouton « Annuler ma commande » visible UNIQUEMENT en « en attente » */
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                        <div className="text-xs text-zinc-300">
                          <p className="font-semibold text-white">Vous souhaitez modifier ou annuler ?</p>
                          <p className="text-[11px] text-zinc-400">
                            L'annulation directe est possible tant que la cuisine n'a pas commencé la préparation.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsCancelConfirmOpen(true)}
                          disabled={isCancelling}
                          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-950/60 px-4 text-xs font-bold text-red-200 hover:bg-red-900 hover:text-white transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          <Ban className="size-4 text-red-400" />
                          <span>Annuler ma commande</span>
                        </button>
                      </div>
                    </div>
                  ) : !isCancelled && currentOrder.status !== 'delivered' ? (
                    /* Message clair sinon : « Appelez le restaurant » */
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-zinc-950/70 p-3.5">
                      <div className="flex items-start gap-2.5">
                        <Phone className="size-4 text-bmc-gold mt-0.5 shrink-0" />
                        <div className="text-xs text-zinc-300">
                          <p className="font-semibold text-white">Commande en cours de préparation ou livraison</p>
                          <p className="text-[11px] text-zinc-400">
                            Pour toute modification urgente, veuillez appeler directement notre équipe.
                          </p>
                        </div>
                      </div>
                      <a
                        href={RESTAURANT_TEL}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-bmc-gold/40 bg-bmc-gold/15 px-3.5 text-xs font-bold text-bmc-gold hover:bg-bmc-gold hover:text-black transition-all"
                      >
                        <Phone className="size-3.5" />
                        <span>Appeler le restaurant ({RESTAURANT_PHONE})</span>
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Détails du reçu et articles commandés */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-4 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-300 border-b border-white/10 pb-3">
                  Articles commandés ({currentOrder.items_count})
                </h3>

                <ul className="divide-y divide-white/10">
                  {currentOrder.items.map((item, idx) => (
                    <li key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-[11px] font-bold text-bmc-gold">
                          {item.quantity}×
                        </span>
                        <span className="font-medium text-white truncate">{item.item_name}</span>
                      </div>
                      <span className="font-mono text-zinc-300 shrink-0 tabular-nums">
                        {formatFcfa(item.subtotal)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs text-zinc-400">
                  {typeof currentOrder.subtotal === 'number' && (
                    <div className="flex justify-between">
                      <span>Sous-total articles</span>
                      <span className="font-mono text-zinc-300 tabular-nums">{formatFcfa(currentOrder.subtotal)}</span>
                    </div>
                  )}

                  {typeof currentOrder.delivery_fee === 'number' && currentOrder.delivery_fee > 0 && (
                    <div className="flex justify-between">
                      <span>Frais de livraison</span>
                      <span className="font-mono text-zinc-300 tabular-nums">{formatFcfa(currentOrder.delivery_fee)}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-white/10 text-sm sm:text-base font-bold text-white">
                    <span>Total</span>
                    <span className="font-display font-black text-bmc-gold tabular-nums">
                      {formatFcfa(currentOrder.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Statut de paiement */}
                <div className="mt-3 flex items-center justify-between rounded-xl bg-zinc-950 px-3.5 py-2.5 text-xs">
                  <span className="text-zinc-400">Moyen & statut de paiement :</span>
                  <span className="font-semibold text-zinc-200">
                    {currentOrder.payment_status_label || currentOrder.payment_status}
                  </span>
                </div>
              </div>

              {/* Action complémentaire : Explorer le menu */}
              {onExploreMenu && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={onExploreMenu}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-bmc-gold hover:text-amber-300 underline cursor-pointer"
                  >
                    <span>Commander un autre plat sur le menu</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Boîte de dialogue de confirmation d'annulation */}
      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        title="Annuler votre commande ?"
        description={`Êtes-vous certain de vouloir annuler la commande ${currentOrder?.order_ref} ? Cette action est définitive.`}
        confirmLabel={isCancelling ? 'Annulation...' : 'Confirmer l’annulation'}
        cancelLabel="Conserver ma commande"
        destructive
        onConfirm={handleConfirmCancel}
        onCancel={() => setIsCancelConfirmOpen(false)}
      />
    </div>
  )
}
