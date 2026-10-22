import { useState, type MouseEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Check, Heart, Plus } from 'lucide-react'
import type { Product } from '../../types'
import { formatFcfa } from '../../lib/format'

export interface ProductCardProps {
  product: Product
  onAdd: (product: Product) => void
  onSelect?: (product: Product) => void
}

export function ProductCard({ product, onAdd, onSelect }: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)

  const handleAddClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (!product.is_available) return
    onAdd(product)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 900)
  }

  const handleFavoriteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }


  return (
    <article
      onClick={() => onSelect?.(product)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#121214] shadow-md border border-zinc-800/80 transition-all hover:border-zinc-700 hover:shadow-2xl cursor-pointer select-none"
    >
      {/* 1. Conteneur Image avec ratio 4:3 et badges supérieurs (Calqué sur la Maquette) */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-zinc-950 flex items-center justify-center">
        {product.image_url && !imgFailed ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-zinc-900">
            <span className="text-2xl opacity-40">
              {product.category_name?.toLowerCase().includes('boisson') ? '🥤' :
               product.category_name?.toLowerCase().includes('burger') ? '🍔' :
               product.category_name?.toLowerCase().includes('sauce') ? '🧴' : '🌯'}
            </span>
            <span className="text-[10px] text-zinc-600 text-center px-2 line-clamp-2">{product.name}</span>
          </div>
        )}

        {/* Badge supérieur gauche : Note 4.9 ★ (Discret et propre sur fond sombre) */}
        <div className="absolute top-2 left-2 z-10">
          <div className="flex items-center gap-1 rounded-full bg-black/65 backdrop-blur-md px-2 py-0.5 text-[11px] font-black text-white border border-white/10 shadow-md">
            <span className="text-bmc-gold">★</span>
            <span>4.9</span>
          </div>
        </div>

        {/* Bouton supérieur droit : Cœur Favori interactif (Calqué sur la Maquette) */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.82 }}
          onClick={handleFavoriteClick}
          aria-label="Ajouter aux favoris"
          className="absolute top-2 right-2 z-10 flex size-7.5 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-md text-zinc-300 hover:text-red-500 transition-colors cursor-pointer"
        >
          <Heart
            className={`size-4 transition-colors ${
              isFavorite ? 'fill-[#E11D48] text-[#E11D48]' : 'text-zinc-400'
            }`}
          />
        </motion.button>

        {/* Dégradé bas soigné pour fondre avec le fond de la carte */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#121214] via-[#121214]/50 to-transparent"
        />

        {/* Masque si épuisé */}
        {!product.is_available && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 backdrop-blur-xs">
            <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-white border border-zinc-700">
              Épuisé
            </span>
          </div>
        )}
      </div>

      {/* 2. Corps de la carte épuré (Nom + Prix Or BMC et Bouton '+') */}
      <div className="flex flex-col justify-between p-3 sm:p-3.5 pt-2 sm:pt-2.5 text-left flex-1">
        <div>
          {/* Ligne 1 : Titre du plat en grand format */}
          <h3 className="font-display text-sm sm:text-base font-bold text-white line-clamp-1 group-hover:text-bmc-gold transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Ligne 2 : Prix en Or BMC bien mis en valeur & Bouton '+' rond */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/60">
          <span className="font-display text-base sm:text-lg font-black text-bmc-gold tracking-tight">
            {formatFcfa(product.price)}
          </span>

          {/* Bouton '+' rond en Or officiel BMC (#FCB800) avec icône noire */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.08 }}
            onClick={handleAddClick}
            disabled={!product.is_available}
            aria-label={`Ajouter ${product.name} au panier`}
            className={`shrink-0 flex size-8 sm:size-9 items-center justify-center rounded-full font-black shadow-md transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40
              ${
                justAdded
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-bmc-gold hover:bg-yellow-400 text-black shadow-[0_2px_10px_rgba(252,184,0,0.35)]'
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
                  <Check className="size-4 text-white stroke-[3]" />
                </motion.span>
              ) : (
                <motion.span
                  key="plus"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.5 }}
                >
                  <Plus className="size-4.5 sm:size-5 text-black stroke-[3]" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </article>
  )
}
