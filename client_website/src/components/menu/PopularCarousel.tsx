import { motion } from 'motion/react'
import { Plus, Star } from 'lucide-react'
import type { Product } from '../../types'

export interface PopularCarouselProps {
  products: Product[]
  onAddToCart: (product: Product) => void
  onSelectProduct: (product: Product) => void
}

export function PopularCarousel({
  products,
  onAddToCart,
  onSelectProduct,
}: PopularCarouselProps) {
  const popularItems = products.filter((p) => p.popular || p.is_daily_special).slice(0, 6)

  if (popularItems.length === 0) return null

  return (
    <section aria-labelledby="popular-heading" className="w-full flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-bmc-gold/20 text-bmc-gold">
            <Star className="size-4 fill-current" aria-hidden="true" />
          </div>
          <h3 id="popular-heading" className="font-display text-xl sm:text-2xl font-extrabold text-white">
            Les Plus Commandés
          </h3>
        </div>
        <span className="text-xs font-semibold text-zinc-400">
          Incontournables de Dakar
        </span>
      </div>

      {/* Carrousel horizontal fluide avec snapping et sans barre de scroll */}
      <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0">
        {popularItems.map((product) => (
          <motion.article
            key={product.id}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.15 }}
            onClick={() => onSelectProduct(product)}
            className="group relative flex w-[230px] sm:w-[260px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl bg-[#121214] border border-zinc-800 shadow-lg hover:border-zinc-700 cursor-pointer select-none"
          >
            {/* Image avec ratio 4:3 prenant TOUT le conteneur */}
            <div className="relative aspect-4/3 w-full overflow-hidden bg-zinc-950 flex items-center justify-center">
              <img
                src={product.image_url}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-2 left-2 z-10">
                <span className="rounded-md bg-bmc-gold px-2 py-0.5 text-[10px] font-black uppercase text-black shadow-sm">
                  ★ TOP VENTES
                </span>
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#121214] via-[#121214]/60 to-transparent"
              />
            </div>

            {/* Infos produit */}
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
                <span className="font-display text-base font-black text-bmc-gold">
                  {product.price.toLocaleString('fr-FR')} F
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddToCart(product)
                  }}
                  aria-label={`Ajouter ${product.name} au panier`}
                  className="flex size-9 items-center justify-center rounded-full bg-bmc-gold hover:bg-yellow-400 text-black font-black text-lg shadow-md active:scale-95 transition-transform cursor-pointer"
                >
                  <Plus className="size-5 stroke-[3]" />
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
