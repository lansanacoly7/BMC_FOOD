import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, useRef, useEffect } from 'react'

import { CATEGORIES } from '../../data/categories'



interface CategoryPillsProps {
  activeId: string
  onSelect: (id: string) => void
}

/**
 * Catégories en vignettes photo dynamiques (Page 11 de la charte graphique, Point 4).
 * Spécifications Maimouna Sall :
 * - Desktop : Défilement fluide de gauche à droite (non statique), flèches de navigation et autoscroll doux.
 * - Pause automatique du défilement au survol de la souris.
 * - Encadrement Or BMC (#FCB800) de la catégorie active avec recentrage automatique.
 * - Mobile : Défilement tactile fluide au doigt préservé intact.
 */
export function CategoryPills({ activeId, onSelect }: CategoryPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  // Défilement automatique continu et doux sur desktop (défilement sans stop de gauche à droite)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let animationFrameId: number
    const scrollSpeed = 0.5 // Vitesse de croisière douce et lisible

    const step = () => {
      // Défilement automatique actif sur écran >= 768px lorsque la souris ne survole pas
      if (!isHovered && window.innerWidth >= 768 && el) {
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
          el.scrollLeft = 0
        } else {
          el.scrollLeft += scrollSpeed
        }
      }
      animationFrameId = requestAnimationFrame(step)
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isHovered])

  // Défilement manuel via les flèches de navigation desktop
  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const offset = direction === 'left' ? -260 : 260
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  // Clic sur une catégorie : sélection et recentrage dans le rail
  const handleCategoryClick = (catId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    onSelect(catId)
    event.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  return (
    <section aria-label="Catégories du menu" className="relative w-full">
      <div
        className="relative flex items-center justify-between gap-1 sm:gap-3"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Flèche de navigation Gauche (Desktop) */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          aria-label="Faire défiler les catégories vers la gauche"
          className="hidden sm:flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-900/90 border border-white/15 text-bmc-gold hover:bg-zinc-800 hover:border-bmc-gold hover:scale-110 shadow-lg cursor-pointer transition-all z-10"
        >
          <ChevronLeft className="size-5 stroke-[2.5]" />
        </button>

        {/* Rail de défilement horizontal des catégories */}
        <div
          ref={scrollRef}
          className="-mx-4 flex gap-3.5 overflow-x-auto px-6 py-4 overscroll-x-contain [scrollbar-width:none] scroll-smooth sm:mx-0 sm:px-2 sm:gap-6"
        >
          {CATEGORIES.map((cat) => {
            const isActive = cat.id === activeId
            return (
              <motion.button
                key={cat.id}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={(e) => handleCategoryClick(cat.id, e)}
                className="group flex w-18 shrink-0 flex-col items-center gap-2.5 focus:outline-none sm:w-22 cursor-pointer p-1"
              >
                {/* Vignette photo circulaire cerclée d'Or BMC (#FCB800) */}
                <div
                  className={`relative aspect-square w-full overflow-hidden rounded-full bg-zinc-900 transition-all duration-300 ${
                    isActive
                      ? 'ring-2 ring-bmc-gold ring-offset-2 ring-offset-zinc-950 scale-105'
                      : 'ring-1 ring-white/15 group-hover:ring-bmc-gold/50 group-hover:scale-105'
                  }`}
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    width={80}
                    height={80}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                {/* Libellé centré sous la vignette */}
                <span
                  className={`text-center text-xs font-bold leading-tight transition-colors whitespace-nowrap ${
                    isActive ? 'text-bmc-gold font-bold' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                >
                  {cat.name}
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* Flèche de navigation Droite (Desktop) */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          aria-label="Faire défiler les catégories vers la droite"
          className="hidden sm:flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-900/90 border border-white/15 text-bmc-gold hover:bg-zinc-800 hover:border-bmc-gold hover:scale-110 shadow-lg cursor-pointer transition-all z-10"
        >
          <ChevronRight className="size-5 stroke-[2.5]" />
        </button>
      </div>
    </section>
  )
}
