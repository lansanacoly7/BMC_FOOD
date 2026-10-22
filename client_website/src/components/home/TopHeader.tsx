import { Menu, Phone } from 'lucide-react'

interface TopHeaderProps {
  cartItemCount?: number
  onOpenCart?: () => void
  onToggleMenu?: () => void
  onSelectCategory?: (categoryId: string) => void
}

/**
 * En-tête officiel BMC Food (Desktop, Tablette & Mobile).
 * Logo officiel mis en valeur à GAUCHE avec contraste lumineux pour une visibilité parfaite.
 */
export function TopHeader({ onToggleMenu, onSelectCategory }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-zinc-950/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* GAUCHE : Logo officiel BMC Food posé naturellement dans le header (sans conteneur carré) */}
        <div className="flex items-center">
          <a
            href="/"
            className="group flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-bmc-gold rounded-lg py-1"
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
          </a>
        </div>

        {/* CENTRE (Desktop & Tablette) : Liens rapides */}
        <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-6">
          <button
            type="button"
            onClick={() => onSelectCategory?.('tacos-panes')}
            className="text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-bmc-gold transition-colors cursor-pointer"
          >
            Tacos Panés
          </button>
          <button
            type="button"
            onClick={() => onSelectCategory?.('burgers')}
            className="text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-bmc-gold transition-colors cursor-pointer"
          >
            Burgers
          </button>
          <button
            type="button"
            onClick={() => onSelectCategory?.('boissons')}
            className="text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-bmc-gold transition-colors cursor-pointer"
          >
            Boissons
          </button>
          <button
            type="button"
            onClick={() => onSelectCategory?.('all')}
            className="text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-bmc-gold transition-colors cursor-pointer"
          >
            Toute la Carte
          </button>

          {/* Badge Horaires Dakar */}
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/80 px-3 py-1 text-[11px] font-semibold text-zinc-300">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ouvert · 11h – 02h</span>
          </div>
        </nav>

        {/* DROITE : Téléphone direct + Panier + Menu mobile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Appel direct (visible dès tablette) */}
          <a
            href="tel:778561313"
            aria-label="Appeler le restaurant au 77 856 13 13"
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900 px-3.5 py-1.5 text-xs font-bold text-zinc-200 transition-colors hover:border-bmc-gold hover:text-bmc-gold"
          >
            <Phone className="size-3.5 text-emerald-400" />
            <span>77 856 13 13</span>
          </a>



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
