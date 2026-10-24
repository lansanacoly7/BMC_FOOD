import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown, Minus, Plus, X } from 'lucide-react'
import type { Product } from '../../types'
import { MAX_ITEM_QUANTITY } from '../../context/cart'
import { getAccompaniments, getProductOptions } from '../../data/productOptions'
import { getProductImageUrl } from '../../lib/productImages'

export interface ProductDetailModalProps {
  product: Product | null
  onClose: () => void
  /** `note` : personnalisation du plat (sans…, sauces, précision). Les accompagnements sont ajoutés séparément. */
  onAddToCart: (product: Product, quantity: number, note?: string) => void
  /** Carte complète, pour proposer boissons, frites, desserts… en accompagnement. */
  catalog?: Product[]
}

/** Nombre d'accompagnements visibles avant « Voir plus ». */
const VISIBLE_EXTRAS = 3

const formatPrice = (value: number) => `${value.toLocaleString('fr-FR')} F`

const stepButton =
  'grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-white/15 text-white transition-colors hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-30'

const chipBase = 'inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors'

/**
 * Liste déroulante : une ligne avec le titre et le résumé du choix, qui s'ouvre pour montrer les options.
 * Tout est replié au départ : on voit d'un coup d'œil ce qu'on peut personnaliser, sans défiler.
 */
function Disclosure({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string
  summary: string
  /** Ouverte dès l'affichage de la fiche (les autres restent repliées). */
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm text-zinc-400">{summary}</span>
          <ChevronDown
            className={`size-4 shrink-0 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </span>
      </button>
      {open && (
        <div id={panelId} className="px-4 pb-4 pt-1">
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * Fiche produit. Grand écran : photo à gauche, informations à droite. Téléphone : photo pleine largeur
 * en haut, puis les choix. Les options sont des listes déroulantes repliées, et la barre du bas
 * (quantité, total, ajout) reste toujours visible. La quantité démarre à 1.
 */
export function ProductDetailModal({ product, onClose, onAddToCart, catalog = [] }: ProductDetailModalProps) {
  return (
    <AnimatePresence>
      {product && <ModalBody key={product.code} product={product} onClose={onClose} onAddToCart={onAddToCart} catalog={catalog} />}
    </AnimatePresence>
  )
}

function ModalBody({
  product,
  onClose,
  onAddToCart,
  catalog,
}: {
  product: Product
  onClose: () => void
  onAddToCart: ProductDetailModalProps['onAddToCart']
  catalog: Product[]
}) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const options = useMemo(() => getProductOptions(product), [product])
  const accompaniments = useMemo(() => getAccompaniments(product, catalog), [product, catalog])

  const [quantity, setQuantity] = useState(1)
  const [removed, setRemoved] = useState<string[]>([])
  const [sauces, setSauces] = useState<string[]>([])
  const [remark, setRemark] = useState('')
  const [showRemark, setShowRemark] = useState(false)
  const [extras, setExtras] = useState<Record<string, number>>({})
  const [showAllExtras, setShowAllExtras] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  const extrasTotal = accompaniments.reduce((sum, item) => sum + item.price * (extras[item.code] ?? 0), 0)
  const extrasCount = accompaniments.reduce((sum, item) => sum + (extras[item.code] ?? 0), 0)
  const total = product.price * quantity + extrasTotal
  const image = getProductImageUrl(product) || product.image_url

  // Les accompagnements déjà choisis restent visibles même quand la liste est repliée
  const visibleExtras = accompaniments.filter(
    (item, index) => showAllExtras || index < VISIBLE_EXTRAS || (extras[item.code] ?? 0) > 0,
  )
  const hiddenCount = accompaniments.length - visibleExtras.length

  const toggle = (list: string[], value: string, setList: (next: string[]) => void, max = Infinity) => {
    if (list.includes(value)) setList(list.filter((entry) => entry !== value))
    else if (list.length < max) setList([...list, value])
  }

  const setExtra = (code: string, next: number) =>
    setExtras((current) => ({ ...current, [code]: Math.min(MAX_ITEM_QUANTITY, Math.max(0, next)) }))

  const handleAdd = () => {
    const parts: string[] = []
    if (removed.length > 0) parts.push(`Sans ${removed.map((item) => item.toLowerCase()).join(', ')}`)
    if (sauces.length > 0) parts.push(`Sauce : ${sauces.join(', ')}`)
    if (remark.trim()) parts.push(remark.trim())
    onAddToCart(product, quantity, parts.join(' · ') || undefined)
    for (const item of accompaniments) {
      const count = extras[item.code] ?? 0
      if (count > 0) onAddToCart(item, count)
    }
    setJustAdded(true)
    window.setTimeout(onClose, 450)
  }

  const hasChoices = Boolean(options) || accompaniments.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center md:items-center md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-black/75"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative z-10 flex h-dvh w-full flex-col overflow-hidden bg-zinc-950 text-left md:h-[min(88vh,640px)] md:max-w-4xl md:flex-row md:rounded-2xl md:border md:border-white/10"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Fermer la fiche du plat"
          className="absolute right-3 top-3 z-20 grid size-11 cursor-pointer place-items-center rounded-full bg-[#0c0c0d]/70 text-[#ffffff] transition-colors hover:bg-[#0c0c0d]/90"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        {/* Photo : colonne de gauche sur grand écran, moitié de la fenêtre */}
        <div className="relative hidden bg-zinc-900 md:block md:w-1/2 md:shrink-0">
          <img src={image} alt={product.name} className="absolute inset-0 size-full object-cover" />
        </div>

        {/* Colonne de droite : contenu défilant + barre du bas fixe */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {/* Photo pleine largeur sur téléphone */}
            <img src={image} alt={product.name} className="aspect-16/10 w-full bg-zinc-900 object-cover md:hidden" />

            <div className="space-y-5 p-5 md:p-8">
              <div>
                {/* Marge à droite : le titre ne passe jamais sous la croix de fermeture */}
                <h2 id={titleId} className="pr-12 font-display text-2xl font-bold leading-tight text-white md:text-3xl">
                  {product.name}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-baseline rounded-full bg-bmc-gold px-4 py-1.5 font-display text-xl font-bold tabular-nums text-black md:text-2xl">
                    {formatPrice(product.price)}
                  </span>
                  {product.category_name && (
                    <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-zinc-300">
                      {product.category_name}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-zinc-300 md:text-base">{product.description}</p>
              </div>

              {hasChoices && (
                <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                  {options && options.removable.length > 0 && (
                    <Disclosure
                      title="Sans…"
                      summary={removed.length > 0 ? removed.join(', ').toLowerCase() : 'Rien à retirer'}
                    >
                      <div className="flex flex-wrap gap-2">
                        {options.removable.map((item) => {
                          const active = removed.includes(item)
                          return (
                            <button
                              key={item}
                              type="button"
                              aria-pressed={active}
                              onClick={() => toggle(removed, item, setRemoved)}
                              className={`${chipBase} ${
                                active
                                  ? 'border-red-500/60 bg-red-500/10 text-red-400'
                                  : 'border-white/15 text-zinc-200 hover:border-white/35'
                              }`}
                            >
                              {active && <X className="size-3.5" aria-hidden="true" />}
                              <span className={active ? 'line-through' : ''}>{item}</span>
                            </button>
                          )
                        })}
                      </div>
                    </Disclosure>
                  )}

                  {options && options.sauces.length > 0 && (
                    <Disclosure
                      title="Sauce"
                      summary={sauces.length > 0 ? sauces.join(', ') : `${options.maxSauces} au choix, incluse${options.maxSauces > 1 ? 's' : ''}`}
                    >
                      <div className="flex flex-wrap gap-2">
                        {options.sauces.map((item) => {
                          const active = sauces.includes(item)
                          const locked = !active && sauces.length >= options.maxSauces
                          return (
                            <button
                              key={item}
                              type="button"
                              aria-pressed={active}
                              disabled={locked}
                              onClick={() => toggle(sauces, item, setSauces, options.maxSauces)}
                              className={`${chipBase} disabled:cursor-not-allowed disabled:opacity-35 ${
                                active
                                  ? 'border-bmc-gold bg-bmc-gold/10 text-bmc-gold'
                                  : 'border-white/15 text-zinc-200 hover:border-white/35'
                              }`}
                            >
                              {active && <Check className="size-3.5" aria-hidden="true" />}
                              {item}
                            </button>
                          )
                        })}
                      </div>
                    </Disclosure>
                  )}

                  {accompaniments.length > 0 && (
                    <Disclosure
                      title="Accompagnements"
                      defaultOpen
                      summary={extrasCount > 0 ? `${extrasCount} ajouté${extrasCount > 1 ? 's' : ''} · + ${formatPrice(extrasTotal)}` : 'Boissons, frites…'}
                    >
                      <ul className="divide-y divide-white/10">
                        {visibleExtras.map((item) => {
                          const count = extras[item.code] ?? 0
                          return (
                            <li key={item.code} className="flex items-center gap-3 py-2.5">
                              <img
                                src={getProductImageUrl(item) || item.image_url}
                                alt=""
                                width={44}
                                height={44}
                                loading="lazy"
                                className="size-11 shrink-0 rounded-lg bg-zinc-950 object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-white">{item.name}</p>
                                <p className="text-sm tabular-nums text-bmc-gold">+ {formatPrice(item.price)}</p>
                              </div>
                              <div className="flex items-center gap-1" role="group" aria-label={`Quantité de ${item.name}`}>
                                {count > 0 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setExtra(item.code, count - 1)}
                                      aria-label={`Retirer ${item.name}`}
                                      className={stepButton}
                                    >
                                      <Minus className="size-4" aria-hidden="true" />
                                    </button>
                                    <span className="w-6 text-center font-display font-bold tabular-nums text-white">{count}</span>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setExtra(item.code, count + 1)}
                                  aria-label={`Ajouter ${item.name}`}
                                  className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-bmc-gold text-black transition-colors hover:bg-amber-400"
                                >
                                  <Plus className="size-4" aria-hidden="true" />
                                </button>
                              </div>
                            </li>
                          )
                        })}
                      </ul>

                      {accompaniments.length > VISIBLE_EXTRAS && (
                        <button
                          type="button"
                          onClick={() => setShowAllExtras((value) => !value)}
                          aria-expanded={showAllExtras}
                          className="mt-1 inline-flex h-11 cursor-pointer items-center gap-1.5 text-sm font-medium text-bmc-gold transition-colors hover:text-white"
                        >
                          {showAllExtras ? 'Voir moins' : `Voir plus (${hiddenCount})`}
                          <ChevronDown className={`size-4 transition-transform ${showAllExtras ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </button>
                      )}
                    </Disclosure>
                  )}

                  {options && (
                    <Disclosure title="Précision" summary={remark.trim() ? remark.trim() : 'Pour la cuisine'}>
                      <label htmlFor={`${titleId}-remark`} className="sr-only">
                        Une précision pour la cuisine
                      </label>
                      <textarea
                        id={`${titleId}-remark`}
                        rows={2}
                        maxLength={140}
                        value={remark}
                        onChange={(event) => {
                          setRemark(event.target.value)
                          setShowRemark(true)
                        }}
                        placeholder="Ex. bien cuit, sans piment…"
                        className="w-full resize-none rounded-lg border border-white/10 bg-zinc-950 px-3.5 py-3 text-base text-white placeholder-zinc-500 outline-none transition-colors focus:border-bmc-gold md:text-sm"
                      />
                      {showRemark && null}
                    </Disclosure>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Barre du bas : toujours visible */}
          <div className="flex items-center gap-3 border-t border-white/10 bg-zinc-950 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8">
            <div className="flex items-center gap-1" role="group" aria-label="Quantité">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={quantity <= 1}
                aria-label="Diminuer la quantité"
                className={stepButton}
              >
                <Minus className="size-4" aria-hidden="true" />
              </button>
              <span className="w-8 text-center font-display text-lg font-bold tabular-nums text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(MAX_ITEM_QUANTITY, value + 1))}
                disabled={quantity >= MAX_ITEM_QUANTITY}
                aria-label="Augmenter la quantité"
                className={stepButton}
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!product.is_available || justAdded}
              className={`inline-flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed sm:text-base ${
                justAdded ? 'bg-bmc-success text-white' : 'bg-bmc-gold text-black hover:bg-amber-400 disabled:opacity-40'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="size-5" aria-hidden="true" /> Ajouté
                </>
              ) : product.is_available ? (
                <>
                  Ajouter <span className="tabular-nums">· {formatPrice(total)}</span>
                </>
              ) : (
                'Indisponible'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
