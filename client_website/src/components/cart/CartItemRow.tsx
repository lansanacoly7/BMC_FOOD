import { Minus, Plus, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { MAX_ITEM_QUANTITY } from '../../context/cart'
import { formatFcfa } from '../../lib/format'
import { getProductImageUrl } from '../../lib/productImages'
import type { CartItem } from '../../types'

interface CartItemRowProps {
  item: CartItem
  onUpdateQuantity: (code: string, quantity: number) => void
  onRemove: (code: string) => void
}

const tapBounce = { scale: 0.9 }

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const { product, quantity } = item
  // aria-disabled plutôt que disabled : le bouton garde le focus clavier quand la quantité redescend à 1.
  const canDecrement = quantity > 1
  const canIncrement = quantity < MAX_ITEM_QUANTITY

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -48, transition: { duration: 0.2 } }}
      className="flex gap-3 py-4 text-zinc-100"
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-zinc-900">
        <img
          src={getProductImageUrl(product)}
          alt={product.name}
          width={64}
          height={64}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget
            if (target.src !== '/images/products/tacos-viande-pane.webp') {
              target.src = '/images/products/tacos-viande-pane.webp'
            }
          }}
          className="size-full object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="line-clamp-2 font-display text-sm sm:text-base font-extrabold text-white leading-snug">
              {product.name}
            </p>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium">
              {formatFcfa(product.price)} l'unité
            </p>
          </div>
          <motion.button
            type="button"
            whileTap={tapBounce}
            onClick={() => onRemove(product.code)}
            aria-label={`Retirer ${product.name} du panier`}
            className="-mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-red-950/40 hover:text-red-400 hover:border hover:border-red-500/30 focus-visible:outline-2 focus-visible:outline-red-500 cursor-pointer"
          >
            <Trash2 className="size-4.5" aria-hidden="true" />
          </motion.button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Sélecteur de quantité Dark Luxury à fort contraste */}
          <div
            role="group"
            aria-label={`Quantité de ${product.name}`}
            className="flex items-center rounded-full bg-zinc-900 border border-white/15 p-1 shadow-inner"
          >
            <motion.button
              type="button"
              whileTap={canDecrement ? tapBounce : undefined}
              aria-disabled={!canDecrement}
              onClick={() => {
                if (canDecrement) onUpdateQuantity(product.code, quantity - 1)
              }}
              aria-label={`Diminuer la quantité de ${product.name}`}
              className="grid size-8 sm:size-9 place-items-center rounded-full bg-zinc-800 text-zinc-200 border border-white/10 shadow-sm transition-all hover:bg-zinc-700 hover:text-white focus-visible:outline-2 focus-visible:outline-bmc-gold aria-disabled:cursor-not-allowed aria-disabled:opacity-30 aria-disabled:text-zinc-600 aria-disabled:border-transparent aria-disabled:shadow-none cursor-pointer"
            >
              <Minus className="size-3.5 sm:size-4 stroke-[2.5]" aria-hidden="true" />
            </motion.button>
            <motion.span
              key={quantity}
              initial={{ scale: 1.35 }}
              animate={{ scale: 1 }}
              className="w-8 sm:w-9 text-center font-display font-black text-sm sm:text-base tabular-nums text-white"
            >
              {quantity}
            </motion.span>
            <motion.button
              type="button"
              whileTap={canIncrement ? tapBounce : undefined}
              aria-disabled={!canIncrement}
              onClick={() => {
                if (canIncrement) onUpdateQuantity(product.code, quantity + 1)
              }}
              aria-label={`Augmenter la quantité de ${product.name}`}
              className="grid size-8 sm:size-9 place-items-center rounded-full bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 text-black shadow-md shadow-bmc-gold/20 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold cursor-pointer aria-disabled:cursor-not-allowed aria-disabled:opacity-35"
            >
              <Plus className="size-3.5 sm:size-4 stroke-[3]" aria-hidden="true" />
            </motion.button>
          </div>

          <p className="font-display text-base sm:text-lg font-black tabular-nums text-bmc-gold">
            {formatFcfa(product.price * quantity)}
          </p>
        </div>
      </div>
    </motion.li>
  )
}
