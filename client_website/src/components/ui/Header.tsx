import { ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export interface HeaderProps {
  itemCount: number
  onOpenCart: () => void
  onLogoClick?: () => void
}

export function Header({ itemCount, onOpenCart, onLogoClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo BMC FOOD officiel */}
        <button
          type="button"
          onClick={onLogoClick}
          className="flex items-center gap-3 text-left cursor-pointer group focus-visible:outline-2 focus-visible:outline-bmc-orange-braise rounded-lg"
          aria-label="BMC Food - Retour à l'accueil"
        >
          <img
            src="/images/brand/logo.png"
            alt="BMC Food"
            className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            width={120}
            height={40}
          />
          <div className="hidden sm:flex flex-col">
            <span className="font-display text-sm font-extrabold tracking-tight text-zinc-950">
              BMC FOOD
            </span>
            <span className="text-[11px] font-medium text-zinc-500">
              Le goût du vrai plaisir
            </span>
          </div>
        </button>

        {/* Statut restaurant Dakar & Bouton panier */}
        <div className="flex items-center gap-3">
          <div className="hidden xs:flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span>Ouvert · Dakar 11h – 02h</span>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={onOpenCart}
            aria-label={`Voir mon panier contenant ${itemCount} ${itemCount > 1 ? 'articles' : 'article'}`}
            className="relative flex items-center gap-2 rounded-full bg-bmc-charcoal px-3.5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-orange-braise transition-colors cursor-pointer"
          >
            <ShoppingBag className="size-4.5" aria-hidden="true" />
            <span className="hidden sm:inline">Panier</span>

            <AnimatePresence mode="popLayout">
              <motion.span
                key={itemCount}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="flex size-5 items-center justify-center rounded-full bg-bmc-orange-braise text-[11px] font-bold text-white"
              >
                {itemCount}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </header>
  )
}
