import { Check, Plus, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { formatFcfa } from '../../lib/format'
import type { Product } from '../../types'

export const CATALOG_PRODUCTS: Product[] = [
  {
    id: 1,
    code: 'tp-viande',
    name: 'Tacos Viande Pané',
    category: 1,
    category_name: 'Tacos panés',
    description: 'Viande hachée, frites, sauce fromagère et panure dorée croquante.',
    price: 3500,
    image_url: '/images/products/tacos-viande-pane.webp',
    is_available: true,
    is_daily_special: false,
    popular: true,
  },
  {
    id: 2,
    code: 'bg-complet',
    name: 'Burger BMC Complet',
    category: 2,
    category_name: 'Burgers',
    description: 'Steak pur bœuf, œuf, fromage, salade, tomate et oignons caramélisés.',
    price: 2000,
    image_url: '/images/products/burger-bmc-complet.webp',
    is_available: true,
    is_daily_special: false,
    popular: true,
  },
  {
    id: 3,
    code: 'tp-mixte',
    name: 'Tacos Mixte Pané',
    category: 1,
    category_name: 'Tacos panés',
    description: 'Viande hachée, poulet mariné, frites et sauce fromagère maison.',
    price: 4000,
    image_url: '/images/products/tacos-mixte-pane.webp',
    is_available: true,
    is_daily_special: false,
    popular: true,
  },
  {
    id: 4,
    code: 'tp-cordon-bleu',
    name: 'Tacos Cordon Bleu Pané',
    category: 1,
    category_name: 'Tacos panés',
    description: 'Cordon bleu doré croustillant, fromage fondant et frites.',
    price: 3500,
    image_url: '/images/products/tacos-cordon-bleu-pane.webp',
    is_available: true,
    is_daily_special: false,
    popular: true,
  },
  {
    id: 5,
    code: 'bg-cheese',
    name: 'Burger Cheese Simple',
    category: 2,
    category_name: 'Burgers',
    description: 'Steak bœuf grillé, double cheddar fondant, cornichons et sauce.',
    price: 1500,
    image_url: '/images/products/burger-cheese-simple.webp',
    is_available: true,
    is_daily_special: false,
    popular: false,
  },
  {
    id: 6,
    code: 'bg-crispy',
    name: 'Burger Poulet Crispy',
    category: 2,
    category_name: 'Burgers',
    description: 'Filet de poulet pané extra-croquant, salade fraîche et sauce crémeuse.',
    price: 2000,
    image_url: '/images/products/burger-poulet-crispy.webp',
    is_available: true,
    is_daily_special: false,
    popular: true,
  },
  {
    id: 7,
    code: 'tp-poulet',
    name: 'Tacos Poulet Pané',
    category: 1,
    category_name: 'Tacos panés',
    description: 'Poulet mariné tendre, frites dorées et sauce fromagère.',
    price: 3500,
    image_url: '/images/products/tacos-poulet-pane.webp',
    is_available: true,
    is_daily_special: false,
    popular: true,
  },
  {
    id: 8,
    code: 'ck-wings',
    name: 'Chicken Wings BBQ',
    category: 3,
    category_name: 'Tacos simples',
    description: 'Ailes de poulet laquées à la sauce barbecue maison et dorées.',
    price: 2500,
    image_url: '/images/products/chicken-wings-bbq.webp',
    is_available: true,
    is_daily_special: false,
    popular: false,
  },
]

interface FeaturedGridProps {
  products?: Product[]
  isLoading?: boolean
  onAddToCart: (product: Product) => void
  activeCategory: string
  searchQuery: string
  onSeeAll?: () => void
}

/**
 * Section « Les plus commandés » & Grille du menu (Page 11, Point 5 & Page 9 Carte Classique A).
 * Deux cartes par ligne sur mobile, photo en haut, titre gras, prix Bricolage et bouton + en Or BMC.
 */
export function FeaturedGrid({
  products = CATALOG_PRODUCTS,
  isLoading = false,
  onAddToCart,
  activeCategory,
  searchQuery,
  onSeeAll,
}: FeaturedGridProps) {
  // Source de données : produits passés en props (ex: depuis useMenu) ou fallback catalogue
  const productList = products.length > 0 ? products : CATALOG_PRODUCTS

  // Filtrage combiné catégorie + recherche texte
  const filtered = productList.filter((product) => {
    const categoryName = (product.category_name || '').toLowerCase()
    const matchCategory =
      activeCategory === 'all' ||
      (activeCategory === 'tacos-panes' && (product.category === 1 || categoryName.includes('tacos pané'))) ||
      (activeCategory === 'burgers' && (product.category === 2 || categoryName.includes('burger'))) ||
      (activeCategory === 'tacos-simples' && (product.category === 3 || categoryName.includes('tacos simple'))) ||
      (activeCategory === 'boissons' && (product.category === 7 || categoryName.includes('boisson'))) ||
      (activeCategory === 'sauces' && (product.category === 4 || categoryName.includes('sauce')))

    const matchSearch =
      !searchQuery.trim() ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchCategory && matchSearch
  })

  return (
    <section aria-label="Les plus commandés" className="space-y-4">
      {/* En-tête : Titre à gauche, Tout voir à droite (Page 11, Point 5) */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="font-display text-xl font-extrabold text-bmc-charcoal sm:text-2xl">
          Les plus commandés
        </h2>
        {activeCategory !== 'all' && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-xs font-bold text-bmc-orange-braise transition-colors hover:text-bmc-gold focus:outline-none cursor-pointer"
          >
            Tout voir →
          </button>
        )}
      </div>

      {/* État de chargement : Skeletons à 2 colonnes */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2 rounded-2xl border border-zinc-200/80 bg-white p-3">
              <div className="aspect-4/3 w-full animate-pulse rounded-xl bg-zinc-200" />
              <div className="h-4 w-3/4 animate-pulse rounded-md bg-zinc-200 mt-2" />
              <div className="h-3 w-full animate-pulse rounded-md bg-zinc-100" />
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-100">
                <div className="h-5 w-16 animate-pulse rounded-md bg-zinc-200" />
                <div className="size-9 animate-pulse rounded-xl bg-zinc-200" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {filtered.map((product) => (
            <ClassicProductCard key={product.code} product={product} onAdd={onAddToCart} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center bg-white">
          <p className="text-sm font-semibold text-zinc-600">Aucun plat trouvé pour votre recherche.</p>
          <p className="mt-1 text-xs text-zinc-400">Essayez un autre mot-clé ou réinitialisez le filtre.</p>
        </div>
      )}
    </section>
  )
}

/**
 * Carte Produit Classique (Format A de la charte graphique, Page 9).
 * - Photo appétissante en haut
 * - Nom en gras
 * - Ingrédients / description courte
 * - Prix à gauche en Bricolage Grotesque
 * - Bouton + en Or BMC (#FCB800) à droite
 */
function ClassicProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    onAdd(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <motion.article
      layout
      whileHover={{ y: -3 }}
      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-3 shadow-xs transition-all hover:border-zinc-300 hover:shadow-md sm:p-4"
    >
      <div>
        {/* Photo appétissante en haut (Carte A) */}
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-zinc-100">
          <img
            src={product.image_url}
            alt={product.name}
            width={200}
            height={150}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-106"
          />
          {product.popular && (
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-zinc-950/85 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-bmc-gold backdrop-blur-xs">
              <Star className="size-2.5 fill-bmc-gold text-bmc-gold" />
              Top
            </span>
          )}
        </div>

        {/* Nom du plat en gras & Description */}
        <div className="mt-2.5 space-y-1">
          <h3 className="font-display text-sm font-extrabold text-zinc-900 group-hover:text-bmc-orange-braise transition-colors leading-snug sm:text-base">
            {product.name}
          </h3>
          <p className="line-clamp-2 text-[11px] text-zinc-500 leading-relaxed sm:text-xs">
            {product.description}
          </p>
        </div>
      </div>

      {/* Prix et Bouton + (Carte A) */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-100">
        <span className="font-display text-base font-extrabold tabular-nums text-bmc-charcoal sm:text-lg">
          {formatFcfa(product.price)}
        </span>

        {/* Bouton d'ajout rapide : Or BMC #FCB800, texte charbon */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={handleAdd}
          aria-label={`Ajouter ${product.name} au panier`}
          className={`flex size-9 items-center justify-center rounded-xl font-bold transition-all ${
            added
              ? 'bg-bmc-success text-white shadow-sm'
              : 'bg-bmc-gold text-bmc-charcoal hover:brightness-105 shadow-xs'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {added ? (
              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Check className="size-4" />
              </motion.div>
            ) : (
              <motion.div key="plus" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Plus className="size-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.article>
  )
}
