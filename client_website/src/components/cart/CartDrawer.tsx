import { ArrowRight, ShoppingBag, X } from 'lucide-react'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { useEffect, useEffectEvent, useId, useRef } from 'react'
import { formatFcfa } from '../../lib/format'
import type { CartItem } from '../../types'
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
}

/** Tiroir panier « bottom-sheet » : glisse depuis le bas, se ferme par ✕, Échap, clic sur le fond ou glissement. */
export function CartDrawer({ isOpen, onClose, items, onUpdateQuantity, onRemove, onCheckout }: CartDrawerProps) {
  const titleId = useId()
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cart-backdrop"
          aria-hidden="true"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-bmc-charcoal/60 backdrop-blur-sm"
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
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-3xl bg-white text-left shadow-2xl outline-none"
        >
          {/* Poignée et en-tête : seule zone qui déclenche le glissement, pour que la liste reste défilable. */}
          <div
            onPointerDown={(event) => dragControls.start(event)}
            className="cursor-grab touch-none select-none px-5 pt-3 active:cursor-grabbing"
          >
            <div className="mx-auto h-1.5 w-12 rounded-full bg-zinc-300" aria-hidden="true" />
            <div className="flex items-center justify-between gap-4 py-3">
              <h2 id={titleId} className="font-display text-xl font-bold">
                Votre panier
                {itemCount > 0 && (
                  <span className="ml-2 font-sans text-base font-medium text-zinc-500">
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
                className="grid size-10 shrink-0 place-items-center rounded-full bg-zinc-100 text-bmc-charcoal transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-bmc-orange"
              >
                <X className="size-5" aria-hidden="true" />
              </motion.button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-4 text-center">
              <div className="mb-2 grid size-16 place-items-center rounded-full bg-bmc-gold/15 text-bmc-orange-deep">
                <ShoppingBag className="size-8" aria-hidden="true" />
              </div>
              <p className="font-semibold">Votre panier est vide</p>
              <p className="text-sm text-zinc-500">Ajoutez un tacos ou un burger pour commencer votre commande.</p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="mt-4 rounded-full bg-bmc-charcoal px-6 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-orange"
              >
                Voir le menu
              </motion.button>
            </div>
          ) : (
            <>
              <ul className="min-h-0 flex-1 divide-y divide-zinc-100 overflow-y-auto overscroll-contain px-5">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <CartItemRow
                      key={item.product.code}
                      item={item}
                      onUpdateQuantity={onUpdateQuantity}
                      onRemove={onRemove}
                    />
                  ))}
                </AnimatePresence>
              </ul>

              <div className="border-t border-zinc-100 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-zinc-600">Sous-total</span>
                  <span
                    aria-live="polite"
                    aria-atomic="true"
                    className="font-display text-2xl font-extrabold tabular-nums"
                  >
                    {formatFcfa(subtotal)}
                  </span>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={onCheckout}
                  className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-bmc-orange font-display text-lg font-bold text-bmc-charcoal shadow-lg shadow-bmc-orange/30 transition-colors hover:bg-bmc-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-charcoal"
                >
                  Valider la commande
                  <ArrowRight className="size-5" aria-hidden="true" />
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
