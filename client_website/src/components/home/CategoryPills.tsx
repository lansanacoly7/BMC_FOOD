import { motion } from 'motion/react'

export interface CategoryItem {
  id: string
  name: string
  image: string
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: 'all',
    name: 'Tout voir',
    image: '/images/products/tacos-viande-pane.webp',
  },
  {
    id: 'tacos-panes',
    name: 'Tacos panés',
    image: '/images/products/tacos-mixte-pane.webp',
  },
  {
    id: 'burgers',
    name: 'Burgers',
    image: '/images/products/burger-bmc-complet.webp',
  },
  {
    id: 'tacos-simples',
    name: 'Tacos simples',
    image: '/images/products/tacos-poulet-pane.webp',
  },
  {
    id: 'boissons',
    name: 'Boissons',
    image: '/images/products/boissons-fraiches.webp',
  },
  {
    id: 'sauces',
    name: 'Sauces',
    image: '/images/products/sauces-assortiment.webp',
  },
]

interface CategoryPillsProps {
  activeId: string
  onSelect: (id: string) => void
}

/**
 * Catégories en vignettes photo (Page 11 de la charte graphique, Point 4).
 * Défilement horizontal, photos généreuses et catégorie active cerclée d'or.
 */
export function CategoryPills({ activeId, onSelect }: CategoryPillsProps) {
  return (
    <section aria-label="Catégories du menu" className="w-full">
      <div className="-mx-4 flex gap-3.5 overflow-x-auto px-6 py-4 overscroll-x-contain [scrollbar-width:none] sm:mx-0 sm:px-2">
        {CATEGORIES.map((cat) => {
          const isActive = cat.id === activeId
          return (
            <motion.button
              key={cat.id}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelect(cat.id)}
              className="group flex w-18 shrink-0 flex-col items-center gap-2.5 focus:outline-none sm:w-22 cursor-pointer p-1"
            >
              {/* Vignette photo circulaire (Cercle parfait avec bague dorée et halo net sans aucun rognage) */}
              <div
                className={`relative aspect-square w-full overflow-hidden rounded-full bg-zinc-900 transition-all ${
                  isActive
                    ? 'ring-2 ring-bmc-gold ring-offset-2 ring-offset-zinc-950 shadow-md shadow-bmc-gold/40'
                    : 'ring-1 ring-white/15 group-hover:ring-bmc-gold/50'
                }`}
              >
                <img
                  src={cat.image}
                  alt=""
                  width={80}
                  height={80}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              {/* Libellé centré en dessous */}
              <span
                className={`text-center text-xs font-bold leading-tight transition-colors ${isActive ? 'text-bmc-gold font-black' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
              >
                {cat.name}
              </span>
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}
