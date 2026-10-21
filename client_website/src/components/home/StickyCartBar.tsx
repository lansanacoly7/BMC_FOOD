import { ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { formatFcfa } from '../../lib/format'

interface StickyCartBarProps {
  itemCount: number
  totalAmount: number
  onOpenCart: () => void
}

/**
 * Barre de panier flottante (« Pensé pour le pouce »).
 * Conforme à la page 11 de la charte graphique :
 * Apparaît dès le premier ajout : nombre d'articles, total et accès direct au panier.
 */
export function StickyCartBar({ itemCount, totalAmount, onOpenCart }: StickyCartBarProps) {
  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="fixed inset-x-0 bottom-4 z-40 mx-auto max-w-lg px-4"
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenCart}
            className="flex h-15 w-full items-center justify-between rounded-2xl bg-bmc-orange-braise px-5 py-3 text-white shadow-2xl shadow-bmc-orange-braise/45 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold"
          >
            {/* Pastille nombre d'articles */}
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-xl bg-black/25 font-display text-sm font-extrabold text-white">
                {itemCount}
              </span>
              <span className="font-display text-base font-bold tracking-tight sm:text-lg">
                Voir le panier
              </span>
            </div>

            {/* Total et flèche */}
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-extrabold tabular-nums text-white sm:text-xl">
                {formatFcfa(totalAmount)}
              </span>
              <ArrowRight className="size-5" aria-hidden="true" />
            </div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
