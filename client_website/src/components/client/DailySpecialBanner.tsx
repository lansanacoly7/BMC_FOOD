import { Check, Flame, Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useState } from 'react'
import { formatFcfa } from '../../lib/format'
import type { Product } from '../../types'

const ADDED_FEEDBACK_MS = 1600

interface DailySpecialBannerProps {
  specials: Product[]
  isLoading: boolean
  onAdd: (product: Product) => void
}

/**
 * Bandeau Plat du Jour — Format 1 Héros plein cadre (Charte graphique Page 10 & 11, Point 3).
 * Positionné STRICTEMENT après le hero d'accueil.
 * Si aucun plat du jour n'est disponible, retourne null sans laisser aucun espace vide.
 */
export function DailySpecialBanner({ specials, isLoading, onAdd }: DailySpecialBannerProps) {
  const headingId = useId()

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 sm:px-6">
        <div aria-hidden="true" className="h-56 animate-pulse rounded-3xl bg-zinc-900 border border-white/5" />
      </div>
    )
  }

  // RÈGLE D'OR : S'il n'y a pas de Plat du Jour, le bandeau disparaît sans laisser de vide.
  if (specials.length === 0) return null

  const isCarousel = specials.length > 1

  return (
    <section aria-labelledby={headingId} className="w-full bg-bmc-black px-4 pb-6 pt-1 sm:px-6">
      <div className="mx-auto max-w-lg">
        <h2 id={headingId} className="sr-only">
          Plat du jour
        </h2>
        <ul
          className={
            isCarousel
              ? '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 [scrollbar-width:none]'
              : ''
          }
        >
          <AnimatePresence initial={false} mode="popLayout">
            {specials.map((product) => (
              <DailySpecialCard key={product.code} product={product} isCarousel={isCarousel} onAdd={onAdd} />
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  )
}

interface DailySpecialCardProps {
  product: Product
  isCarousel: boolean
  onAdd: (product: Product) => void
}

function DailySpecialCard({ product, isCarousel, onAdd }: DailySpecialCardProps) {
  const [justAdded, setJustAdded] = useState(false)
  const imageSrc = product.image_url || '/images/products/tacos-viande-pane.webp'

  useEffect(() => {
    if (!justAdded) return
    const timer = window.setTimeout(() => setJustAdded(false), ADDED_FEEDBACK_MS)
    return () => window.clearTimeout(timer)
  }, [justAdded])

  const handleAdd = () => {
    onAdd(product)
    setJustAdded(true)
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 24, stiffness: 260 }}
      className={`relative isolate flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-5 text-white shadow-2xl shadow-black/60 ${
        isCarousel ? 'w-[90%] shrink-0 snap-center' : 'w-full'
      }`}
    >
      {/* Halo doré chaud arrière-plan */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 -z-10 size-48 rounded-full bg-bmc-gold/25 blur-3xl" />

      {/* Badge officiel Or : ★ PLAT DU JOUR */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-bmc-gold px-3 py-1 font-display text-xs font-extrabold uppercase tracking-wider text-bmc-charcoal shadow-sm">
          <Flame className="size-3.5 fill-bmc-charcoal text-bmc-charcoal" aria-hidden="true" />
          ★ Plat du jour
        </span>
        <span className="text-xs font-semibold text-zinc-400">Aujourd'hui seulement</span>
      </div>

      {/* Contenu principal : Titre à gauche, Photo généreuse à droite (Page 10, Format 1) */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="font-display text-xl font-extrabold leading-tight text-white sm:text-2xl">
            {product.name}
          </h3>
          {product.description && (
            <p className="line-clamp-2 text-xs font-normal text-zinc-300 leading-relaxed sm:text-sm">
              {product.description}
            </p>
          )}
        </div>

        {/* Visuel du plat à droite avec coupe visible */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative size-28 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-zinc-800 shadow-xl shadow-black/50 sm:size-32"
        >
          <img
            src={imageSrc}
            alt={product.name}
            width={128}
            height={128}
            loading="eager"
            decoding="async"
            className="size-full object-cover"
          />
        </motion.div>
      </div>

      {/* Bas de carte : Prix en Or + Bouton Commander ou Ajouter (Page 10) */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">Tarif unique</span>
          <p className="font-display text-2xl font-extrabold tabular-nums text-bmc-gold sm:text-3xl">
            {formatFcfa(product.price)}
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleAdd}
          aria-label={`Ajouter ${product.name} au panier`}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-bmc-orange-braise px-6 font-display font-bold text-white shadow-lg shadow-bmc-orange-braise/35 transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-bmc-gold"
        >
          <AnimatePresence mode="wait" initial={false}>
            {justAdded ? (
              <motion.span
                key="added"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="inline-flex items-center gap-1.5"
              >
                <Check className="size-5" aria-hidden="true" />
                Ajouté
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="inline-flex items-center gap-1.5"
              >
                <Plus className="size-5" aria-hidden="true" />
                Commander
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.li>
  )
}
