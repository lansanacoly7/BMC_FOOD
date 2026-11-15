import { FALLBACK_PRODUCTS } from '../../data/mockMenu'
import { isAddOnOnly, normalize } from '../../data/productOptions'
import type { Product } from '../../types'

/**
 * Famille d'un plat pour les rondelles de l'accueil.
 * On se fie au nom de la catégorie et au code du plat, jamais au numéro de catégorie :
 * ce numéro change d'une base à l'autre (menu de secours, base locale, production).
 */
function matchesFamily(product: Product, family: string): boolean {
  const category = normalize(product.category_name)
  const code = product.code.toLowerCase()
  switch (family) {
    case 'all':
      return true
    case 'tacos-panes':
      return category.includes('pane') || /^(tp|tjp|trp|thp|txl)-/.test(code)
    case 'burgers':
      return category.includes('burger') || code.startsWith('bg-')
    case 'tacos-simples':
      return category.includes('simple') || code.startsWith('ts-')
    case 'boissons':
      return category.includes('boisson') || code.startsWith('bv-')
    case 'sauces':
      return category.includes('sauce')
    case 'poulet-finger-food':
      return category.includes('poulet') || category.includes('finger')
    default:
      return false
  }
}
import { ProductCard } from '../menu/ProductCard'

const CATALOG_PRODUCTS: Product[] = [
  // LIGNE 1 : Les 4 Tacos Panés signatures (Maimouna Sall)
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
]

interface FeaturedGridProps {
  products?: Product[]
  isLoading?: boolean
  onAddToCart: (product: Product) => void
  activeCategory: string
  searchQuery?: string
  onSeeAll?: () => void
  onSelectProduct?: (product: Product) => void
}

/**
 * Section « Les plus commandés » & grille du menu.
 * Spécifications validées par Maimouna Sall :
 * - Mobile : 2 colonnes x 2 lignes (les 4 Tacos Panés) -> Bannière Promo Pleine Largeur (w-full) -> Reste des cartes
 * - Desktop : 4 colonnes x 2 lignes (8 cartes : Tacos Panés + Burgers & Tenders) -> Bannière Promo Pleine Largeur (w-full) -> Reste des cartes
 */
export function FeaturedGrid({
  products = CATALOG_PRODUCTS,
  isLoading = false,
  onAddToCart,
  activeCategory,
  searchQuery = '',
  onSeeAll,
  onSelectProduct,
}: FeaturedGridProps) {
  const source = products.length > 0 ? products : CATALOG_PRODUCTS
  // Si la base ne contient pas encore de boissons, on montre les canettes BMC du menu de secours (comme la page Menu).
  const withDrinks = source.some((p) => matchesFamily(p, 'boissons'))
    ? source
    : [...source, ...FALLBACK_PRODUCTS.filter((p) => matchesFamily(p, 'boissons'))]
  const productList = withDrinks.filter((product) => !isAddOnOnly(product))

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
    const matchCategory = matchesFamily(product, activeCategory)

    const matchSearch =
      !searchQuery.trim() ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchCategory && matchSearch
  })

  // Les plus commandés : plats marqués « populaire », sinon les premiers de la carte (sans boissons en vue complète)
  const mainDishes = isDefaultView ? filtered.filter((product) => !matchesFamily(product, 'boissons')) : filtered
  const popularProducts = mainDishes.filter((product) => product.popular)
  const featured = (popularProducts.length >= 4 ? popularProducts : mainDishes).slice(0, 8)

  const wrapper = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'

  return (
    <section aria-label="Les plus commandés" className="space-y-10 sm:space-y-12">
      {isLoading ? (
        <div className={wrapper}>
          <Rail>
            {Array.from({ length: 4 }).map((_, index) => (
              <RailItem key={index}>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
                  <div className="aspect-4/3 w-full animate-pulse bg-zinc-800" />
                  <div className="space-y-2 p-3.5">
                    <div className="h-4 w-3/4 animate-pulse rounded-md bg-zinc-800" />
                    <div className="h-3 w-full animate-pulse rounded-md bg-zinc-800" />
                    <div className="flex items-center justify-between pt-2">
                      <div className="h-5 w-16 animate-pulse rounded-md bg-zinc-800" />
                      <div className="size-11 animate-pulse rounded-full bg-zinc-800" />
                    </div>
                  </div>
                </div>
              </RailItem>
            ))}
          </Rail>
        </div>
      ) : filtered.length === 0 ? (
        <div className={wrapper}>
          <div className="rounded-xl border border-dashed border-white/20 bg-zinc-900 p-8 text-center">
            <p className="text-sm font-semibold text-zinc-200">Aucun plat trouvé pour votre recherche.</p>
            <p className="mt-1 text-sm text-zinc-400">Essayez un autre mot-clé ou réinitialisez le filtre.</p>
          </div>
        </div>
      ) : isDefaultView ? (
        <>
          <div className={wrapper}>
            <SectionHeader title="Les plus commandés" actionLabel="Toute la carte" onAction={onSeeAll} />
            <Rail>
              {featured.map((product) => (
                <RailItem key={product.code}>
                  <ProductCard product={product} onAdd={onAddToCart} onSelect={onSelectProduct} />
                </RailItem>
              ))}
            </Rail>
          </div>
        </>
      ) : (
        <div className={wrapper}>
          <SectionHeader title={searchQuery.trim() ? 'Résultats' : 'La carte'} actionLabel="Toute la carte" onAction={onSeeAll} />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.code} product={product} onAdd={onAddToCart} onSelect={onSelectProduct} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

/** Titre de section avec lien d'action à droite. */
function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
      {onAction && actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex h-10 shrink-0 cursor-pointer items-center text-sm font-medium text-bmc-gold hover:text-white"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

/**
 * Rangée de cartes : sur téléphone, défilement horizontal avec accroche (on voit la carte suivante dépasser,
 * ce qui invite à glisser) ; dès la tablette, grille.
 */
function Rail({ children }: { children: React.ReactNode }) {
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-4">
      {children}
    </ul>
  )
}

function RailItem({ children }: { children: React.ReactNode }) {
  return <li className="w-[46%] shrink-0 snap-start sm:w-auto">{children}</li>
}
