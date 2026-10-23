import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  CookingPot,
  Copy,
  MapPin,
  Phone,
  Printer,
  ShoppingBag,
  Timer,
  Truck,
  User,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { getElapsedInfo } from '../../lib/elapsed'
import { formatFcfa, formatTime } from '../../lib/format'
import { ORDER_STATUS_CONFIG, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '../../lib/labels'
import type { Order, OrderStatus } from '../../types'

interface OrderDetailModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (orderRef: string, status: OrderStatus) => Promise<void>
  isUpdating?: boolean
}

/** Status pipeline stages for the visual timeline */
const STATUS_PIPELINE: { status: OrderStatus; label: string; icon: typeof Clock }[] = [
  { status: 'pending', label: 'Reçue', icon: Clock },
  { status: 'preparing', label: 'En cuisine', icon: CookingPot },
  { status: 'delivering', label: 'Livraison', icon: Truck },
  { status: 'delivered', label: 'Livrée', icon: CheckCircle2 },
]

function getStageIndex(status: OrderStatus): number {
  if (status === 'cancelled') return -1
  if (status === 'confirmed') return 0 // Same visual position as pending
  return STATUS_PIPELINE.findIndex((s) => s.status === status)
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  isUpdating = false,
}: OrderDetailModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !order) return null

  const statusConfig = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending
  const elapsed = getElapsedInfo(order.created_at)
  const isActive = order.status === 'pending' || order.status === 'preparing'
  const currentStageIndex = getStageIndex(order.status)
  const isCancelled = order.status === 'cancelled'

  const copyAddress = () => {
    void navigator.clipboard.writeText(order.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0"
        />

        {/* Boîte Modale */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-detail-title"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-3xl border border-white/15 bg-zinc-950 text-white shadow-2xl overflow-hidden"
        >
          {/* 1. Header avec Ref, Statut et Actions */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-gradient-to-r from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-bmc-gold/20 to-bmc-gold/5 text-bmc-gold border border-bmc-gold/30 shadow-lg shadow-bmc-gold/10">
                <ShoppingBag className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="order-detail-title" className="font-display text-lg sm:text-xl font-black text-white">
                    {order.order_ref}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${statusConfig.bgLight} ${statusConfig.color} ${statusConfig.border}`}
                  >
                    <span className={`size-1.5 rounded-full ${statusConfig.dotColor}`} />
                    {statusConfig.shortLabel}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    <span>Reçue à {formatTime(order.created_at)}</span>
                    <span>·</span>
                    <span>{new Date(order.created_at).toLocaleDateString('fr-FR')}</span>
                  </p>
                  {isActive && (
                    <span className={`text-xs font-bold flex items-center gap-1 timer-${elapsed.urgency}`}>
                      <Timer className="size-3" />
                      {elapsed.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                title="Imprimer le ticket cuisine"
                className="grid size-9 place-items-center rounded-full bg-zinc-900 border border-white/10 text-zinc-300 hover:border-bmc-gold hover:text-bmc-gold transition-colors cursor-pointer"
              >
                <Printer className="size-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="grid size-9 place-items-center rounded-full bg-zinc-900 border border-white/10 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* 2. Corps défilable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
            {/* A. Timeline de Progression Visuelle */}
            <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
                Progression de la commande
              </h3>

              {isCancelled ? (
                <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/25 p-4">
                  <span className="grid size-10 place-items-center rounded-full bg-red-500/20 text-red-400">
                    <X className="size-5" />
                  </span>
                  <div>
                    <p className="font-display font-bold text-red-300">Commande Annulée</p>
                    <p className="text-xs text-red-400/70">Cette commande a été refusée ou annulée.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-1">
                  {STATUS_PIPELINE.map((stage, idx) => {
                    const isCompleted = idx <= currentStageIndex
                    const isCurrent = idx === currentStageIndex
                    const StageIcon = stage.icon

                    return (
                      <div key={stage.status} className="flex items-center flex-1 last:flex-initial">
                        {/* Stage node */}
                        <div className="flex flex-col items-center gap-1.5">
                          <motion.div
                            initial={false}
                            animate={{
                              scale: isCurrent ? 1.1 : 1,
                              boxShadow: isCurrent ? '0 0 16px 4px rgba(252, 184, 0, 0.25)' : '0 0 0 0 transparent',
                            }}
                            className={`grid size-10 place-items-center rounded-full border-2 transition-colors ${
                              isCompleted
                                ? isCurrent
                                  ? 'bg-bmc-gold/20 border-bmc-gold text-bmc-gold'
                                  : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                            }`}
                          >
                            <StageIcon className="size-4.5" />
                          </motion.div>
                          <span
                            className={`text-[10px] font-bold ${
                              isCompleted ? (isCurrent ? 'text-bmc-gold' : 'text-emerald-400') : 'text-zinc-500'
                            }`}
                          >
                            {stage.label}
                          </span>
                        </div>

                        {/* Connecting line (not after last) */}
                        {idx < STATUS_PIPELINE.length - 1 && (
                          <div className="flex-1 mx-2 mb-5">
                            <div className="h-0.5 rounded-full relative overflow-hidden bg-zinc-800">
                              <motion.div
                                initial={false}
                                animate={{ width: idx < currentStageIndex ? '100%' : '0%' }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-bmc-gold rounded-full"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* B. Coordonnées Client & Livraison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-zinc-900/60 p-4 border border-white/10">
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <User className="size-3.5 text-bmc-gold" />
                  <span>Client</span>
                </p>
                <p className="font-display font-extrabold text-base text-white">{order.customer_name}</p>
                <a
                  href={`tel:${order.phone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-bmc-gold hover:underline"
                >
                  <Phone className="size-3.5" />
                  <span>{order.phone}</span>
                </a>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <MapPin className="size-3.5 text-bmc-gold" />
                    <span>Adresse de livraison</span>
                  </p>
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="text-[11px] text-zinc-400 hover:text-bmc-gold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="size-3" />
                    <span>{copied ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">{order.address}</p>
              </div>
            </div>

            {/* C. Instructions spéciales si présentes */}
            {order.notes && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-amber-200">
                <p className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider text-amber-400 mb-1">
                  <AlertTriangle className="size-3.5" />
                  <span>Instructions du client</span>
                </p>
                <p className="text-xs sm:text-sm italic font-medium leading-relaxed">
                  « {order.notes} »
                </p>
              </div>
            )}

            {/* D. Articles commandés */}
            <div className="space-y-2.5">
              <h3 className="font-display text-xs font-black uppercase tracking-wider text-zinc-400">
                Détail de la commande ({order.items.length} produit{order.items.length > 1 ? 's' : ''})
              </h3>
              <div className="rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/10 bg-zinc-900/40">
                {order.items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-3.5 gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 font-display text-xs font-black text-bmc-gold border border-white/10">
                        {item.quantity}×
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-sm font-bold text-white truncate">{item.item_name}</p>
                        <p className="text-xs text-zinc-400">
                          {formatFcfa(item.unit_price)} l&apos;unité · Réf : {item.menu_item_code}
                        </p>
                      </div>
                    </div>
                    <span className="font-display text-sm font-black text-white tabular-nums shrink-0">
                      {formatFcfa(item.subtotal)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* E. Paiement & Récapitulatif financier */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 p-5 border border-bmc-gold/15 shadow-inner">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Mode de règlement</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">
                    {PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      order.payment_status === 'paid'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total à encaisser</span>
                <p className="font-display text-2xl sm:text-3xl font-black text-bmc-gold tabular-nums">
                  {formatFcfa(order.total_amount)}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Footer d'action rapide pour la Cuisine */}
          <div className="border-t border-white/10 bg-zinc-900/90 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            >
              Fermer
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {order.status === 'pending' && (
                <>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => void onUpdateStatus(order.order_ref, 'cancelled')}
                    className="rounded-xl border border-red-500/40 bg-red-950/30 px-3.5 py-2.5 text-xs font-bold text-red-400 hover:bg-red-950/60 transition-colors cursor-pointer"
                  >
                    Refuser
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => void onUpdateStatus(order.order_ref, 'preparing')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 px-5 py-2.5 font-display text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-bmc-gold/20 hover:brightness-110 active:scale-97 transition-all cursor-pointer"
                  >
                    <CookingPot className="size-4" />
                    <span>Lancer en Cuisine</span>
                    <ArrowRight className="size-4" />
                  </button>
                </>
              )}

              {order.status === 'preparing' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => void onUpdateStatus(order.order_ref, 'delivering')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1DC8F2] to-sky-600 px-5 py-2.5 font-display text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-sky-900/30 hover:brightness-110 active:scale-97 transition-all cursor-pointer"
                >
                  <Truck className="size-4" />
                  <span>Prêt · Confier au Livreur</span>
                  <ArrowRight className="size-4" />
                </button>
              )}

              {order.status === 'delivering' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => void onUpdateStatus(order.order_ref, 'delivered')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-2.5 font-display text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-green-900/30 hover:brightness-110 active:scale-97 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="size-4" />
                  <span>Confirmer la Livraison</span>
                </button>
              )}

              {order.status === 'delivered' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl">
                  <CheckCircle2 className="size-4" />
                  <span>Commande terminée et livrée</span>
                </span>
              )}

              {order.status === 'cancelled' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3.5 py-2 rounded-xl">
                  <X className="size-4" />
                  <span>Commande annulée</span>
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
