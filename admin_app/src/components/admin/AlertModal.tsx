import { BellRing, CheckCircle2, Clock, MapPin, Phone } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useId } from 'react'
import { formatFcfa, formatTime } from '../../lib/format'
import { PAYMENT_METHOD_LABELS } from '../../lib/labels'
import type { Order } from '../../types'

interface AlertModalProps {
  /** Commandes à prendre en charge ; la fenêtre est ouverte tant que la liste n'est pas vide. */
  orders: Order[]
  onAcknowledge: () => void
}

/** Alerte plein écran des nouvelles commandes : seul le bouton « Prendre en charge » la ferme. */
export function AlertModal({ orders, onAcknowledge }: AlertModalProps) {
  const titleId = useId()
  const count = orders.length
  const total = orders.reduce((sum, order) => sum + order.total_amount, 0)

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          key="order-alert"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ scale: 0.92, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-zinc-900 shadow-2xl ring-2 ring-bmc-gold"
          >
            <header className="flex items-center gap-4 bg-bmc-gold px-6 py-5 text-bmc-charcoal">
              <motion.div
                animate={{ rotate: [0, -18, 16, -12, 8, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 2.1 }}
                className="grid size-14 shrink-0 place-items-center rounded-full bg-bmc-charcoal text-bmc-gold"
              >
                <BellRing className="size-8" aria-hidden="true" />
              </motion.div>
              <div>
                <h2 id={titleId} className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                  {count === 1 ? 'Nouvelle commande !' : `${count} nouvelles commandes !`}
                </h2>
                {count > 1 && <p className="font-semibold">Total : {formatFcfa(total)}</p>}
              </div>
            </header>

            <ul className="min-h-0 flex-1 divide-y divide-white/10 overflow-y-auto overscroll-contain">
              {orders.map((order) => (
                <li key={order.order_ref} className="space-y-3 px-6 py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-display text-3xl font-extrabold tracking-tight text-bmc-gold">{order.order_ref}</p>
                    <p className="font-display text-2xl font-bold tabular-nums">{formatFcfa(order.total_amount)}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-4" aria-hidden="true" />
                      Reçue à {formatTime(order.created_at)}
                    </span>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-medium text-bmc-offwhite">
                      {PAYMENT_METHOD_LABELS[order.payment_method]}
                    </span>
                  </div>

                  <ul className="space-y-1 text-lg">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex gap-2">
                        <span className="font-bold tabular-nums text-bmc-gold">{item.quantity} ×</span>
                        <span>{item.item_name}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-1 text-sm text-zinc-300">
                    <p className="font-semibold text-bmc-offwhite">{order.customer_name}</p>
                    <p className="inline-flex items-center gap-1.5">
                      <Phone className="size-4 shrink-0" aria-hidden="true" />
                      {order.phone}
                    </p>
                    <p className="flex gap-1.5">
                      <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <span>{order.address}</span>
                    </p>
                    {order.notes && <p className="italic text-zinc-400">« {order.notes} »</p>}
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-white/10 p-4">
              <motion.button
                type="button"
                autoFocus
                whileTap={{ scale: 0.97 }}
                onClick={onAcknowledge}
                className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-bmc-orange font-display text-xl font-extrabold text-bmc-charcoal transition-colors hover:bg-bmc-gold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-bmc-offwhite"
              >
                <CheckCircle2 className="size-7" aria-hidden="true" />
                Prendre en charge
              </motion.button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
