import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Minus, Plus, X } from 'lucide-react'
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

/** Nombre d'accompagnements visibles avant « Voir tout ». */
const VISIBLE_EXTRAS = 3

const formatPrice = (value: number) => `${value.toLocaleString('fr-FR')} F`

const stepButton =
  'grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-white/15 text-white transition-colors hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-30'

const chipBase =
  'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors'

const badgeBase = 'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold'

function SectionHeader({
  number,
  title,
  hint,
  required = false,
  rightText,
}: {
  number: number
  title: string
  hint: string
  required?: boolean
  rightText?: string
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-bmc-gold text-xs font-bold text-black">
            {number}
          </span>
          <h3 className="text-sm font-semibold text-white md:text-base">{title}</h3>
          <span
            className={`${badgeBase} ${
              required ? 'bg-bmc-gold/15 text-bmc-gold' : 'bg-white/10 text-zinc-300'
            }`}
          >
            {required ? 'Obligatoire' : 'Facultatif'}
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-400">{hint}</p>
      </div>
      {rightText && (
        <span className="shrink-0 font-display text-sm font-bold tabular-nums text-zinc-300">
          {rightText}
        </span>
      )}
    </div>
  )
}

/**
 * Fiche produit. Grand écran : photo à gauche, informations à droite. Téléphone : photo compacte
 * en haut, puis les choix directement visibles sans liste déroulante, avec la barre du bas fixe.
 */
export function ProductDetailModal({ product, onClose, onAddToCart, catalog = [] }: ProductDetailModalProps) {
  return (
    <AnimatePresence>
      {product && (
        <ModalBody key={product.code} product={product} onClose={onClose} onAddToCart={onAddToCart} catalog={catalog} />
      )}
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
  const remarkRef = useRef<HTMLTextAreaElement>(null)
  const options = useMemo(() => getProductOptions(product), [product])
  const accompaniments = useMemo(() => getAccompaniments(product, catalog), [product, catalog])

  const [quantity, setQuantity] = useState(1)
  const [removed, setRemoved] = useState<string[]>([])
  const [sauces, setSauces] = useState<string[]>([])
  const [noSauce, setNoSauce] = useState(false)
  const [remark, setRemark] = useState('')
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

  const toggleRemoved = (value: string) => {
    setRemoved((current) =>
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value],
    )
  }

  const toggleSauce = (value: string) => {
    if (!options) return
    setNoSauce(false)
    setSauces((current) => {
      if (current.includes(value)) return current.filter((entry) => entry !== value)
      if (current.length < options.maxSauces) return [...current, value]
      // Si la limite est atteinte, le nouveau choix remplace le plus ancien
      return [...current.slice(1), value]
    })
  }

  const selectNoSauce = () => {
    setSauces([])
    setNoSauce((current) => !current)
  }

  const setExtra = (code: string, next: number) =>
    setExtras((current) => ({ ...current, [code]: Math.min(MAX_ITEM_QUANTITY, Math.max(0, next)) }))

  const insertAllergy = () => {
    const prefix = 'Allergie : '
    setRemark((current) => {
      if (current.toLowerCase().startsWith('allergie')) return current
      const next = `${prefix}${current}`.slice(0, 140)
      return next
    })
    window.requestAnimationFrame(() => {
      const el = remarkRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(prefix.length, prefix.length)
    })
  }

  const appendQuickRemark = (snippet: string) => {
    setRemark((current) => {
      const trimmed = current.trim()
      if (!trimmed) return snippet
      if (trimmed.toLowerCase().includes(snippet.toLowerCase())) return current
      return `${trimmed}, ${snippet}`.slice(0, 140)
    })
  }

  const missingRequiredSauce = Boolean(options?.saucesRequired && sauces.length === 0 && !noSauce)

  const handleAdd = () => {
    if (missingRequiredSauce) return
    const parts: string[] = []
    if (removed.length > 0) parts.push(`Sans ${removed.map((item) => item.toLowerCase()).join(', ')}`)
    if (noSauce) parts.push('Sans sauce')
    else if (sauces.length > 0) parts.push(`Sauce : ${sauces.join(', ')}`)
    if (remark.trim()) parts.push(remark.trim())
    onAddToCart(product, quantity, parts.join(' · ') || undefined)
    for (const item of accompaniments) {
      const count = extras[item.code] ?? 0
      if (count > 0) onAddToCart(item, count)
    }
    setJustAdded(true)
    window.setTimeout(onClose, 450)
  }

  const summaryParts: string[] = []
  if (noSauce) summaryParts.push('Sans sauce')
  else if (sauces.length > 0) summaryParts.push(sauces.join(', '))
  if (removed.length > 0) summaryParts.push(`sans ${removed.map((item) => item.toLowerCase()).join(', ')}`)
  if (extrasCount > 0) summaryParts.push(`${extrasCount} accompagnement${extrasCount > 1 ? 's' : ''}`)
  if (remark.trim()) summaryParts.push(remark.trim())
  const summaryLine = summaryParts.join(' · ')

  const showSauces = Boolean(options && options.sauces.length > 0)
  const showRemovable = Boolean(options && options.removable.length > 0)
  const showAccompaniments = accompaniments.length > 0
  const showRemark = Boolean(options)

  // Numérotation dynamique sans trou selon les blocs applicables à la famille du plat
  let nextSection = 0
  const saucesNum = showSauces ? ++nextSection : 0
  const removableNum = showRemovable ? ++nextSection : 0
  const accompanimentsNum = showAccompaniments ? ++nextSection : 0
  const remarkNum = showRemark ? nextSection + 1 : 0

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
        className="relative z-10 flex h-dvh w-full flex-col overflow-hidden bg-zinc-950 text-left md:h-[min(88vh,680px)] md:max-w-4xl md:flex-row md:rounded-2xl md:border md:border-white/10"
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
            {/* Photo compacte sur téléphone (max 40 % de la hauteur d'écran) */}
            <img
              src={image}
              alt={product.name}
              className="max-h-[40dvh] w-full bg-zinc-900 object-cover md:hidden"
            />

            <div className="space-y-6 p-5 md:p-8">
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

              {showSauces && options && (
                <section className="rounded-xl border border-white/10 bg-zinc-900 p-4">
                  <SectionHeader
                    number={saucesNum}
                    title="Tes sauces"
                    hint={options.maxSauces > 1 ? `Choisis jusqu'à ${options.maxSauces} sauces` : 'Choisis 1 sauce'}
                    required={options.saucesRequired}
                    rightText={`${sauces.length}/${options.maxSauces}`}
                  />

                  <div className="flex flex-wrap gap-2">
                    {options.sauces.map((item) => {
                      const active = sauces.includes(item)
                      return (
                        <button
                          key={item}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleSauce(item)}
                          className={`${chipBase} ${
                            active
                              ? 'border-bmc-gold bg-bmc-gold/15 text-bmc-gold'
                              : 'border-white/15 text-zinc-200 hover:border-white/35'
                          }`}
                        >
                          {active && <Check className="size-4 shrink-0" aria-hidden="true" />}
                          {item}
                        </button>
                      )
                    })}

                    {options.saucesRequired && (
                      <button
                        type="button"
                        aria-pressed={noSauce}
                        onClick={selectNoSauce}
                        className={`${chipBase} ${
                          noSauce
                            ? 'border-bmc-gold bg-bmc-gold/15 text-bmc-gold'
                            : 'border-white/15 text-zinc-200 hover:border-white/35'
                        }`}
                      >
                        {noSauce && <Check className="size-4 shrink-0" aria-hidden="true" />}
                        Sans sauce
                      </button>
                    )}
                  </div>

                  {sauces.length >= options.maxSauces && (
                    <p className="mt-2.5 text-xs text-bmc-gold">
                      Maximum atteint : retire une sauce pour en changer
                    </p>
                  )}
                </section>
              )}

              {showRemovable && options && (
                <section className="rounded-xl border border-white/10 bg-zinc-900 p-4">
                  <SectionHeader
                    number={removableNum}
                    title="Tu veux enlever quelque chose ?"
                    hint="Touche un ingrédient pour le retirer"
                  />

                  <div className="flex flex-wrap gap-2">
                    {options.removable.map((item) => {
                      const active = removed.includes(item)
                      return (
                        <button
                          key={item}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleRemoved(item)}
                          className={`${chipBase} ${
                            active
                              ? 'border-red-500/60 bg-red-500/15 text-red-400'
                              : 'border-white/15 text-zinc-200 hover:border-white/35'
                          }`}
                        >
                          {active && <X className="size-4 shrink-0" aria-hidden="true" />}
                          <span className={active ? 'line-through' : ''}>{`Sans ${item.toLowerCase()}`}</span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}

              {showAccompaniments && (
                <section className="rounded-xl border border-white/10 bg-zinc-900 p-4">
                  <SectionHeader
                    number={accompanimentsNum}
                    title="Un petit plus ?"
                    hint="Boissons, frites, desserts"
                  />

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
                            <p className="text-sm font-medium text-white">{item.name}</p>
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
                                <span className="w-6 text-center font-display font-bold tabular-nums text-white">
                                  {count}
                                </span>
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
                      className="mt-2 inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-bmc-gold transition-colors hover:text-white"
                    >
                      {showAllExtras ? 'Voir moins' : `Voir tout (${hiddenCount})`}
                    </button>
                  )}
                </section>
              )}

              {showRemark && (
                <section className="rounded-xl border border-white/10 bg-zinc-900 p-4">
                  <SectionHeader
                    number={remarkNum}
                    title="Une demande ou une allergie ?"
                    hint="Précision transmise directement en cuisine"
                  />

                  <div className="mb-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={insertAllergy}
                      className={`${chipBase} border-white/15 text-zinc-200 hover:border-white/35`}
                    >
                      Allergie
                    </button>
                    <button
                      type="button"
                      onClick={() => appendQuickRemark('Bien cuit')}
                      className={`${chipBase} border-white/15 text-zinc-200 hover:border-white/35`}
                    >
                      Bien cuit
                    </button>
                    <button
                      type="button"
                      onClick={() => appendQuickRemark('Sans piment')}
                      className={`${chipBase} border-white/15 text-zinc-200 hover:border-white/35`}
                    >
                      Sans piment
                    </button>
                  </div>

                  <label htmlFor={`${titleId}-remark`} className="sr-only">
                    Une demande ou une allergie pour la cuisine
                  </label>
                  <textarea
                    ref={remarkRef}
                    id={`${titleId}-remark`}
                    rows={2}
                    maxLength={140}
                    value={remark}
                    onChange={(event) => setRemark(event.target.value)}
                    placeholder="Ex. allergie à l'arachide, bien cuit…"
                    className="w-full resize-none rounded-lg border border-white/10 bg-zinc-950 px-3.5 py-3 text-base text-white placeholder-zinc-500 outline-none transition-colors focus:border-bmc-gold md:text-sm"
                  />
                </section>
              )}
            </div>
          </div>

          {/* Barre du bas : toujours visible */}
          <div className="border-t border-white/10 bg-zinc-950 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8">
            {summaryLine && (
              <p className="mb-2.5 text-xs text-zinc-300">
                {summaryLine}
              </p>
            )}

            <div className="flex items-center gap-3">
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
                <span className="w-8 text-center font-display text-lg font-bold tabular-nums text-white">
                  {quantity}
                </span>
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
                disabled={!product.is_available || justAdded || missingRequiredSauce}
                className={`inline-flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed sm:text-base ${
                  justAdded ? 'bg-bmc-success text-white' : 'bg-bmc-gold text-black hover:bg-amber-400 disabled:opacity-40'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="size-5" aria-hidden="true" /> Ajouté
                  </>
                ) : !product.is_available ? (
                  'Indisponible'
                ) : missingRequiredSauce ? (
                  'Choisis une sauce'
                ) : (
                  <>
                    Ajouter <span className="tabular-nums">· {formatPrice(total)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
