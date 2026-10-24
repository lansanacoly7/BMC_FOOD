import { useState, type MouseEvent } from 'react'
import { Check, Plus } from 'lucide-react'
import type { Product } from '../../types'

export interface ProductCardProps {
  product: Product
  onAdd: (product: Product) => void
  onSelect?: (product: Product) => void
  /** Texte du badge doré en haut à gauche de la photo. Par défaut « ★ TOP VENTES » pour les plats populaires. */
  badge?: string
  /** Ancien prix, affiché barré au-dessus du prix (offres). */
  originalPrice?: number
}

const formatPrice = (value: number) => `${value.toLocaleString('fr-FR')} F`

/**
 * Carte plat unique du site (accueil, carte, carrousels, offres) : photo 4:3 qui se fond dans la carte,
 * badge doré, nom, description sur une ligne, prix doré et bouton + rond.
 * Seuls le contenu change d'une page à l'autre, jamais le dessin.
 */
export function ProductCard({ product, onAdd, onSelect, badge, originalPrice }: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const label = badge ?? (product.popular ? '★ TOP VENTES' : undefined)

  const handleAddClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (!product.is_available) return
    onAdd(product)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 900)
  }

  return (
    <article
      onClick={() => onSelect?.(product)}
      className={`group relative flex h-full select-none flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-bmc-gold/60 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        onSelect ? 'cursor-pointer' : ''
      }`}
    >
      <div className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden bg-zinc-950">
        {product.image_url && !imgFailed ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900 px-3 text-center text-xs text-zinc-500">
            Photo BMC
          </div>
        )}

        {label && (
          <div className="absolute left-2 top-2 z-10">
            <span className="rounded-md bg-bmc-gold px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-black">
              {label}
            </span>
          </div>
        )}

        {/* Dégradé bas : la photo se fond dans la carte */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent"
        />

        {!product.is_available && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75">
            <span className="rounded-md border border-white/15 bg-zinc-900 px-3 py-1 text-sm font-medium text-white">
              Épuisé
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-3.5 text-left">
        <div>
          <h3 className="line-clamp-1 font-display text-sm font-bold text-white sm:text-base">{product.name}</h3>
          <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-zinc-400 sm:text-sm">{product.description}</p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 pt-1">
          <div className="flex flex-col leading-tight">
            {originalPrice !== undefined && (
              <span className="text-xs tabular-nums text-zinc-500 line-through">{formatPrice(originalPrice)}</span>
            )}
            <span className="font-display text-base font-bold tabular-nums text-bmc-gold sm:text-lg">
              {formatPrice(product.price)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddClick}
            disabled={!product.is_available}
            aria-label={`Ajouter ${product.name} au panier`}
            className={`flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-black transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              justAdded ? 'bg-bmc-success text-white' : 'bg-bmc-gold hover:bg-amber-400'
            }`}
          >
            {justAdded ? <Check className="size-5" /> : <Plus className="size-5 stroke-[2.5]" />}
          </button>
        </div>
      </div>
    </article>
  )
}
