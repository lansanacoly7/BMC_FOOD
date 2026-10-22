import { Clock, MapPin, Phone, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { CATEGORIES } from './CategoryPills'

interface NavMenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSelectCategory: (categoryId: string) => void
}

/**
 * Tiroir latéral d'informations et navigation BMC Food Dakar.
 * Déclenché par le bouton menu hamburger de l'en-tête (TopHeader).
 */
export function NavMenuDrawer({ isOpen, onClose, onSelectCategory }: NavMenuDrawerProps) {
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

          {/* Panneau coulissant depuis la DROITE (origine naturelle du bouton hamburger) */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative z-10 flex h-full w-[85%] max-w-xs flex-col justify-between bg-zinc-950 p-5 text-white shadow-2xl border-l border-white/10 overflow-y-auto"
            aria-label="Menu principal"
          >
            <div className="space-y-5">
              {/* En-tête du tiroir avec logo BMC Food et bouton fermer */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
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

              {/* Raccourcis Catégories — Style App Mobile */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  La Carte BMC Food
                </p>
                <div className="grid grid-cols-1 gap-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        onSelectCategory(cat.id)
                        onClose()
                      }}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/10 hover:text-bmc-gold cursor-pointer"
                    >
                      <span>{cat.name}</span>
                      <span className="text-xs text-zinc-500">→</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Infos pratiques restaurant & contact direct */}
              <div className="space-y-3 rounded-2xl border border-white/10 bg-zinc-900/80 p-3.5 text-xs text-zinc-300">
                <div className="flex items-start gap-2.5">
                  <Clock className="size-4 shrink-0 text-bmc-gold mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Horaires d'ouverture</p>
                    <p className="text-zinc-400">11h00 – 02h00 (7j/7 non-stop)</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="size-4 shrink-0 text-bmc-gold mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Livraison express</p>
                    <p className="text-zinc-400">Partout à Dakar & banlieue</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Commandes directes</p>
                    <div className="flex flex-col gap-0.5 text-zinc-300 mt-0.5">
                      <a href="tel:778561313" className="hover:text-bmc-gold font-medium">
                        📞 77 856 13 13
                      </a>
                      <a href="tel:771067575" className="hover:text-bmc-gold font-medium">
                        📞 77 106 75 75
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
