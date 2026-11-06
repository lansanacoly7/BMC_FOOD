import { Clock, MapPin, Phone, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { CATEGORIES } from '../../data/categories'

interface NavMenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSelectCategory: (categoryId: string) => void
  onNavigate?: (page: 'home' | 'menu' | 'contact') => void
  onOpenAuth?: () => void
  clientUser?: { name: string; phone: string } | null
}

/**
 * Tiroir latéral d'informations et navigation BMC Food Dakar.
 * Déclenché par le bouton menu hamburger de l'en-tête (TopHeader).
 */
export function NavMenuDrawer({ isOpen, onClose, onSelectCategory, onNavigate, onOpenAuth, clientUser }: NavMenuDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Arrière-plan assombri */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70"
            aria-hidden="true"
          />

          {/* Panneau coulissant depuis la droite */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative z-10 flex h-full w-[85%] max-w-xs flex-col justify-between overflow-y-auto border-l border-white/10 bg-zinc-950 p-5 text-white"
            aria-label="Menu principal"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <img
                  src="/images/brand/logo.png"
                  alt="BMC Food"
                  width={110}
                  height={44}
                  className="h-10 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer le menu"
                  className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['home', 'Accueil'],
                    ['menu', 'La carte'],
                    ['contact', 'Contact'],
                  ] as const
                ).map(([page, label]) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => {
                      onNavigate?.(page)
                      onClose()
                    }}
                    className="cursor-pointer rounded-lg border border-white/15 px-2 py-2.5 text-center text-sm font-medium text-zinc-200 transition-colors hover:border-bmc-gold hover:text-bmc-gold"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenAuth?.()
                }}
                className="w-full cursor-pointer rounded-lg border border-white/15 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:border-white/30"
              >
                {clientUser ? `Mon compte (${clientUser.name.split(' ')[0]})` : 'Connexion / Inscription'}
              </button>

              <div className="space-y-2">
                <p className="text-sm text-zinc-400">La carte</p>
                <div className="grid grid-cols-1 gap-0.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        onSelectCategory(cat.id)
                        onClose()
                      }}
                      className="cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10 hover:text-bmc-gold"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t border-white/10 pt-5 text-sm text-zinc-300">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-bmc-gold" />
                  <div>
                    <p className="font-medium text-white">Horaires</p>
                    <p className="text-zinc-400">Mardi – dimanche, 11h – 02h</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-bmc-gold" />
                  <div>
                    <p className="font-medium text-white">Livraison</p>
                    <p className="text-zinc-400">Dakar, selon les zones</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-bmc-gold" />
                  <div>
                    <p className="font-medium text-white">Téléphone</p>
                    <div className="mt-0.5 flex flex-col text-zinc-300">
                      <a href="tel:778561313" className="hover:text-bmc-gold">77 856 13 13</a>
                      <a href="tel:771067575" className="hover:text-bmc-gold">77 106 75 75</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
              <p className="text-sm text-zinc-400">Paiement</p>
              <div className="flex items-center gap-4 text-sm text-zinc-200">
                <span>Espèces</span>
                <span>Wave</span>
                <span>Orange Money</span>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}