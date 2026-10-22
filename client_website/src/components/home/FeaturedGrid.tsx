import { Check, Plus, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { formatFcfa } from '../../lib/format'
import type { Product } from '../../types'
import { SpecialOfferBanner } from './SpecialOfferBanner'

const CATALOG_PRODUCTS: Product[] = [
  {
    id: 1,
    code: 'tp-viande',
    name: 'Tacos Viande Pané',
    category: 1,
    category_name: 'Tacos panés',
    description: 'Viande hachée assaisonnée, frites croustillantes, sauce fromagère et panure dorée croquante.',
    price: 3500,
    image_url: '/images/products/tacos-viande-pane.webp',
    is_available: true,
    is_daily_special: false,
    popular: true,
  },
  {
    id: 2,
    code: 'tp-poulet',
    name: 'Tacos Poulet Pané',
    category: 1,
    category_name: 'Tacos panés',
    description: 'Filet de poulet mariné tendre, frites fraîches, sauce blanche gourmet et gratiné doré.',
    price: 3500,
    image_url: '/images/products/tacos-poulet-pane.webp',
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
    description: 'Duo savoureux viande hachée & poulet mariné, frites et sauce fromagère maison.',
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
    description: 'Cordon bleu croustillant émincé, jambon de dinde fumé, fromage fondant et frites.',
    price: 3500,
    image_url: '/images/products/tacos-cordon-bleu-pane.webp',
    is_available: true,
    is_daily_special: false,
    popular: false,
  },

  // LIGNE 2 (Desktop) : Burgers gourmands & Finger Food croustillant
  {
    id: 5,
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
    id: 8,
    code: 'td-poulet',
    name: 'Tenders Poulet Dorés',
    category: 5,
    category_name: 'Poulet & Finger Food',
    description: 'Aiguillettes de poulet marinées, panure croustillante aux épices douces.',
    price: 2500,
    image_url: '/images/products/tenders-poulet.webp',
    is_available: true,
    is_daily_special: false,
    popular: true,
  },

  // RESTE DU CATALOGUE (Affiché après la bannière promo)
  {
    id: 9,
    code: 'ck-wings',
    name: 'Chicken Wings BBQ',
    category: 5,
    category_name: 'Poulet & Finger Food',
    description: 'Ailes de poulet laquées à la sauce barbecue maison et dorées au four.',
    price: 2500,
    image_url: '/images/products/chicken-wings-bbq.webp',
    is_available: true,
    is_daily_special: false,
    popular: false,
  },
  {
    id: 10,
    code: 'fr-maison',
    name: 'Frites Maison Croustillantes',
    category: 6,
    category_name: 'Accompagnements',
    description: 'Portion généreuse de frites fraîches dorées et croustillantes.',
    price: 1000,
    image_url: '/images/products/frites-maison.webp',
    is_available: true,
    is_daily_special: false,
    popular: false,
  },
  {
    id: 11,
    code: 'sc-assortiment',
    name: 'Sauces Assortiment',
    category: 4,
    category_name: 'Sauces',
    description: 'Sauce Algérienne, Samouraï, Fromagère maison, Blanche et Barbecue.',
    price: 500,
    image_url: '/images/products/sauces-assortiment.webp',
    is_available: true,
    is_daily_special: false,
    popular: false,
  },
  {
    id: 12,
    code: 'bb-fraiches',
    name: 'Boissons Fraîches',
    category: 7,
    category_name: 'Boissons',
    description: 'Sélection de sodas 33cl bien frais, jus locaux et eau minérale.',
    price: 800,
    image_url: '/images/products/boissons-fraiches.webp',
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
 * Section « Les plus commandés » & Grille du menu (Univers Dark Luxury).
 * Spécifications validées par Maimouna Sall :
 * - Mobile : 2 colonnes x 2 lignes (les 4 Tacos Panés) -> Bannière Promo Pleine Largeur (w-full) -> Reste des cartes
 * - Desktop : 4 colonnes x 2 lignes (8 cartes : Tacos Panés + Burgers & Tenders) -> Bannière Promo Pleine Largeur (w-full) -> Reste des cartes
 */
export function FeaturedGrid({
  products = CATALOG_PRODUCTS,
  isLoading = false,
  onAddToCart,
  activeCategory,
  searchQuery,
  onSeeAll,
}: FeaturedGridProps) {
  const productList = products.length > 0 ? products : CATALOG_PRODUCTS

  const isDefaultView = activeCategory === 'all' && !searchQuery.trim()

  // Si on est en vue complète sans filtre, s'assurer que les 4 tacos panés sont placés en ligne 1
  const baseList = isDefaultView
    ? [...productList].sort((a, b) => {
        const order = ['tp-viande', 'tp-poulet', 'tp-mixte', 'tp-cordon-bleu', 'tp-1', 'tp-2', 'tp-3', 'tp-4']
        const indexA = order.indexOf(a.code)
        const indexB = order.indexOf(b.code)
        if (indexA !== -1 && indexB !== -1) return indexA - indexB
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        return 0
      })
    : productList

  // Filtrage combiné catégorie + recherche texte
  const filtered = baseList.filter((product) => {
    const categoryName = (product.category_name || '').toLowerCase()
    const matchCategory =
      activeCategory === 'all' ||
      (activeCategory === 'tacos-panes' && (product.category === 1 || categoryName.includes('tacos pané'))) ||
      (activeCategory === 'burgers' && (product.category === 2 || categoryName.includes('burger'))) ||
      (activeCategory === 'tacos-simples' && (product.category === 3 || categoryName.includes('tacos simple'))) ||
      (activeCategory === 'boissons' && (product.category === 7 || categoryName.includes('boisson'))) ||
      (activeCategory === 'sauces' && (product.category === 4 || categoryName.includes('sauce'))) ||
      (activeCategory === 'poulet-finger-food' && (product.category === 5 || categoryName.includes('poulet')))

    const matchSearch =
      !searchQuery.trim() ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchCategory && matchSearch
  })

  // Découpage Mobile : 4 items (2 lignes x 2 colonnes) puis bannière puis reste
  const mobileTop = filtered.slice(0, 4)
  const mobileRest = filtered.slice(4)

  // Découpage Desktop : 8 items (2 lignes x 4 colonnes) puis bannière puis reste
  const desktopTop = filtered.slice(0, 8)
  const desktopRest = filtered.slice(8)

  return (
    <section aria-label="Les plus commandés" className="space-y-6">
      {/* En-tête : Titre à gauche, Tout voir à droite (aligné avec la largeur de grille) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pt-1">
          <h2 className="font-display text-xl font-extrabold text-white sm:text-2xl">
            Les plus commandés
          </h2>
          {activeCategory !== 'all' && (
            <button
              type="button"
              onClick={onSeeAll}
              className="text-xs font-bold text-bmc-gold hover:text-amber-300 transition-colors cursor-pointer"
            >
              Tout voir →
            </button>
          )}
        </div>
      </div>

      {/* État de chargement : Skeletons responsive sombres */}
      {isLoading ? (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-zinc-900/80 p-3">
                <div className="aspect-4/3 w-full animate-pulse rounded-xl bg-zinc-800" />
                <div className="h-4 w-3/4 animate-pulse rounded-md bg-zinc-800 mt-2" />
                <div className="h-3 w-full animate-pulse rounded-md bg-zinc-800/60" />
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="h-5 w-16 animate-pulse rounded-md bg-zinc-800" />
                  <div className="size-9 animate-pulse rounded-xl bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center bg-zinc-900/60 text-zinc-300">
            <p className="text-sm font-semibold text-zinc-200">Aucun plat trouvé pour votre recherche.</p>
            <p className="mt-1 text-xs text-zinc-400">Essayez un autre mot-clé ou réinitialisez le filtre.</p>
          </div>
        </div>
      ) : isDefaultView ? (
        /* VUE CATALOGUE PAR DÉFAUT : Découpage 2 lignes + Bannière Pleine Largeur + Reste */
        <div>
          {/* --- AFFICHAGE MOBILE (< 1024px) --- */}
          <div className="lg:hidden space-y-6">
            {/* Ligne 1 & 2 Mobile : 4 Tacos Panés (2 colonnes x 2 lignes) */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {mobileTop.map((product) => (
                  <ClassicProductCard key={product.code} product={product} onAdd={onAddToCart} />
                ))}
              </div>
            </div>

            {/* Bannière Promotionnelle Pleine Largeur Mobile (w-full sans marges) */}
            <SpecialOfferBanner />

            {/* Reste des cartes Mobile */}
            {mobileRest.length > 0 && (
              <div id="menu-catalog-grid" className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {mobileRest.map((product) => (
                    <ClassicProductCard key={product.code} product={product} onAdd={onAddToCart} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* --- AFFICHAGE DESKTOP (>= 1024px) --- */}
          <div className="hidden lg:block space-y-8">
            {/* Ligne 1 & 2 Desktop : 8 cartes (4 colonnes x 2 lignes : Tacos Panés + Burgers & Tenders) */}
            <div className="mx-auto max-w-7xl px-8">
              <div className="grid grid-cols-4 gap-4">
                {desktopTop.map((product) => (
                  <ClassicProductCard key={product.code} product={product} onAdd={onAddToCart} />
                ))}
              </div>
            </div>

            {/* Bannière Promotionnelle Pleine Largeur Desktop (w-full sans marges) */}
            <SpecialOfferBanner />

            {/* Reste des cartes Desktop */}
            {desktopRest.length > 0 && (
              <div id="menu-catalog-grid-desktop" className="mx-auto max-w-7xl px-8">
                <div className="grid grid-cols-4 gap-4">
                  {desktopRest.map((product) => (
                    <ClassicProductCard key={product.code} product={product} onAdd={onAddToCart} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VUE FILTRÉE PAR CATÉGORIE OU RECHERCHE : Grille continue sans bannière */
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <ClassicProductCard key={product.code} product={product} onAdd={onAddToCart} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

/**
 * Carte Produit Classique (Format Dark Luxury v1.1).
 * - Fond sombre texturé ardoise
 * - Photo appétissante en haut
 * - Nom en blanc éclatant, hover or
 * - Prix à gauche en Or BMC (#FCB800)
 * - Bouton + en Or BMC brossé à droite
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
      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/85 p-3 shadow-lg backdrop-blur-xs transition-all hover:border-bmc-gold/40 hover:shadow-2xl sm:p-4 text-white"
    >
      <div>
        {/* Photo appétissante en haut */}
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-zinc-950 border border-white/5">
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
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/85 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-bmc-gold backdrop-blur-xs border border-bmc-gold/30">
              <Star className="size-2.5 fill-bmc-gold text-bmc-gold" />
              Top
            </span>
          )}
        </div>

        {/* Nom du plat en gras & Description */}
        <div className="mt-2.5 space-y-1">
          <h3 className="font-display text-sm font-extrabold text-white group-hover:text-bmc-gold transition-colors leading-snug sm:text-base">
            {product.name}
          </h3>
          <p className="line-clamp-2 text-[11px] text-zinc-400 leading-relaxed sm:text-xs">
            {product.description}
          </p>
        </div>
      </div>

      {/* Prix et Bouton + */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10">
        <span className="font-display text-base font-extrabold tabular-nums text-bmc-gold sm:text-lg">
          {formatFcfa(product.price)}
        </span>

        {/* Bouton d'ajout rapide : Or BMC */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={handleAdd}
          aria-label={`Ajouter ${product.name} au panier`}
          className={`flex size-9 items-center justify-center rounded-xl font-bold transition-all cursor-pointer ${
            added
              ? 'bg-bmc-success text-white shadow-sm'
              : 'bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 text-black hover:brightness-110 shadow-md'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {added ? (
              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Check className="size-4 text-white" />
              </motion.div>
            ) : (
              <motion.div key="plus" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Plus className="size-4 text-black stroke-[3]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.article>
  )
}
