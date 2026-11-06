import { ArrowRight, ShoppingBag, X } from 'lucide-react'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import { formatFcfa } from '../../lib/format'
import type { CartItem } from '../../types'
import { getLineId } from '../../context/cart'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { CartItemRow } from './CartItemRow'

/** Glissement vers le bas (en px) ou vitesse (en px/s) au-delà desquels le tiroir se ferme. */
const CLOSE_DRAG_OFFSET = 120
const CLOSE_DRAG_VELOCITY = 500

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQuantity: (code: string, quantity: number) => void
  onRemove: (code: string) => void
  onCheckout: () => void
  onClearCart?: () => void
}

/** Tiroir panier « bottom-sheet » : glisse depuis le bas, se ferme par ✕, Échap, clic sur le fond ou glissement. */
export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  onClearCart,
}: CartDrawerProps) {
  const titleId = useId()
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()
  const [confirmOpen, setConfirmOpen] = useState(false)
  // Lu par les écouteurs clavier : tant que la confirmation est ouverte, Échap la ferme elle, pas le tiroir.
  const confirmOpenRef = useRef(false)
  useEffect(() => {
    confirmOpenRef.current = confirmOpen
  }, [confirmOpen])
  const handleEscape = useEffectEvent(onClose)

  const itemCount = items.reduce((count, item) => count + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  // Pendant l'ouverture : page figée, focus piégé dans le tiroir, Échap pour fermer, focus restitué à la fermeture.
  useEffect(() => {
    if (!isOpen) return

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    sheetRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (confirmOpenRef.current) return
      if (event.key === 'Escape') {
        handleEscape()
        return
      }
      const sheet = sheetRef.current
      if (event.key !== 'Tab' || !sheet) return

      const focusables = sheet.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || active === sheet)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [isOpen])

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cart-backdrop"
          aria-hidden="true"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
        />
      )}

      {isOpen && (
        <motion.div
          key="cart-sheet"
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 1 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > CLOSE_DRAG_OFFSET || info.velocity.y > CLOSE_DRAG_VELOCITY) onClose()
          }}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-3xl border-t border-white/10 bg-zinc-950 text-left text-zinc-100 shadow-2xl outline-none"
        >
          {/* Poignée et en-tête : seule zone qui déclenche le glissement, pour que la liste reste défilable. */}
          <div
            onPointerDown={(event) => dragControls.start(event)}
            className="cursor-grab touch-none select-none px-5 pt-3 active:cursor-grabbing"
          >
            <div className="mx-auto h-1.5 w-12 rounded-full bg-zinc-700" aria-hidden="true" />
            <div className="flex items-center justify-between gap-4 py-3">
              <h2 id={titleId} className="font-display text-xl font-bold text-white">
                Votre panier
                {itemCount > 0 && (
                  <span className="ml-2 font-sans text-sm font-bold text-zinc-400">
                    ({itemCount} article{itemCount > 1 ? 's' : ''})
                  </span>
                )}
              </h2>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={onClose}
                aria-label="Fermer le panier"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-zinc-900 border border-white/10 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white focus-visible:outline-2 focus-visible:outline-bmc-gold cursor-pointer"
              >
                <X className="size-4.5" aria-hidden="true" />
              </motion.button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-4 text-center">
              <div className="mb-2 grid size-16 place-items-center rounded-full bg-bmc-gold/15 text-bmc-gold">
                <ShoppingBag className="size-8" aria-hidden="true" />
              </div>
              <p className="font-bold text-white text-base">Votre panier est vide</p>
              <p className="text-sm text-zinc-400">Ajoutez un tacos ou un burger pour commencer votre commande.</p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="mt-4 rounded-xl bg-bmc-gold px-6 py-3 transition-colors hover:bg-amber-400 font-display font-bold uppercase tracking-wider text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold cursor-pointer"
              >
                Voir le menu
              </motion.button>
            </div>
          ) : (
            <>
              <ul className="min-h-0 flex-1 divide-y divide-white/10 overflow-y-auto overscroll-contain px-5">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <CartItemRow
                      key={getLineId(item)}
                      item={item}
                      onUpdateQuantity={onUpdateQuantity}
                      onRemove={onRemove}
                    />
                  ))}
                </AnimatePresence>
              </ul>

              <div className="border-t border-white/10 bg-zinc-950 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-zinc-400 font-bold text-sm">Sous-total</span>
                  <span
                    aria-live="polite"
                    aria-atomic="true"
                    className="font-display text-2xl font-bold tabular-nums text-bmc-gold"
                  >
                    {formatFcfa(subtotal)}
                  </span>
                </div>
                {/* Ligne des Boutons d'Action : Valider à gauche (Or), Annuler à droite (Rouge) sur la même ligne */}
                <div className="mt-4 flex flex-row items-center gap-2.5 sm:gap-3 w-full">
                  {/* 1. Bouton Valider la commande (Côté gauche, Or brossé BMC) */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onCheckout}
                    aria-label="Valider la commande"
                    className="flex-1 h-12 sm:h-14 inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-2xl bg-bmc-gold font-display text-xs sm:text-base font-bold uppercase tracking-wider text-black hover:brightness-110 cursor-pointer transition-all whitespace-nowrap min-w-0"
                  >
                    <span className="sm:hidden">Valider</span>
                    <span className="hidden sm:inline">Valider la commande</span>
                    <ArrowRight className="size-4 sm:size-5 text-black stroke-[2.5] shrink-0" aria-hidden="true" />
                  </motion.button>

                  {/* 2. Bouton Annuler la commande (Côté droit, Rouge officiel BMC) */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setConfirmOpen(true)}
                    aria-label="Annuler la commande et vider le panier"
                    className="h-12 sm:h-14 px-3.5 sm:px-5 inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-red-500/40 bg-red-700 font-display text-xs sm:text-base font-bold uppercase tracking-wider text-white shadow-lg shadow-red-900/30 hover:brightness-110 cursor-pointer transition-all whitespace-nowrap shrink-0"
                  >
                    <X className="size-4 sm:size-5 text-white stroke-[2.5] shrink-0" aria-hidden="true" />
                    <span>Annuler</span>
                  </motion.button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>

    <ConfirmDialog
      isOpen={confirmOpen}
      title="Annuler votre commande ?"
      description={`Les ${itemCount} article${itemCount > 1 ? 's' : ''} de votre panier seront retirés. Cette action est définitive.`}
      confirmLabel="Oui, annuler"
      cancelLabel="Garder mon panier"
      destructive
      onCancel={() => setConfirmOpen(false)}
      onConfirm={() => {
        setConfirmOpen(false)
        if (onClearCart) {
          onClearCart()
        } else {
          onClose()
        }
      }}
    />
    </>
  )
}
