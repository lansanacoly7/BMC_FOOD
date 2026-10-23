import { useRef } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { Product } from '../../types'

export interface ProductCarouselProps {
  id: string
  title: string
  subtitle?: string
  badgeText?: string
  products: Product[]
  onAddToCart: (product: Product) => void
  onSelectProduct: (product: Product) => void
}

export function ProductCarousel({
  id,
  title,
  subtitle,
  badgeText,
  products,
  onAddToCart,
  onSelectProduct,
}: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (products.length === 0) return null

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <section aria-labelledby={`${id}-heading`} className="w-full flex flex-col gap-3.5 text-left">
      {/* En-tête du carrousel avec titre, sous-titre et contrôles de défilement desktop */}
      <div className="flex items-center justify-between">
        <div>
          <h3 id={`${id}-heading`} className="font-display text-lg sm:text-xl font-extrabold text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Flèches de navigation desktop */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label="Faire défiler vers la gauche"
            className="flex size-7 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label="Faire défiler vers la droite"
            className="flex size-7 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Rangée défilante horizontale avec snapping */}
      <div
        ref={scrollRef}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0 scroll-smooth"
      >
        {products.map((product) => (
          <motion.article
            key={product.id}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.15 }}
            onClick={() => onSelectProduct(product)}
            className="group relative flex w-[210px] sm:w-[240px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl bg-[#121214] border border-zinc-800/90 shadow-md hover:border-zinc-700 hover:shadow-xl transition-all cursor-pointer select-none"
          >
            {/* Image avec ratio 4:3 prenant TOUT le conteneur en largeur comme les autres cartes */}
            <div className="relative aspect-4/3 w-full overflow-hidden bg-zinc-950 flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-500 text-xs">
                  Photo BMC
                </div>
              )}

              {/* Badge (ex: TOP VENTES, FRAIS, etc.) */}
              {(badgeText || product.popular) && (
                <div className="absolute top-2 left-2 z-10">
                  <span className="rounded-md bg-bmc-gold px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-black shadow-xs">
                    {badgeText || (product.popular ? '★ TOP VENTES' : 'BMC')}
                  </span>
                </div>
              )}

              {/* Dégradé bas soigné pour fondre avec la carte */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#121214] via-[#121214]/60 to-transparent"
              />
            </div>

              {/* Textes et Prix avec padding intérieur soigné */}
              <div className="p-3.5 flex flex-col justify-between flex-1">
                <div>
                  <h4 className="font-display text-sm font-bold text-white line-clamp-1 group-hover:text-bmc-gold transition-colors">
                    {product.name}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-zinc-400 line-clamp-1 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between pt-1">
                  <span className="font-display text-sm sm:text-base font-black text-bmc-gold">
                    {product.price.toLocaleString('fr-FR')} F
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddToCart(product)
                    }}
                    aria-label={`Ajouter ${product.name} au panier`}
                    className="flex size-8 sm:size-9 items-center justify-center rounded-full bg-bmc-gold hover:bg-yellow-400 text-black font-black shadow-md active:scale-95 transition-transform cursor-pointer"
                  >
                    <Plus className="size-4.5 stroke-[3]" />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
      </div>
    </section>
  )
}
