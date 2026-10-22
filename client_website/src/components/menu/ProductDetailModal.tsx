import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Check, Heart, Minus, Plus, ShoppingBag } from 'lucide-react'
import type { Product } from '../../types'
import { formatFcfa } from '../../lib/format'
import { FALLBACK_PRODUCTS } from '../../data/mockMenu'

export interface ProductDetailModalProps {
  product: Product | null
  onClose: () => void
  onAddToCart: (product: Product, quantity: number) => void
}

export function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(0)
  const [favorite, setFavorite] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  // Remise à zéro du compteur à chaque ouverture d'un nouveau plat
  useEffect(() => {
    setQuantity(0)
    setJustAdded(false)
  }, [product?.id])

  useEffect(() => {
    if (!product) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [product, onClose])

  if (!product) return null


  const toggleFavorite = () => setFavorite((v) => !v)

  const handleAdd = () => {
    if (quantity < 1) return
    onAddToCart(product, quantity)
    setJustAdded(true)
    setTimeout(() => {
      setJustAdded(false)
      onClose()
      setQuantity(0)
    }, 500)
  }

  // Suggestions d'association (sauces et rafraîchissements pour compléter le plat)
  const suggestions = FALLBACK_PRODUCTS.filter(
    (p) => p.id !== product.id && (p.category === 4 || p.category === 5),
  ).slice(0, 5)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md">
        {/* Backdrop cliquable */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0"
        />

        {/* Conteneur principal de la vue produit : plein écran complet sur mobile, modale centrée sur desktop */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
          initial={{ opacity: 0, y: 35, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 35, scale: 0.98 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative z-10 w-full h-dvh sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-3xl bg-[#0C0C0D] text-white shadow-2xl border-0 sm:border sm:border-zinc-800 overflow-hidden flex flex-col text-left"
        >
          {/* ScrollView interne pour tout le contenu */}
          <div className="flex-1 overflow-y-auto scrollbar-none pb-4">
            {/* 1. HERO : Image du plat nette et lumineuse en plein format (sans flou et sans arrondi asymétrique) */}
            <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-zinc-950">
              <img
                src={product.image_url}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#121214] via-transparent to-black/60 pointer-events-none"
              />

              {/* Header avec bouton retour (flèche blanche), badge 'BMC FOOD' et favori '♥' */}
              <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Retour au menu"
                  className="flex size-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/15 hover:bg-black/80 text-white transition-all cursor-pointer group shadow-lg active:scale-95"
                >
                  <ArrowLeft className="size-5 stroke-[2.5] text-white transition-transform group-hover:-translate-x-0.5" />
                </button>

                <span className="font-display text-xs sm:text-sm font-black text-white/90 tracking-wider uppercase bg-black/50 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10">
                  BMC FOOD
                </span>

                <button
                  type="button"
                  onClick={toggleFavorite}
                  aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  className="flex size-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <Heart
                    className={`size-5 transition-colors ${
                      favorite ? 'fill-red-500 text-red-500' : 'text-white'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 2. SHEET SOMBRE (#121214) : Bords arrondis qui glissent sous le Hero */}
            <div className="relative -mt-6 rounded-t-3xl bg-[#121214] px-5 sm:px-6 pt-5 pb-6 border-t border-zinc-800">
              {/* 3. INFORMATIONS DU PLAT : Titre, Prix Or BMC et Note */}
              <div className="flex items-start justify-between gap-3 pt-1">
                <div className="flex-1">
                  <h2
                    id="product-modal-title"
                    className="font-display text-2xl sm:text-3xl font-black text-white leading-tight"
                  >
                    {product.name}
                  </h2>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400 font-semibold">
                    <span className="text-bmc-gold font-bold">★</span>
                    <span className="text-white font-bold">4.9</span>
                    <span>·</span>
                    <span>Spécialité maison BMC</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="font-display text-2xl sm:text-3xl font-black text-bmc-gold tracking-tight">
                    {formatFcfa(product.price)}
                  </span>
                </div>
              </div>

              {/* Description concise */}
              <p className="mt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {product.description}
              </p>

              {/* Sélecteur de quantité */}
              <div className="mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-4">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                  Quantité
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={quantity === 0}
                    onClick={() => setQuantity((v) => Math.max(0, v - 1))}
                    aria-label="Diminuer la quantité"
                    className="flex size-9 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 cursor-pointer transition-colors"
                  >
                    <Minus className="size-4" />
                  </button>

                  <span className="w-8 text-center font-display font-black text-white text-lg">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => setQuantity((v) => v + 1)}
                    aria-label="Augmenter la quantité"
                    className="flex size-9 items-center justify-center rounded-xl bg-bmc-gold hover:bg-yellow-400 text-black font-black shadow-md cursor-pointer transition-colors"
                  >
                    <Plus className="size-4 stroke-[3]" />
                  </button>
                </div>
              </div>

              {/* 4. SUGGESTIONS D'ASSOCIATION (Positionnées immédiatement ici avant le bas) */}
              <div className="mt-6 border-t border-zinc-800/80 pt-5">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="font-display text-base font-extrabold text-white">
                    Suggestions d'association
                  </h3>
                  <span className="text-xs text-bmc-gold font-semibold">
                    À ajouter au repas
                  </span>
                </div>

                <div className="scrollbar-none -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
                  {suggestions.map((item) => (
                    <div
                      key={item.id}
                      className="flex w-32 shrink-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#18181B] text-center transition-all hover:border-zinc-700 shadow-md"
                    >
                      {/* Image plein conteneur (aucun espace vide à l'intérieur) */}
                      <div className="h-24 w-full overflow-hidden bg-zinc-950 flex items-center justify-center">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>

                      {/* Contenu textuel et action avec espacement soigné */}
                      <div className="flex flex-col items-center p-2.5 w-full">
                        <span
                          className="font-display text-xs font-bold text-white line-clamp-1 w-full"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                        <span className="mt-0.5 font-display text-xs font-black text-bmc-gold">
                          +{item.price} F
                        </span>
                        <button
                          type="button"
                          onClick={() => onAddToCart(item, 1)}
                          className="mt-2 w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 py-1.5 text-[11px] font-bold text-zinc-200 hover:text-white transition-colors cursor-pointer active:scale-95"
                        >
                          + Ajouter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 5. FOOTER FIXE EN BAS (Total Box + Grand Bouton JAUNE d'action) */}
          <div className="sticky bottom-0 inset-x-0 z-30 flex items-stretch gap-3 border-t border-zinc-800 bg-[#121214]/95 backdrop-blur-md px-5 py-4">
            <div className="min-w-28 sm:min-w-32 flex flex-col items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 px-4 py-2">
              <span className="text-[11px] font-bold text-zinc-400">Total</span>
              <span className="font-display text-base sm:text-lg font-black text-bmc-gold tracking-tight">
                {formatFcfa(product.price * quantity)}
              </span>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleAdd}
              disabled={quantity === 0 && !justAdded}
              className={`flex-1 flex items-center justify-center gap-2.5 rounded-2xl py-3.5 px-6 font-display font-black text-sm sm:text-base transition-all cursor-pointer shadow-lg disabled:cursor-not-allowed
                ${
                  justAdded
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                    : quantity === 0
                    ? 'bg-zinc-800 text-zinc-500 shadow-none'
                    : 'bg-bmc-gold hover:bg-yellow-400 text-black shadow-[0_4px_25px_rgba(252,184,0,0.4)]'
                }`}
            >
              {justAdded ? (
                <>
                  <Check className="size-5 stroke-[3]" />
                  <span>Ajouté !</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="size-4.5 stroke-[2.5]" />
                  <span>Ajouter au panier</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
