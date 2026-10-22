import { ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export interface HeaderProps {
  itemCount: number
  onOpenCart: () => void
  onOpenContact?: () => void
  onLogoClick?: () => void
}

export function Header({
  itemCount,
  onOpenCart,
  onOpenContact,
  onLogoClick,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#0C0C0D]/95 text-white backdrop-blur-md transition-all shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo BMC FOOD officiel */}
        <button
          type="button"
          onClick={onLogoClick}
          className="flex items-center gap-3 text-left cursor-pointer group focus-visible:outline-2 focus-visible:outline-bmc-gold rounded-xl p-1"
          aria-label="BMC Food - Accueil"
        >
          <div className="relative flex items-center justify-center rounded-xl bg-black/60 p-1 border border-zinc-800">
            <img
              src="/images/brand/logo.png"
              alt="BMC Food"
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
              width={100}
              height={36}
            />
          </div>

          <div className="flex flex-col">
            <span className="font-display text-sm sm:text-base font-black tracking-tight text-white group-hover:text-bmc-gold transition-colors">
              BMC FOOD
            </span>
            <span className="text-[10px] font-medium text-zinc-400 tracking-wider uppercase -mt-0.5">
              Le goût du vrai plaisir
            </span>
          </div>
        </button>

        {/* Côté droit : Statut restaurant & Panier */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {onOpenContact && (
            <button
              type="button"
              onClick={onOpenContact}
              className="hidden xs:flex items-center gap-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-bmc-gold/40 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
            >
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              <span>Dakar · 11h–02h</span>
            </button>
          )}

          {/* Bouton Panier avec badge */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={onOpenCart}
            aria-label={`Voir mon panier : ${itemCount} articles`}
            className="relative flex items-center gap-2 rounded-full bg-bmc-orange-braise hover:bg-[#B33E04] px-3.5 py-2 text-sm font-extrabold text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold transition-colors cursor-pointer"
          >
            <ShoppingBag className="size-4.5 stroke-[2.5]" aria-hidden="true" />
            <span className="hidden sm:inline">Panier</span>

            <AnimatePresence mode="popLayout">
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="flex size-5 items-center justify-center rounded-full bg-black text-[11px] font-black text-white"
                >
                  {itemCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </header>
  )
}
