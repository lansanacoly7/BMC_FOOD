import { ArrowRight, Bike, ChefHat, CircleCheck, Clock3, PackageCheck, type LucideIcon } from 'lucide-react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { ACTIVE_STATUS_LABELS } from '../../hooks/useActiveOrder'
import { formatFcfa } from '../../lib/format'
import type { OrderSummary } from '../../services/clientData'
import type { OrderStatus } from '../../types'

interface FloatingDockProps {
  itemCount: number
  totalAmount: number
  onOpenCart: () => void
  /** Commande en cours (null s'il n'y en a pas). */
  activeOrder: OrderSummary | null
  onTrackOrder: (orderRef: string) => void
  /** Masque tout le dock (tiroir panier ouvert, par exemple). */
  isHidden?: boolean
  /** Masque seulement la commande en cours (sur la page de suivi, elle est déjà affichée). */
  hideOrder?: boolean
}

const STATUS_ICONS: Record<OrderStatus, LucideIcon> = {
  pending: Clock3,
  confirmed: CircleCheck,
  preparing: ChefHat,
  ready: PackageCheck,
  delivering: Bike,
  delivered: CircleCheck,
  cancelled: Clock3,
}

const SPRING = { type: 'spring', damping: 30, stiffness: 320 } as const

/**
 * Dock flottant « pensé pour le pouce » (charte, page 11) : panier et commande en cours, toujours sous le pouce.
 * - Panier vide et commande en cours : la barre « Commande en cours » prend la place du panier ; elle ouvre le suivi.
 * - Panier rempli : la barre du panier revient et la commande en cours se réduit en pastille juste au-dessus.
 * - Nouvelle commande passée : le panier se vide et la barre de commande revient, à jour.
 * La barre et la pastille partagent la même identité d'animation : l'une se transforme en l'autre.
 */
export function FloatingDock({
  itemCount,
  totalAmount,
  onOpenCart,
  activeOrder,
  onTrackOrder,
  isHidden = false,
  hideOrder = false,
}: FloatingDockProps) {
  const reduceMotion = useReducedMotion() ?? false
  const hasCart = itemCount > 0
  const order = hideOrder ? null : activeOrder
  const transition = reduceMotion ? { duration: 0.2 } : SPRING

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-lg px-4">
      <LayoutGroup>
        <AnimatePresence initial={false}>
          {!isHidden && order && (
            <motion.div
              key="commande"
              layout
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24, transition: { duration: 0.2 } }}
              transition={transition}
              className={`pointer-events-auto ${hasCart ? 'mb-2 flex justify-start' : ''}`}
            >
              {hasCart ? (
                <OrderPill order={order} onClick={() => onTrackOrder(order.order_ref)} reduceMotion={reduceMotion} />
              ) : (
                <OrderBar order={order} onClick={() => onTrackOrder(order.order_ref)} reduceMotion={reduceMotion} />
              )}
            </motion.div>
          )}

          {!isHidden && hasCart && (
            <motion.div
              key="panier"
              layout
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80, transition: { duration: 0.22 } }}
              transition={transition}
              className="pointer-events-auto"
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={onOpenCart}
                className="flex h-14 w-full cursor-pointer items-center justify-between rounded-xl bg-bmc-gold px-4 text-black shadow-[0_12px_32px_rgb(0_0_0/0.45)] transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold"
              >
                <span className="flex items-center gap-3">
                  <motion.span
                    key={itemCount}
                    initial={reduceMotion ? false : { scale: 1.35 }}
                    animate={{ scale: 1 }}
                    className="flex size-8 items-center justify-center rounded-xl bg-black font-display text-sm font-bold text-bmc-gold shadow-sm"
                  >
                    {itemCount}
                  </motion.span>
                  <span className="font-display text-base font-bold tracking-tight sm:text-lg">Voir le panier</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold tabular-nums sm:text-xl">{formatFcfa(totalAmount)}</span>
                  <ArrowRight className="size-5 stroke-[2.5]" aria-hidden="true" />
                </span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  )
}

/** Témoin « en direct » : point or qui pulse doucement (fixe si « réduire les animations »). */
function LiveDot({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <span className="relative flex size-2 shrink-0" aria-hidden="true">
      {!reduceMotion && <span className="absolute inset-0 animate-ping rounded-full bg-bmc-gold opacity-70" />}
      <span className="relative size-2 rounded-full bg-bmc-gold" />
    </span>
  )
}

/** Grande barre : la commande en cours, quand le panier est vide. */
function OrderBar({ order, onClick, reduceMotion }: { order: OrderSummary; onClick: () => void; reduceMotion: boolean }) {
  const Icon = STATUS_ICONS[order.status] ?? Clock3
  const label = ACTIVE_STATUS_LABELS[order.status] ?? order.status
  return (
    <motion.button
      type="button"
      layoutId="bmc-commande-en-cours"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-label={`Commande en cours ${order.order_ref} : ${label}. Suivre ma commande`}
      className="group relative flex h-16 w-full cursor-pointer items-center gap-3 overflow-hidden rounded-2xl bg-bmc-charcoal pl-2.5 pr-3 text-left text-white shadow-[0_14px_36px_rgb(0_0_0/0.55)] ring-1 ring-bmc-gold/55 transition-shadow hover:ring-bmc-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold"
    >
      {/* Reflet or discret en fond, côté icône */}
      <span aria-hidden="true" className="pointer-events-none absolute -left-8 -top-10 size-32 rounded-full bg-[radial-gradient(circle,rgb(252_184_0/0.18),transparent_70%)]" />
      <motion.span layout="position" className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-bmc-gold text-black">
        <Icon className="size-5" strokeWidth={2.4} aria-hidden="true" />
      </motion.span>
      <motion.span layout="position" className="relative min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <LiveDot reduceMotion={reduceMotion} />
          <span className="truncate font-display text-[0.95rem] font-bold leading-tight">Commande en cours</span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-zinc-400">
          <span className="font-semibold text-bmc-gold">{label}</span>
          <span className="tabular-nums"> · {order.order_ref}</span>
        </span>
      </motion.span>
      <motion.span layout="position" className="relative flex shrink-0 items-center gap-1.5 rounded-full bg-white/5 py-2 pl-3 pr-2.5 text-sm font-semibold text-bmc-gold ring-1 ring-white/10 transition-colors group-hover:bg-bmc-gold group-hover:text-black">
        Suivre
        <ArrowRight className="size-4 stroke-[2.5]" aria-hidden="true" />
      </motion.span>
    </motion.button>
  )
}

/** Pastille réduite : la commande en cours reste à portée quand le panier reprend la place. */
function OrderPill({ order, onClick, reduceMotion }: { order: OrderSummary; onClick: () => void; reduceMotion: boolean }) {
  const label = ACTIVE_STATUS_LABELS[order.status] ?? order.status
  return (
    <motion.button
      type="button"
      layoutId="bmc-commande-en-cours"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-label={`Commande en cours ${order.order_ref} : ${label}. Suivre ma commande`}
      className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-bmc-charcoal/95 pl-3 pr-2 text-xs text-white shadow-[0_10px_28px_rgb(0_0_0/0.5)] ring-1 ring-bmc-gold/55 backdrop-blur-md transition-shadow hover:ring-bmc-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold"
    >
      <motion.span layout="position" className="flex items-center gap-2">
        <LiveDot reduceMotion={reduceMotion} />
        <span className="font-semibold">Commande en cours</span>
        <span className="text-bmc-gold">· {label}</span>
      </motion.span>
      <motion.span layout="position" className="grid size-6 place-items-center rounded-full bg-bmc-gold text-black">
        <ArrowRight className="size-3.5 stroke-[2.6]" aria-hidden="true" />
      </motion.span>
    </motion.button>
  )
}
