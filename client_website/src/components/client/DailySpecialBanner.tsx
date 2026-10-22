import {
  Check,
  Flame,
  Plus,
  Sparkles,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Variants } from 'motion/react'
import { useEffect, useId, useState } from 'react'
import { formatFcfa } from '../../lib/format'
import type { Product } from '../../types'

const ADDED_FEEDBACK_MS = 1600
const AUTO_PLAY_INTERVAL_MS = 6000

// GIFS animés officiels fournis par Maimouna pour la mise en valeur des Best-Sellers
const BEST_SELLER_GIFS = [
  '/images/products/tacos_cut_turkey.gif',
  '/images/products/tacos_knife_slice.gif',
  '/images/products/tacos_fried_oil.gif',
  '/images/products/tacos_knife_crispy.gif',
]

interface DailySpecialBannerProps {
  specials: Product[]
  fallbackProducts?: Product[]
  isLoading: boolean
  onAdd: (product: Product) => void
}

/**
 * Carrousel Hybride Best-Sellers & Plat du Jour — Étape 2 Dark Luxury
 * - Met en valeur les meilleurs plats avec photos / GIFs grand format.
 * - Texte aéré avec retour à la ligne après la virgule.
 * - Navigation fluide (flèches + dots dorés) et micro-animation d'entrée avec rebond naturel.
 * - Conteneur hermétique sans aucun débordement.
 */
export function DailySpecialBanner({
  specials,
  fallbackProducts = [],
  isLoading,
  onAdd,
}: DailySpecialBannerProps) {
  const headingId = useId()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [isPaused, setIsPaused] = useState(false)

  // Détermination de la liste des produits à afficher
  const isSpecial = specials.length > 0
  const productList: Product[] = isSpecial
    ? specials
    : (function () {
        const curated = fallbackProducts.filter(
          (p) =>
            p.popular ||
            p.category_name?.toLowerCase().includes('tacos') ||
            p.code.startsWith('tp-')
        )
        return curated.length > 0 ? curated.slice(0, 4) : fallbackProducts.slice(0, 4)
      })()

  // Défilement automatique doux (en pause si l'utilisateur survole)
  useEffect(() => {
    if (productList.length <= 1 || isPaused) return
    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % productList.length)
    }, AUTO_PLAY_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [productList.length, isPaused])

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-4">
        <div
          aria-hidden="true"
          className="h-56 sm:h-64 animate-pulse rounded-3xl bg-zinc-900/80 border border-white/5"
        />
      </div>
    )
  }

  if (productList.length === 0) return null

  const currentProduct = productList[currentIndex] || productList[0]
  const currentGif = BEST_SELLER_GIFS[currentIndex % BEST_SELLER_GIFS.length]

  const handlePrev = () => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + productList.length) % productList.length)
  }

  const handleNext = () => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % productList.length)
  }

  const handleSelectDot = (idx: number) => {
    setDirection(idx >= currentIndex ? 1 : -1)
    setCurrentIndex(idx)
  }

  /** Variantes directionnelles fluides avec amorti naturel */
  const slideVariants: Variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 32 : -32,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 320, damping: 32 },
        opacity: { duration: 0.28 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -32 : 32,
      opacity: 0,
      transition: {
        x: { type: 'spring' as const, stiffness: 320, damping: 32 },
        opacity: { duration: 0.2 },
      },
    }),
  }

  return (
    <section id="daily-special-section" aria-labelledby={headingId} className="w-full bg-zinc-950 px-4 py-4 sm:px-6 sm:py-6 scroll-mt-20">
      {/* 
        CONTENEUR GLOBAL AVEC MICRO-ANIMATION DE REBOND NATUREL
      */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 220,
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="mx-auto max-w-5xl space-y-3.5"
      >
        <h2 id={headingId} className="sr-only">
          {isSpecial ? 'Plat du jour' : 'Carrousel des Best-Sellers BMC Food'}
        </h2>

        {/* 
          CARTE MAJESTUEUSE DU CARROUSEL — DISPOSITION CÔTE À CÔTE SANS AUCUN CHEVAUCHEMENT
        */}
        <div className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/95 via-zinc-900/85 to-zinc-950 p-4 sm:p-7 text-white shadow-2xl backdrop-blur-md">
          {/* Halo doré chaud circonscrit à l'intérieur */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-12 -z-10 size-60 rounded-full bg-bmc-gold/20 blur-3xl"
          />

          {/* LIGNE DU HAUT : BADGE OFFICIEL + CONTRÔLES CARROUSEL FLUIDES */}
          <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2.5 sm:pb-3">
            <div className="flex items-center gap-2">
              {isSpecial ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-bmc-gold px-2.5 sm:px-3 py-1 font-display text-[10px] sm:text-xs font-black uppercase tracking-wider text-black shadow-sm">
                  <Flame className="size-3 sm:size-3.5 fill-black text-black" aria-hidden="true" />
                  <span>★ Plat du Jour</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 px-2.5 sm:px-3 py-1 font-display text-[10px] sm:text-xs font-black uppercase tracking-wider text-black shadow-sm">
                  <Sparkles className="size-3 sm:size-3.5 text-black" aria-hidden="true" />
                  <span>★ Best-Seller n°{currentIndex + 1}</span>
                </span>
              )}

              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-zinc-400">
                <Clock className="size-3 text-bmc-gold" />
                <span>{isSpecial ? "Aujourd'hui seulement" : 'Coup de cœur Dakar'}</span>
              </span>
            </div>

            {/* FLÈCHES DE NAVIGATION DU CARROUSEL */}
            {productList.length > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Plat précédent"
                  className="flex size-7 sm:size-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-zinc-300 hover:border-bmc-gold hover:text-bmc-gold hover:bg-black/70 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <ChevronLeft className="size-4 sm:size-4.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Plat suivant"
                  className="flex size-7 sm:size-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-zinc-300 hover:border-bmc-gold hover:text-bmc-gold hover:bg-black/70 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <ChevronRight className="size-4 sm:size-4.5" />
                </button>
              </div>
            )}
          </div>

          {/* CORPS DU CARROUSEL DIRECTIONNEL AVEC ZONE SUPÉRIEURE 50/50 ÉQUILIBRÉE */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentProduct.code || currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="mt-3 sm:mt-4 flex flex-row items-center justify-between gap-3 sm:gap-6 lg:gap-8"
            >
              {/* 1. GAUCHE : TITRE, DESCRIPTIF, GRAND TARIF OR ET BOUTON DESKTOP */}
              <div className="min-w-0 flex-1 pr-1.5 sm:pr-4 space-y-1.5 sm:space-y-3">
                <h3 className="font-display text-sm xs:text-base sm:text-2xl lg:text-3xl font-black leading-tight text-white tracking-tight">
                  {currentProduct.name}
                </h3>

                {/* Descriptif avec limitation stricte à 2 lignes maximum sur mobile */}
                <div className="text-[11px] sm:text-sm font-normal text-zinc-300 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
                  {formatDescription(currentProduct.description)}
                </div>

                {/* Bloc Tarif Or remonté immédiatement sous les 2 lignes et agrandi */}
                <div className="pt-1 sm:pt-3 flex flex-col sm:flex-row sm:items-center sm:gap-6">
                  <div>
                    <span className="block text-[8px] xs:text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Tarif
                    </span>
                    <p className="font-display text-2xl xs:text-3xl sm:text-3xl lg:text-4xl font-black tabular-nums text-bmc-gold leading-none whitespace-nowrap mt-0.5">
                      {formatFcfa(currentProduct.price)}
                    </p>
                  </div>

                  {/* Bouton Desktop majestueux placé directement dans le flux d'achat */}
                  <div className="hidden sm:block">
                    <AddButton
                      product={currentProduct}
                      onAdd={onAdd}
                      className="h-12 sm:h-13 lg:h-14 px-7 lg:px-9 text-xs sm:text-sm font-black rounded-xl sm:rounded-2xl shadow-md shadow-black/50 hover:shadow-lg hover:shadow-black/70 hover:scale-105"
                    />
                  </div>
                </div>
              </div>

              {/* 2. DROITE : VISUEL DU PLAT AGRANDI SUBTILEMENT VERS LA GAUCHE ET EN HAUTEUR */}
              <div className="relative shrink-0 flex justify-end">
                <motion.div
                  whileHover={{ scale: 1.025 }}
                  transition={{ duration: 0.2 }}
                  className="relative w-36 xs:w-44 sm:w-84 lg:w-[420px] xl:w-[460px] h-32 xs:h-38 sm:h-54 lg:h-60 overflow-hidden rounded-2xl border border-white/15 bg-zinc-900 shadow-xl shadow-black/80"
                >
                  <img
                    src={currentProduct.image_url || currentGif}
                    alt={currentProduct.name}
                    width={460}
                    height={240}
                    loading="eager"
                    className="size-full object-cover object-center filter contrast-105"
                  />
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* 3. LIGNE SÉPARATRICE ET ZONE INFÉRIEURE : BOUTON MOBILE + DOTS */}
          <div className="mt-3.5 sm:mt-5 pt-3 sm:pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Bouton d'action Mobile étendu plein cadre */}
            <div className="w-full sm:hidden">
              <AddButton
                product={currentProduct}
                onAdd={onAdd}
                className="w-full h-11 xs:h-12 text-xs xs:text-sm px-4"
              />
            </div>

            {/* Dots de pagination dorés élégamment centrés */}
            {productList.length > 1 && (
              <div className="w-full flex items-center justify-center gap-2">
                {productList.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDot(idx)}
                    aria-label={`Aller au plat ${idx + 1}`}
                    className={`h-1.5 sm:h-2 rounded-full transition-all cursor-pointer ${
                      idx === currentIndex
                        ? 'w-6 sm:w-7 bg-gradient-to-r from-bmc-gold to-amber-400 shadow-sm shadow-bmc-gold/50'
                        : 'w-1.5 sm:w-2 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  )
}

/** Bouton d'ajout avec retour tactile animé, dimensionné pour mobile et desktop */
function AddButton({
  product,
  onAdd,
  className = '',
}: {
  product: Product
  onAdd: (p: Product) => void
  className?: string
}) {
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    if (!justAdded) return
    const timer = window.setTimeout(() => setJustAdded(false), ADDED_FEEDBACK_MS)
    return () => window.clearTimeout(timer)
  }, [justAdded])

  const handleClick = () => {
    onAdd(product)
    setJustAdded(true)
  }

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      onClick={handleClick}
      aria-label={`Ajouter ${product.name} au panier`}
      className={`group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 font-display font-black uppercase tracking-wider text-black shadow-md shadow-black/40 hover:shadow-lg hover:shadow-black/60 hover:brightness-105 cursor-pointer transition-all shrink-0 whitespace-nowrap active:scale-95 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {justAdded ? (
          <motion.span
            key="added"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="inline-flex items-center gap-1 sm:gap-1.5 text-black"
          >
            <Check className="size-3.5 sm:size-4 text-black stroke-[3]" />
            <span>Ajouté !</span>
          </motion.span>
        ) : (
          <motion.span
            key="add"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="inline-flex items-center gap-1 sm:gap-1.5"
          >
            <Plus className="size-3.5 sm:size-4 text-black stroke-[3]" />
            <span>Commander</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

/** Formate la description pour passer à la ligne proprement après la virgule */
function formatDescription(desc?: string) {
  const defaultText =
    'Viande hachée assaisonnée, frites croustillantes,\nsauce fromagère onctueuse maison et garniture fraîche.'
  const text = desc && desc.trim().length > 0 ? desc : defaultText

  const commaIndex = text.indexOf(',')
  if (commaIndex !== -1 && commaIndex < text.length - 1) {
    const part1 = text.substring(0, commaIndex + 1).trim()
    const part2 = text.substring(commaIndex + 1).trim()
    return (
      <p>
        <span className="block font-medium text-white">{part1}</span>
        <span className="block text-zinc-300 mt-0.5">{part2}</span>
      </p>
    )
  }

  return <p>{text}</p>
}
