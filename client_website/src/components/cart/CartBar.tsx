import { ArrowRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { formatFcfa } from '../../lib/format'

interface CartBarProps {
  /** Affichée seulement quand le panier contient au moins un article et que le tiroir est fermé. */
  isVisible: boolean
  itemCount: number
  subtotal: number
  onOpen: () => void
}

/**
 * Barre panier flottante (charte, page d'accueil n° 6) : nombre d'articles, sous-total et accès au panier,
 * toujours sous le pouce. Fond orange braise, texte blanc (4,5:1).
 */
export function CartBar({ isVisible, itemCount, subtotal, onOpen }: CartBarProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="cart-bar"
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-lg px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={onOpen}
            aria-label={`Voir le panier : ${itemCount} article${itemCount > 1 ? 's' : ''}, ${formatFcfa(subtotal)}`}
            className="flex h-16 w-full items-center justify-between gap-3 rounded-2xl bg-bmc-orange-braise pl-4 pr-2 text-white shadow-xl shadow-bmc-orange-braise/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-charcoal"
          >
            <span className="flex items-center gap-3">
              <motion.span
                key={itemCount}
                initial={{ scale: 1.4 }}
                animate={{ scale: 1 }}
                className="grid size-8 place-items-center rounded-full bg-white/20 font-display font-extrabold tabular-nums"
              >
                {itemCount}
              </motion.span>
              <span className="font-display text-lg font-extrabold tabular-nums">{formatFcfa(subtotal)}</span>
            </span>
            <span className="flex h-12 items-center gap-1.5 rounded-xl bg-white px-4 font-display font-bold text-bmc-orange-braise">
              Voir le panier
              <ArrowRight className="size-4" strokeWidth={2.6} aria-hidden="true" />
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
