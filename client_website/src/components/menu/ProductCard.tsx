import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Check, Plus, Star } from 'lucide-react'
import type { Product } from '../../types'
import { formatFcfa } from '../../lib/format'
import { Badge } from '../ui/Badge'

export interface ProductCardProps {
  product: Product
  onAdd: (product: Product) => void
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false)

  const handleAdd = () => {
    if (!product.is_available) return
    onAdd(product)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 900)
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-3.5 shadow-sm border transition-all hover:shadow-md
        ${product.is_daily_special ? 'border-bmc-gold/60 ring-1 ring-bmc-gold/40' : 'border-zinc-200/80 hover:border-zinc-300'}`}
    >
      {/* Conteneur Image avec ratio 4:3 et badges */}
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-zinc-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400 text-xs">
            Photo bientôt disponible
          </div>
        )}

        {/* Badges superposés */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {product.is_daily_special && (
            <Badge variant="gold" size="sm" icon={<Star className="size-3 fill-current" />}>
              Plat du Jour
            </Badge>
          )}
          {product.popular && !product.is_daily_special && (
            <Badge variant="gold" size="sm">
              Populaire
            </Badge>
          )}
        </div>

        {/* Masque si indisponible */}
        {!product.is_available && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-xs">
            <span className="rounded-full bg-zinc-900/90 px-3 py-1 text-xs font-semibold text-white">
              Épuisé
            </span>
          </div>
        )}
      </div>

      {/* Détails du plat */}
      <div className="flex flex-1 flex-col justify-between pt-3 text-left">
        <div>
          <h3 className="font-display text-base font-bold text-zinc-900 line-clamp-1">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Ligne Prix + Bouton Ajout */}
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-zinc-100 pt-2.5">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Prix
            </span>
            <span className="font-display text-base font-extrabold text-zinc-950">
              {formatFcfa(product.price)}
            </span>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={handleAdd}
            disabled={!product.is_available}
            aria-label={`Ajouter ${product.name} au panier`}
            className={`flex size-10 items-center justify-center rounded-xl font-bold shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold
              ${
                justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 text-black hover:brightness-110 shadow-md shadow-bmc-gold/20'
              }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {justAdded ? (
                <motion.span
                  key="checked"
                  initial={{ scale: 0.5, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0.5 }}
                >
                  <Check className="size-5" aria-hidden="true" />
                </motion.span>
              ) : (
                <motion.span
                  key="plus"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.5 }}
                >
                  <Plus className="size-5" aria-hidden="true" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.article>
  )
}
