import { Check, Crown, Flame, Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useState } from 'react'
import { formatFcfa } from '../../lib/format'
import type { Product } from '../../types'

/** Durée d'affichage de la confirmation « Ajouté » après un ajout au panier. */
const ADDED_FEEDBACK_MS = 1600

interface DailySpecialBannerProps {
  specials: Product[]
  isLoading: boolean
  onAdd: (product: Product) => void
}

/**
 * Bandeau du Plat du Jour en tête du site client. Avec plusieurs plats du jour, les cartes défilent
 * horizontalement au doigt (pas de rotation automatique). Rien n'est affiché si aucun plat n'est disponible.
 */
export function DailySpecialBanner({ specials, isLoading, onAdd }: DailySpecialBannerProps) {
  const headingId = useId()

  if (isLoading) {
    return <div aria-hidden="true" className="h-60 animate-pulse rounded-3xl bg-zinc-200" />
  }
  if (specials.length === 0) return null

  const isCarousel = specials.length > 1

  return (
    <section aria-labelledby={headingId}>
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
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(product.image_url) && !imageFailed

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
      className={`relative isolate flex flex-col overflow-hidden rounded-3xl bg-bmc-charcoal p-5 text-bmc-offwhite shadow-xl shadow-bmc-charcoal/20 ${
        isCarousel ? 'w-[85%] shrink-0 snap-center' : ''
      }`}
    >
      {/* Halo doré décoratif, rappel de l'éclairage des visuels BMC. */}
      <div aria-hidden="true" className="absolute -right-16 -top-20 -z-10 size-56 rounded-full bg-bmc-gold/25 blur-3xl" />

      <span className="relative inline-flex items-center gap-1.5 self-start overflow-hidden rounded-full bg-bmc-gold px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-bmc-charcoal">
        <motion.span
          animate={{ rotate: [0, -14, 12, -6, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.4 }}
          className="inline-flex"
        >
          <Flame className="size-3.5" aria-hidden="true" />
        </motion.span>
        Plat du jour
        {/* Reflet lumineux qui balaie le badge. */}
        <motion.span
          aria-hidden="true"
          initial={{ x: '-150%' }}
          animate={{ x: '350%' }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.8, ease: 'easeInOut' }}
          className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-white/50"
        />
      </span>

      <div className="mt-4 flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-2xl font-extrabold leading-tight">{product.name}</h3>
          {product.description && (
            <p className="mt-1.5 line-clamp-2 text-sm text-zinc-300">{product.description}</p>
          )}
        </div>
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="size-24 shrink-0 overflow-hidden rounded-2xl shadow-lg shadow-black/40"
        >
          {showImage ? (
            <img
              src={product.image_url}
              alt=""
              width={96}
              height={96}
              decoding="async"
              onError={() => setImageFailed(true)}
              className="size-full object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center bg-linear-to-br from-bmc-gold to-bmc-orange text-bmc-charcoal">
              <Crown className="size-10" aria-hidden="true" />
            </div>
          )}
        </motion.div>
      </div>

      {/* mt-auto : prix et bouton alignés en bas quand des cartes de hauteurs différentes défilent côte à côte. */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <p className="font-display text-2xl font-extrabold tabular-nums text-bmc-gold">{formatFcfa(product.price)}</p>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={handleAdd}
          aria-label={`Ajouter ${product.name} au panier`}
          className="inline-flex h-12 min-w-32 items-center justify-center gap-2 rounded-2xl bg-bmc-orange px-5 font-display font-bold text-bmc-charcoal shadow-lg shadow-bmc-orange/25 transition-colors hover:bg-bmc-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={justAdded ? 'added' : 'add'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center gap-2"
            >
              {justAdded ? (
                <Check className="size-5" aria-hidden="true" />
              ) : (
                <Plus className="size-5" aria-hidden="true" />
              )}
              {justAdded ? 'Ajouté' : 'Ajouter'}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      <p className="sr-only" aria-live="polite">
        {justAdded ? `${product.name} ajouté au panier` : ''}
      </p>
    </motion.li>
  )
}
