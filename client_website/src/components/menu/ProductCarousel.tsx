import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from './ProductCard'
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
          <h3 id={`${id}-heading`} className="font-display text-lg sm:text-xl font-bold text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs sm:text-xs text-zinc-400 mt-0.5">
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
          <div key={product.id} className="w-[210px] shrink-0 snap-start sm:w-[240px]">
            <ProductCard
              product={product}
              badge={badgeText}
              onAdd={onAddToCart}
              onSelect={onSelectProduct}
            />
          </div>
        ))}
      </div>
    </section>
  )
}