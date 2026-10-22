import { Clock, MapPin, Phone, PhoneCall, X, Home, Sparkles, UtensilsCrossed, Tag } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface NavMenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  currentPage?: 'home' | 'menu'
  hasDailySpecial?: boolean
  onNavigate?: (page: 'home' | 'menu') => void
  onSelectDailySpecial?: () => void
  onSelectOffers?: () => void
  onSelectCategory?: (categoryId: string) => void
}

/**
 * Tiroir latéral d'informations et navigation BMC Food Dakar (Mobile & Tablette).
 * - Icônes Lucide officielles (zéro emoji)
 * - Navigation complète et sans répétitions (Accueil, Plat du Jour ou Best-Sellers, Menu, Nos Offres)
 * - Contacts et horaires officiels
 */
export function NavMenuDrawer({
  isOpen,
  onClose,
  currentPage = 'home',
  hasDailySpecial = false,
  onNavigate,
  onSelectDailySpecial,
  onSelectOffers,
}: NavMenuDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Arrière-plan assombri avec flou */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Panneau coulissant depuis la DROITE */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative z-10 flex h-full w-[85%] max-w-xs flex-col justify-between bg-zinc-950 p-5 text-white shadow-2xl border-l border-white/10 overflow-y-auto"
            aria-label="Menu principal"
          >
            <div className="space-y-6">
              {/* En-tête du tiroir avec logo BMC Food et bouton fermer */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <img
                    src="/images/brand/logo.png"
                    alt="BMC Food"
                    width={110}
                    height={44}
                    className="h-10 w-auto object-contain"
                  />
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Ouvert</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer le menu"
                  className="flex size-9 items-center justify-center rounded-full bg-white/10 text-zinc-300 hover:bg-white/20 hover:text-white cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Navigation Principale Mobile avec vraies icônes vectorielles */}
              <div className="space-y-2 pb-4 border-b border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Navigation
                </p>

                {/* 1. Accueil */}
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.('home')
                    onClose()
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-left text-sm font-black transition-colors cursor-pointer ${
                    currentPage === 'home'
                      ? 'bg-amber-500/20 text-bmc-gold border border-amber-500/40'
                      : 'text-zinc-200 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Home className="size-4.5 text-bmc-gold" />
                    <span>Accueil</span>
                  </div>
                  {currentPage === 'home' && <span className="size-2 rounded-full bg-bmc-gold" />}
                </button>

                {/* 2. Plat du Jour / Best-Sellers (Dynamique selon le chef) */}
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
                    onClose()
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-left text-sm font-black text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="size-4.5 text-bmc-gold" />
                    <span>{hasDailySpecial ? 'Plat du Jour' : 'Best-Sellers'}</span>
                  </div>
                  <span className="text-xs text-bmc-gold">Voir</span>
                </button>

                {/* 3. Menu & La Carte */}
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.('menu')
                    onClose()
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-left text-sm font-black transition-colors cursor-pointer ${
                    currentPage === 'menu'
                      ? 'bg-amber-500/20 text-bmc-gold border border-amber-500/40'
                      : 'text-zinc-200 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UtensilsCrossed className="size-4.5 text-bmc-gold" />
                    <span>Menu & La Carte</span>
                  </div>
                  {currentPage === 'menu' && <span className="size-2 rounded-full bg-bmc-gold" />}
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
                    onClose()
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Tag className="size-4 text-bmc-gold" />
                    <span>Nos Offres</span>
                  </div>
                  <span>→</span>
                </button>
              </div>

              {/* Infos pratiques restaurant & contact direct (sans emojis) */}
              <div className="space-y-3.5 rounded-2xl border border-white/10 bg-zinc-900/80 p-4 text-xs text-zinc-300">
                <div className="flex items-start gap-3">
                  <Clock className="size-4 shrink-0 text-bmc-gold mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Horaires d'ouverture</p>
                    <p className="text-zinc-400">11h00 – 02h00 (Mar–Dim, fermé lundi)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="size-4 shrink-0 text-bmc-gold mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Livraison express</p>
                    <p className="text-zinc-400">Cité Mixta & partout à Dakar</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Commandes directes</p>
                    <div className="flex flex-col gap-1 text-zinc-300 mt-1">
                      <a href="tel:778561313" className="inline-flex items-center gap-1.5 hover:text-bmc-gold font-medium">
                        <PhoneCall className="size-3 text-emerald-400" />
                        <span>77 856 13 13</span>
                      </a>
                      <a href="tel:771067575" className="inline-flex items-center gap-1.5 hover:text-bmc-gold font-medium">
                        <PhoneCall className="size-3 text-emerald-400" />
                        <span>77 106 75 75</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bas du panneau : Vraies Icônes de Paiement (Wave, Orange Money, Espèces) */}
            <div className="border-t border-white/10 pt-4 space-y-2.5 text-center mt-4">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Paiements acceptés à la livraison
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1 rounded-xl bg-zinc-900/90 border border-white/10 p-2">
                  <img
                    src="/images/payments/cash.png"
                    alt="Espèces"
                    className="size-7 rounded-lg object-contain shadow-sm"
                  />
                  <span className="text-[10px] font-bold text-zinc-200">Espèces</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-xl bg-zinc-900/90 border border-white/10 p-2">
                  <img
                    src="/images/payments/wave.png"
                    alt="Wave"
                    className="size-7 rounded-lg object-contain shadow-sm"
                  />
                  <span className="text-[10px] font-bold text-[#1DC8F2]">Wave</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-xl bg-zinc-900/90 border border-white/10 p-2">
                  <img
                    src="/images/payments/orange_money.png"
                    alt="Orange Money"
                    className="size-7 rounded-lg object-contain shadow-sm"
                  />
                  <span className="text-[10px] font-bold text-[#FF7900]">Orange Money</span>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
