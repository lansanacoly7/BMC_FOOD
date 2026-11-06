import { useCallback, useId, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { getProductImageUrl } from '../../lib/productImages'
import type { Product } from '../../types'

/** Nombre maximal de plats mis en avant dans le carrousel. */
const MAX_FEATURED = 8
const CARD_GAP_PX = 12
const ADDED_FEEDBACK_MS = 1400

interface DailySpecialBannerProps {
  specials: Product[]
  fallbackProducts?: Product[]
  isLoading: boolean
  onAdd: (product: Product) => void
  onSeeAll?: () => void
  onSelect?: (product: Product) => void
}

interface FeaturedItem {
  product: Product
  isSpecial: boolean
}

/**
 * « Les plus commandés » : grand carrousel sous le hero. Le plat du jour (s'il y en a un) ouvre la
 * série, suivi des plats les plus commandés. Sur téléphone on glisse avec le doigt (la carte suivante
 * dépasse pour le suggérer) ; sur grand écran, des flèches. Les cartes sont portées par la photo, avec
 * le texte posé sur un voile sombre fixe, lisible en mode clair comme en mode sombre.
 */
export function DailySpecialBanner({
  specials,
  fallbackProducts = [],
  isLoading,
  onAdd,
  onSeeAll,
  onSelect,
}: DailySpecialBannerProps) {
  const headingId = useId()
  const listRef = useRef<HTMLUListElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const items = useMemo<FeaturedItem[]>(() => {
    const special = specials.map((product) => ({ product, isSpecial: true }))
    const specialCodes = new Set(specials.map((product) => product.code))
    const popular = fallbackProducts.filter((product) => product.popular && !specialCodes.has(product.code))
    const tacos = fallbackProducts.filter(
      (product) =>
        !product.popular && !specialCodes.has(product.code) && (product.code.startsWith('tp-') || product.category_name?.toLowerCase().includes('tacos')),
    )
    const bestSellers = [...popular, ...tacos].map((product) => ({ product, isSpecial: false }))
    const rest = bestSellers.length > 0 ? bestSellers : fallbackProducts.filter((product) => !specialCodes.has(product.code)).map((product) => ({ product, isSpecial: false }))
    return [...special, ...rest].slice(0, MAX_FEATURED)
  }, [specials, fallbackProducts])

  const step = useCallback(() => {
    const first = listRef.current?.firstElementChild as HTMLElement | null
    return (first?.offsetWidth ?? 280) + CARD_GAP_PX
  }, [])

  const handleScroll = () => {
    const list = listRef.current
    if (!list) return
    setActiveIndex(Math.min(items.length - 1, Math.max(0, Math.round(list.scrollLeft / step()))))
  }

  const goTo = (index: number) => {
    listRef.current?.scrollTo({ left: index * step(), behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="-mx-4 flex gap-3 overflow-hidden px-4 sm:mx-0 sm:px-0" aria-hidden="true">
          {[0, 1].map((index) => (
            <div key={index} className="aspect-4/5 w-[80%] shrink-0 animate-pulse rounded-2xl bg-zinc-900 sm:w-[300px]" />
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <section aria-labelledby={headingId} className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 id={headingId} className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
          À la une
        </h2>

        <div className="flex items-center gap-2">
          {onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              className="inline-flex h-10 cursor-pointer items-center gap-1 text-sm font-medium text-bmc-gold hover:text-white"
            >
              Toute la carte
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          )}
          {items.length > 2 && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <button
                type="button"
                onClick={() => goTo(Math.max(0, activeIndex - 1))}
                aria-label="Plat précédent"
                className="grid size-10 cursor-pointer place-items-center rounded-full border border-white/15 text-white transition-colors hover:border-white/40"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => goTo(Math.min(items.length - 1, activeIndex + 1))}
                aria-label="Plat suivant"
                className="grid size-10 cursor-pointer place-items-center rounded-full border border-white/15 text-white transition-colors hover:border-white/40"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>

      <ul
        ref={listRef}
        onScroll={handleScroll}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:scroll-px-0 sm:px-0"
      >
        {items.map((item, index) => (
          <FeaturedCard key={item.product.code} item={item} rank={index + 1} priority={index < 2} onAdd={onAdd} onSelect={onSelect} />
        ))}
      </ul>

      {items.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5" role="group" aria-label="Position dans le carrousel">
          {items.map((item, index) => (
            <button
              key={item.product.code}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Aller au plat ${index + 1} sur ${items.length}`}
              aria-current={index === activeIndex}
              className="group grid h-6 cursor-pointer place-items-center px-0.5"
            >
              <span
                className={`block h-1 rounded-full transition-all duration-300 ${
                  index === activeIndex ? 'w-7 bg-bmc-gold' : 'w-3 bg-white/20 group-hover:bg-white/45'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function FeaturedCard({
  item,
  rank,
  priority,
  onAdd,
  onSelect,
}: {
  item: FeaturedItem
  rank: number
  priority: boolean
  onAdd: (product: Product) => void
  onSelect?: (product: Product) => void
}) {
  const { product, isSpecial } = item
  const [justAdded, setJustAdded] = useState(false)
  const image = getProductImageUrl(product) || product.image_url

  const handleAdd = () => {
    onAdd(product)
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), ADDED_FEEDBACK_MS)
  }

  // Couleurs du voile et du texte écrites en dur : le texte reste blanc sur la photo dans les deux thèmes.
  return (
    <li className="w-[80%] shrink-0 snap-start sm:w-[300px] lg:w-[330px]">
      <article
        className={`group relative isolate flex aspect-4/5 flex-col justify-between overflow-hidden rounded-2xl bg-[#0c0c0d] p-4 text-[#ffffff] transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
          isSpecial ? 'ring-2 ring-inset ring-bmc-gold' : ''
        }`}
      >
        {image && (
          <img
            src={image}
            alt=""
            width={660}
            height={825}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0c0c0d] via-[#0c0c0d]/45 to-[#0c0c0d]/10"
        />

        <div className="flex items-center justify-between">
          <span className="rounded-md bg-[#0c0c0d]/70 px-2 py-1 font-display text-xs font-bold tabular-nums tracking-wider">
            {String(rank).padStart(2, '0')}
          </span>
          {isSpecial && (
            <span className="rounded-md bg-bmc-gold px-2 py-1 text-xs font-bold uppercase tracking-wider text-black">
              Plat du jour
            </span>
          )}
        </div>

        <div>
          <h3 className="font-display text-xl font-bold leading-tight">
            <button type="button" onClick={() => onSelect?.(product)} className="cursor-pointer text-left underline-offset-4 hover:underline">
              {product.name}
            </button>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-[#ffffff]/75">{product.description}</p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="font-display text-2xl font-bold tabular-nums text-bmc-gold">
              {product.price.toLocaleString('fr-FR')} F
            </p>
            <button
              type="button"
              onClick={handleAdd}
              aria-label={`Ajouter ${product.name} au panier`}
              className={`grid size-12 shrink-0 cursor-pointer place-items-center rounded-full text-black transition-colors ${
                justAdded ? 'bg-bmc-success text-white' : 'bg-bmc-gold hover:bg-amber-400'
              }`}
            >
              {justAdded ? <Check className="size-5" aria-hidden="true" /> : <Plus className="size-6 stroke-[2.5]" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </article>
    </li>
  )
}
