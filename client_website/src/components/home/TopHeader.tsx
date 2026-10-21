import { Menu, ShoppingBag } from 'lucide-react'
import { motion } from 'motion/react'

interface TopHeaderProps {
  cartItemCount: number
  onOpenCart: () => void
  onToggleMenu?: () => void
}

/**
 * En-tête noir officiel BMC Food (Page 11 de la charte graphique, Point 1).
 * Logo centré, menu hamburger à gauche, panier à droite avec pastille braise.
 */
export function TopHeader({ cartItemCount, onOpenCart, onToggleMenu }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/5 bg-bmc-black/95 px-4 backdrop-blur-md sm:px-6">
      {/* Menu hamburger à gauche */}
      <button
        type="button"
        onClick={onToggleMenu}
        aria-label="Ouvrir le menu de navigation"
        className="flex size-10 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-bmc-gold"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>

      {/* Logo officiel BMC Food centré */}
      <div className="flex items-center justify-center">
        <a href="/" className="group flex items-center justify-center focus-visible:outline-2 focus-visible:outline-bmc-gold">
          <img
            src="/images/brand/logo.png"
            alt="BMC Food — Le goût du vrai plaisir"
            width={130}
            height={52}
            className="h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105 sm:h-12"
          />
        </a>
      </div>

      {/* Bouton Panier à droite avec pastille braise */}
      <button
        type="button"
        onClick={onOpenCart}
        aria-label={`Voir le panier (${cartItemCount} articles)`}
        className="relative flex size-10 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-bmc-gold"
      >
        <ShoppingBag className="size-6" aria-hidden="true" />
        {cartItemCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-bmc-orange-braise font-display text-[11px] font-extrabold text-white shadow-md shadow-bmc-orange-braise/40"
          >
            {cartItemCount}
          </motion.span>
        )}
      </button>
    </header>
  )
}
