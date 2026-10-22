import { Menu, Phone } from 'lucide-react'

interface TopHeaderProps {
  currentPage?: 'home' | 'menu'
  cartItemCount?: number
  hasDailySpecial?: boolean
  onNavigate?: (page: 'home' | 'menu') => void
  onSelectDailySpecial?: () => void
  onSelectOffers?: () => void
  onOpenCart?: () => void
  onToggleMenu?: () => void
  onSelectCategory?: (categoryId: string) => void
}

/**
 * En-tête officiel BMC Food (Desktop, Tablette & Mobile).
 * Logo officiel mis en valeur à GAUCHE avec contraste lumineux pour une visibilité parfaite.
 */
export function TopHeader({
  currentPage = 'home',
  hasDailySpecial = false,
  onNavigate,
  onSelectDailySpecial,
  onSelectOffers,
  onToggleMenu,
}: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-zinc-950/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* GAUCHE : Logo officiel BMC Food posé naturellement dans le header (sans conteneur carré) */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onNavigate?.('home')}
            className="group flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-bmc-gold rounded-lg py-1 cursor-pointer"
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

        {/* CENTRE (Desktop & Tablette) : Liens de navigation Accueil, Plat du Jour, Menu & La Carte, Nos Offres */}
        <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-6">
          {/* 1. Accueil */}
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

          {/* 2. Plat du Jour / Best-Sellers (Dynamique selon le choix du chef) */}
          <button
            type="button"
            onClick={() => {
              if (onSelectDailySpecial) {
                onSelectDailySpecial()
              } else {
                onNavigate?.('home')
                setTimeout(() => {
                  document.getElementById('daily-special-section')?.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }
            }}
            className="text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-bmc-gold transition-colors cursor-pointer py-1"
          >
            {hasDailySpecial ? 'Plat du Jour' : 'Best-Sellers'}
          </button>

          {/* 3. Menu & La Carte */}
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

          {/* 4. Nos Offres */}
          <button
            type="button"
            onClick={() => {
              if (onSelectOffers) {
                onSelectOffers()
              } else {
                onNavigate?.('home')
                setTimeout(() => {
                  document.getElementById('special-offers-grid')?.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }
            }}
            className="text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-bmc-gold transition-colors cursor-pointer py-1"
          >
            Nos Offres
          </button>

          {/* Badge Horaires Dakar */}
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/80 px-3 py-1 text-[11px] font-semibold text-zinc-300">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ouvert · 11h – 02h (Mar–Dim)</span>
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
