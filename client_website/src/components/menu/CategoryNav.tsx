import type { Category } from '../../types'
import { FALLBACK_CATEGORIES } from '../../data/mockMenu'

export interface CategoryNavProps {
  categories: Category[]
  activeCategoryId: number | 'all'
  onSelectCategory: (id: number | 'all') => void
}

export function CategoryNav({
  categories,
  activeCategoryId,
  onSelectCategory,
}: CategoryNavProps) {
  function getCategoryThumb(cat: { name?: string; slug?: string; id: number }): string {
    const s = (cat.slug || cat.name || '').toLowerCase()
    if (s.includes('boisson')) return '/images/products/canette-bissap-bmc.webp'
    if (s.includes('burger')) return '/images/products/burger-bmc-complet.webp'
    if (s.includes('sauce')) return '/images/products/sauces-assortiment.webp'
    if (s.includes('simple')) return '/images/products/sandwich-chawarma.webp'
    if (s.includes('xl')) return '/images/products/tacos-xl-simple.webp'
    if (s.includes('jambon')) return '/images/products/tacos-viande-jambon.webp'
    if (s.includes('hot-dog') || s.includes('hot dog')) return '/images/products/tacos-viande-hot-dog.webp'
    return '/images/products/tacos-viande-pane.webp'
  }

  const items = categories.length > 0 ? categories : FALLBACK_CATEGORIES

  return (
    <nav
      aria-label="Catégories du menu"
      className="scrollbar-none -mx-4 flex items-center gap-3.5 sm:gap-5 overflow-x-auto px-4 py-3 sm:mx-0 sm:px-0"
    >
      {/* Option "Tous" en rondelle avec anneau or */}
      <button
        type="button"
        onClick={() => onSelectCategory('all')}
        className={`group flex shrink-0 flex-col items-center gap-2 transition-all cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-bmc-gold rounded-full p-1
          ${activeCategoryId === 'all' ? 'scale-105' : 'opacity-85 hover:opacity-100'}`}
      >
        <div
          className={`relative size-16 sm:size-18 overflow-hidden rounded-full border-2 transition-all shadow-md
            ${
              activeCategoryId === 'all'
                ? 'border-bmc-gold ring-3 ring-bmc-gold/50 shadow-bmc-gold/20'
                : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900'
            }`}
        >
          <img
            src="/images/products/tacos-viande-pane.webp"
            alt="Tous les plats"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-[10px] font-black uppercase text-white tracking-widest">
              TOUS
            </span>
          </div>
        </div>
        <span
          className={`text-xs font-bold transition-colors whitespace-nowrap
            ${activeCategoryId === 'all' ? 'text-bmc-gold font-extrabold' : 'text-zinc-300 group-hover:text-white'}`}
        >
          Tous les plats
        </span>
      </button>

      {/* Catégories officielles en rondelles */}
      {items.map((cat) => {
        const isActive = activeCategoryId === cat.id
        const imgUrl = getCategoryThumb(cat)

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`group flex shrink-0 flex-col items-center gap-2 transition-all cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-bmc-gold rounded-full p-1
              ${isActive ? 'scale-105' : 'opacity-85 hover:opacity-100'}`}
          >
            <div
              className={`relative size-16 sm:size-18 overflow-hidden rounded-full border-2 transition-all shadow-md
                ${
                  isActive
                    ? 'border-bmc-gold ring-3 ring-bmc-gold/50 shadow-bmc-gold/20'
                    : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900'
                }`}
            >
              <img
                src={imgUrl}
                alt={cat.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <span
              className={`text-xs font-bold transition-colors whitespace-nowrap
                ${isActive ? 'text-bmc-gold font-extrabold' : 'text-zinc-300 group-hover:text-white'}`}
            >
              {cat.name}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
