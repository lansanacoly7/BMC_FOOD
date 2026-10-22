import { ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { formatFcfa } from '../../lib/format'

interface FloatingCartButtonProps {
  itemCount: number
  totalAmount?: number
  onOpenCart: () => void
  isVisible?: boolean
}

/**
 * Bouton Panier en Bulle Flottante (FAB) — Demandé par Maimouna Sall :
 * - Positionné en bas de page à DROITE (fixed bottom-6 right-5 sm:right-8)
 * - Remplaçant officiel du bouton panier du header
 * - Bulle circulaire dorée ultra lumineuse avec halo d'aura pulsant
 * - Pastille badge compteur d'articles animée
 * - Micro-animation fluide d'entrée et au clic
 */
export function FloatingCartButton({
  itemCount,
  totalAmount,
  onOpenCart,
  isVisible = true,
}: FloatingCartButtonProps) {
  if (!isVisible) return null

  return (
    <aside
      aria-label="Accès rapide au panier"
      className={`fixed right-4 sm:right-7 z-40 transition-all duration-300 ${
        itemCount > 0 ? 'bottom-22 sm:bottom-6' : 'bottom-6'
      }`}
    >
      <motion.button
        type="button"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={onOpenCart}
        aria-label={`Voir le panier (${itemCount} article${itemCount > 1 ? 's' : ''})`}
        className="group relative flex size-14 sm:size-16 items-center justify-center rounded-full bg-gradient-to-br from-bmc-gold via-amber-400 to-amber-500 text-black shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 transition-shadow cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold"
      >
        {/* Halo / Aura d'animation pulsante autour de la bulle */}
        <motion.span
          aria-hidden="true"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-0 rounded-full bg-amber-400/40 -z-10"
        />

        {/* Deuxième anneau décoratif plus large */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-r from-bmc-gold to-amber-500 opacity-30 blur-xs group-hover:opacity-60 transition-opacity"
        />

        {/* Icône du panier */}
        <ShoppingBag className="size-6 sm:size-7 text-black stroke-[2.4] transition-transform duration-200 group-hover:scale-110" />

        {/* Pastille Badge Compteur (Braise / Noir avec contour doré) */}
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.span
              initial={{ scale: 0, y: -6 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 350 }}
              className="absolute -top-1.5 -right-1.5 flex min-w-6 h-6 items-center justify-center rounded-full bg-black px-1.5 font-display text-xs font-black tabular-nums text-bmc-gold border-2 border-amber-400 shadow-md shadow-black/80"
            >
              {itemCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Bulle d'information facultative au survol ou si articles présents */}
        {totalAmount && totalAmount > 0 && (
          <span className="hidden md:group-hover:flex absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-zinc-950/95 border border-white/10 px-3 py-1.5 text-xs font-bold text-white shadow-xl pointer-events-none transition-all">
            <span className="text-bmc-gold mr-1.5 font-black">{formatFcfa(totalAmount)}</span>
            <span>· Voir la commande</span>
          </span>
        )}
      </motion.button>
    </aside>
  )
}
