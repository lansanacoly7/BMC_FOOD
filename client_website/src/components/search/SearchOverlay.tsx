import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, Plus, Search, X } from 'lucide-react'
import { getProductImageUrl } from '../../lib/productImages'
import { isAddOnOnly } from '../../data/productOptions'
import type { Product } from '../../types'

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  onAdd: (product: Product) => void
  /** Ouvre la fiche du plat. */
  onSelect: (product: Product) => void
  onOpenMenu: () => void
}

const MAX_RESULTS = 20

/** Minuscules sans accents : « thé » trouve « the », « pané » trouve « pane ». */
const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

const formatPrice = (value: number) => `${value.toLocaleString('fr-FR')} F`

/**
 * Recherche globale ouverte depuis l'en-tête : plein écran sur téléphone, fenêtre centrée sur grand écran.
 * Sans saisie, propose les plats les plus commandés. Chaque résultat peut être ajouté au panier directement.
 */
export function SearchOverlay({ isOpen, onClose, products: allProducts, onAdd, onSelect, onOpenMenu }: SearchOverlayProps) {
  // Sauces et accompagnements ne se commandent pas seuls : ils n'apparaissent que dans la fiche d'un plat
  const products = useMemo(() => allProducts.filter((product) => !isAddOnOnly(product)), [allProducts])
  const titleId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [addedCode, setAddedCode] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setQuery('')
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 50)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, onClose])

  const trimmed = query.trim()
  const results = useMemo(() => {
    if (trimmed === '') {
      const popular = products.filter((product) => product.popular && product.is_available)
      return (popular.length > 0 ? popular : products).slice(0, 6)
    }
    const needle = normalize(trimmed)
    return products
      .filter((product) => normalize(`${product.name} ${product.description} ${product.category_name ?? ''}`).includes(needle))
      .slice(0, MAX_RESULTS)
  }, [products, trimmed])

  const handleAdd = (product: Product) => {
    onAdd(product)
    setAddedCode(product.code)
    window.setTimeout(() => setAddedCode((current) => (current === product.code ? null : current)), 1200)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-start sm:p-6 sm:pt-[10vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/70"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 flex h-dvh w-full flex-col bg-zinc-950 text-left sm:h-auto sm:max-h-[78vh] sm:max-w-xl sm:overflow-hidden sm:rounded-2xl sm:border sm:border-white/10"
          >
            <h2 id={titleId} className="sr-only">
              Rechercher un plat
            </h2>

            <div className="flex items-center gap-2 border-b border-white/10 p-3 sm:p-4">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tacos, burger, boisson…"
                  aria-label="Rechercher un plat"
                  className="h-12 w-full rounded-full border border-white/10 bg-zinc-900 pl-12 pr-10 text-base text-white placeholder:text-zinc-500 focus:border-bmc-gold focus:outline-none [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      inputRef.current?.focus()
                    }}
                    aria-label="Effacer la recherche"
                    className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-zinc-400 hover:text-white"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-12 shrink-0 cursor-pointer px-3 text-sm font-medium text-zinc-300 hover:text-white"
              >
                Fermer
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
              <p className="mb-2 px-1 text-sm font-medium text-zinc-400">
                {trimmed === '' ? 'Les plus commandés' : `${results.length} résultat${results.length > 1 ? 's' : ''}`}
              </p>

              {results.length === 0 ? (
                <p className="px-1 py-8 text-center text-sm text-zinc-400">
                  Aucun plat ne correspond à « {trimmed} ». Essayez un autre mot.
                </p>
              ) : (
                <ul className="divide-y divide-white/10">
                  {results.map((product) => (
                    <li key={product.code} className="flex items-center gap-3 py-3">
                      <img
                        src={getProductImageUrl(product) || product.image_url}
                        alt=""
                        width={56}
                        height={56}
                        loading="lazy"
                        className="size-14 shrink-0 rounded-lg bg-zinc-900 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onClose()
                          onSelect(product)
                        }}
                        className="min-w-0 flex-1 cursor-pointer text-left transition-opacity hover:opacity-75"
                      >
                        <span className="block truncate font-display text-sm font-bold text-white sm:text-base">{product.name}</span>
                        <span className="block truncate text-xs text-zinc-400 sm:text-sm">{product.description}</span>
                        <span className="mt-0.5 block font-display text-sm font-bold tabular-nums text-bmc-gold">
                          {formatPrice(product.price)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdd(product)}
                        disabled={!product.is_available}
                        aria-label={`Ajouter ${product.name} au panier`}
                        className={`grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-black transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          addedCode === product.code ? 'bg-bmc-success text-white' : 'bg-bmc-gold hover:bg-amber-400'
                        }`}
                      >
                        {addedCode === product.code ? <Check className="size-5" aria-hidden="true" /> : <Plus className="size-5" aria-hidden="true" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-white/10 p-3 sm:p-4">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenMenu()
                }}
                className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/15 text-sm font-semibold text-white transition-colors hover:border-white/30"
              >
                Voir toute la carte
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
