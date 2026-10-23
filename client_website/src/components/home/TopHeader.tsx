import { Menu, Phone, ShoppingBag } from 'lucide-react'
import { motion } from 'motion/react'

interface TopHeaderProps {
  cartItemCount: number
  onOpenCart: () => void
  onToggleMenu?: () => void
  onSelectCategory?: (categoryId: string) => void
  currentPage?: 'home' | 'menu'
  onNavigate?: (page: 'home' | 'menu') => void
  onOpenAuth?: () => void
  clientUser?: { name: string; phone: string } | null
}

/**
 * En-tête officiel BMC Food (Desktop, Tablette & Mobile).
 * Logo officiel mis en valeur à GAUCHE avec contraste lumineux pour une visibilité parfaite.
 */
export function TopHeader({
  cartItemCount,
  onOpenCart,
  onToggleMenu,
  currentPage = 'home',
  onNavigate,
  onOpenAuth,
  clientUser,
}: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-zinc-950/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* GAUCHE : Logo officiel BMC Food posé naturellement dans le header */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onNavigate?.('home')}
            className="group flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-bmc-gold rounded-lg py-1 cursor-pointer text-left"
            aria-label="BMC Food — Accueil"
          >
            <img
              src="/images/brand/logo.png"
              alt="BMC Food — Le goût du vrai plaisir"
              width={140}
              height={56}
              className="h-10 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-display text-sm font-black tracking-tight text-white group-hover:text-bmc-gold transition-colors">
                BMC FOOD
              </span>
              <span className="text-[10px] font-bold text-bmc-gold uppercase tracking-wider">
                Le Vrai Goût du Plaisir
              </span>
            </div>
          </button>
        </div>

        {/* CENTRE (Desktop & Tablette) : Liens de navigation Accueil & Menu */}
        <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-6">
          <button
            type="button"
            onClick={() => onNavigate?.('home')}
            className={`text-xs font-black uppercase tracking-wider transition-all cursor-pointer relative py-1 ${
              currentPage === 'home'
                ? 'text-bmc-gold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-bmc-gold'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            Accueil
          </button>

          <button
            type="button"
            onClick={() => onNavigate?.('menu')}
            className={`text-xs font-black uppercase tracking-wider transition-all cursor-pointer relative py-1 ${
              currentPage === 'menu'
                ? 'text-bmc-gold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-bmc-gold'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            Menu & La Carte
          </button>

          {/* Badge Horaires Dakar */}
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/80 px-3 py-1 text-[11px] font-semibold text-zinc-300">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ouvert · 11h – 02h</span>
          </div>
        </nav>

        {/* DROITE : Connexion/Inscription + Téléphone direct + Panier + Menu mobile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bouton Connexion / Inscription avec Logo BMC */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenAuth}
            aria-label={clientUser ? `Espace Client (${clientUser.name})` : "Connexion ou Inscription"}
            className="flex h-10 items-center gap-2 rounded-full border border-bmc-gold/40 bg-zinc-900/90 px-3 sm:px-3.5 text-zinc-100 hover:border-bmc-gold hover:bg-zinc-800 transition-all cursor-pointer shadow-md group"
          >
            <img
              src="/images/brand/logo.png"
              alt="BMC Logo"
              className="h-5 sm:h-5.5 w-auto object-contain transition-transform group-hover:scale-110 shrink-0"
            />
            {clientUser ? (
              <span className="text-xs font-bold text-bmc-gold truncate max-w-[80px] sm:max-w-none">
                {clientUser.name.split(' ')[0]}
              </span>
            ) : (
              <span className="text-xs font-bold tracking-tight">
                <span className="hidden sm:inline">Connexion / Inscription</span>
                <span className="sm:hidden">Connexion</span>
              </span>
            )}
          </motion.button>

          {/* Appel direct (visible dès desktop) */}
          <a
            href="tel:778561313"
            aria-label="Appeler le restaurant au 77 856 13 13"
            className="hidden xl:inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900 px-3.5 py-1.5 text-xs font-bold text-zinc-200 transition-colors hover:border-bmc-gold hover:text-bmc-gold"
          >
            <Phone className="size-3.5 text-emerald-400" />
            <span>77 856 13 13</span>
          </a>

          {/* Bouton Panier avec pastille braise animée */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenCart}
            aria-label={`Voir le panier (${cartItemCount} articles)`}
            className="relative flex h-10 items-center gap-2 rounded-full bg-zinc-900 px-3 sm:px-3.5 text-zinc-200 border border-white/10 hover:border-bmc-gold hover:text-white transition-all cursor-pointer shadow-md"
          >
            <ShoppingBag className="size-4.5 text-bmc-gold" aria-hidden="true" />
            <span className="hidden sm:inline text-xs font-bold">Panier</span>
            {cartItemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex size-5 items-center justify-center rounded-full bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 font-display text-[11px] font-black text-black shadow-md shadow-bmc-gold/40"
              >
                {cartItemCount}
              </motion.span>
            )}
          </motion.button>

          {/* Bouton Menu (Mobile & Tablette) */}
          <button
            type="button"
            onClick={onToggleMenu}
            aria-label="Ouvrir le menu de navigation"
            className="lg:hidden flex size-10 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-bmc-gold"
          >
            <Menu className="size-5.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}
