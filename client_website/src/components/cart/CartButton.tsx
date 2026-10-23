import { ShoppingBag } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCart } from '../../hooks/useCart'

interface CartButtonProps {
  /** `dark` : en-tête noir de l'accueil ; `light` : en-tête clair. */
  tone?: 'dark' | 'light'
}

/** Bouton panier de l'en-tête (charte, page d'accueil n° 1) : ouvre le tiroir, pastille braise avec le nombre d'articles. */
export function CartButton({ tone = 'dark' }: CartButtonProps) {
  const { itemCount, openCart } = useCart()
  const label = itemCount > 0 ? `Ouvrir le panier, ${itemCount} article${itemCount > 1 ? 's' : ''}` : 'Ouvrir le panier'

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={openCart}
      aria-label={label}
      className={`relative grid size-11 place-items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
        tone === 'dark'
          ? 'bg-white/10 text-white hover:bg-white/15 focus-visible:outline-bmc-gold'
          : 'bg-zinc-100 text-bmc-charcoal hover:bg-zinc-200 focus-visible:outline-bmc-orange-deep'
      }`}
    >
      <ShoppingBag className="size-5" aria-hidden="true" />
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.span
            key={itemCount}
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            aria-hidden="true"
            className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-bmc-orange-braise px-1 text-[11px] font-extrabold tabular-nums text-white"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
