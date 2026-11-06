import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Flame, UtensilsCrossed } from 'lucide-react'
import type { Product } from '../../types'
import { useMenu } from '../../hooks/useMenu'
import { CategoryNav } from './CategoryNav'
import { ProductCard } from './ProductCard'
import { ProductCarousel } from './ProductCarousel'
import { ProductDetailModal } from './ProductDetailModal'
import { Skeleton } from '../ui/Loader'
import { ErrorMessage } from '../ui/ErrorMessage'
import { EmptyState } from '../ui/EmptyState'
import { FALLBACK_PRODUCTS, FALLBACK_CATEGORIES } from '../../data/mockMenu'
import { isAddOnCategory, isAddOnOnly } from '../../data/productOptions'

export interface MenuViewProps {
  onAddToCart: (product: Product, quantity?: number, note?: string) => void
}

/** Une boisson (catégorie « Boissons » ou code bv-…) : elle n'apparaît que dans la section Boissons. */
const isDrink = (p: Product) => Boolean(p.category_name?.toLowerCase().includes('boisson') || p.code.toLowerCase().startsWith('bv'))

export function MenuView({ onAddToCart }: MenuViewProps) {
  const { categories, items, isLoading, error, refetch } = useMenu()
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Catégories de navigation : s'assure que "Boissons" existe toujours dans le ruban
  const navCategories = useMemo<import('../../types').Category[]>(() => {
    const list: import('../../types').Category[] = categories.length > 0 ? [...categories] : [...FALLBACK_CATEGORIES]
    const hasDrinks = list.some(
      (c) => c.slug?.includes('boisson') || c.name?.toLowerCase().includes('boisson'),
    )
    if (!hasDrinks) {
      list.push({ id: 50, name: 'Boissons', slug: 'boissons', icon: 'Coffee' })
    }
    return list.filter((c) => !isAddOnCategory(c))
  }, [categories])

  // Catalogue complet : garantit que les 4 canettes BMC et sauces sont présentes
  const allItems = useMemo(() => {
    const hasDrinks = items.some(
      (p) =>
        p.category_name?.toLowerCase().includes('boisson') ||
        p.code.toLowerCase().startsWith('bv'),
    )
    const extras: Product[] = []
    if (!hasDrinks) {
      extras.push(...FALLBACK_PRODUCTS.filter((p) => p.code.startsWith('bv')))
    }
    return extras.length > 0 ? [...items, ...extras] : items
  }, [items])

  // Plats affichés dans les sections : ni sauces ni accompagnements (ils n'apparaissent que dans la fiche d'un plat)
  const menuItems = useMemo(() => allItems.filter((p) => !isAddOnOnly(p)), [allItems])

  // Filtrage par catégorie (la recherche se fait par la loupe de l'en-tête)
  const filteredProducts = useMemo(() => {
    return menuItems.filter((product) => {
      const isBoissonsNav = selectedCategoryId === 50
      const matchCategory =
        selectedCategoryId === 'all' ||
        (isBoissonsNav
          ? product.category_name?.toLowerCase().includes('boisson') ||
            product.code.startsWith('bv')
          : product.category === selectedCategoryId)
      return matchCategory
    })
  }, [menuItems, selectedCategoryId])

  // Groupes de produits pour le rendu rythmé alternant Carrousel -> Cartes -> Carrousel -> Cartes
  const popularItems = useMemo(
    () => menuItems.filter((p) => p.popular || p.is_daily_special).slice(0, 6),
    [menuItems],
  )
  const tacosPanesItems = useMemo(
    () =>
      menuItems.filter(
        (p) =>
          p.category_name?.toLowerCase().includes('pané') ||
          p.category === 1 ||
          p.code.startsWith('tp'),
      ),
    [menuItems],
  )
  const drinksItems = useMemo(
    () =>
      menuItems.filter(
        (p) =>
          p.category_name?.toLowerCase().includes('boisson') ||
          p.code.toLowerCase().startsWith('bv'),
      ),
    [menuItems],
  )
  const burgersAndTacosItems = useMemo(
    () =>
      menuItems.filter(
        (p) =>
          !isDrink(p) &&
          (p.category_name?.toLowerCase().includes('burger') ||
            p.category_name?.toLowerCase().includes('simple') ||
            p.category === 6 ||
            p.code.startsWith('bg') ||
            p.code.startsWith('ts') ||
            p.code.startsWith('sw')),
      ),
    [menuItems],
  )

  const isFullCatalogView = selectedCategoryId === 'all'

  return (
    <section aria-labelledby="menu-heading" className="w-full flex flex-col gap-8">
      {/* 1. Carrousel horizontal supérieur "Les Incontournables de Dakar" */}
      {!isLoading && !error && isFullCatalogView && (
        <ProductCarousel
          id="popular"
          title="Les Incontournables de Dakar"
          subtitle="Les recettes les plus commandées ce mois-ci"
          badgeText="★ TOP VENTES"
          products={popularItems}
          onAddToCart={(p) => onAddToCart(p, 1)}
          onSelectProduct={(p) => setSelectedProduct(p)}
        />
      )}

      {/* 2. En-tête de section avec titre blanc éclatant et champ de recherche */}
      <div className="border-t border-zinc-800/80 pt-6">
        <div>
          <h2
            id="menu-heading"
            className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight text-left"
          >
            Toute la Carte BMC
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 text-left">
            Tacos panés, burgers, sauces et boissons.
          </p>
        </div>

      </div>

      {/* 3. Barre de navigation par rondelles (CategoryNav) */}
      <CategoryNav
        categories={navCategories}
        activeCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      {/* 4. État de chargement : Skeletons sombres à 2 colonnes */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2.5 rounded-2xl bg-zinc-900 p-2.5 sm:p-3 border border-zinc-800 shadow-xs">
              <Skeleton className="aspect-4/3 w-full rounded-xl bg-zinc-800" />
              <Skeleton className="h-4 sm:h-5 w-3/4 rounded-md bg-zinc-800" />
              <div className="flex items-center justify-between pt-1 sm:pt-2">
                <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded-md bg-zinc-800" />
                <Skeleton className="size-9 sm:size-11 rounded-full bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* État d'erreur */}
      {!isLoading && error && (
        <ErrorMessage
          title="Impossible de charger le menu"
          message={error}
          onRetry={refetch}
        />
      )}

      {/* État vide si aucun plat ne correspond au filtre */}
      {!isLoading && !error && filteredProducts.length === 0 && (
        <EmptyState
          icon={<UtensilsCrossed className="size-6 text-zinc-400" />}
          title="Aucun plat trouvé"
          description="Aucun plat disponible dans cette catégorie pour le moment."
          actionLabel="Réinitialiser les filtres"
          onAction={() => {
            setSelectedCategoryId('all')
          }}
        />
      )}

      {/* 5. AFFICHAGE RYTHMÉ (Alternance CARTES -> CARROUSEL -> CARTES -> CARROUSEL) */}
      {!isLoading && !error && isFullCatalogView && (
        <div className="flex flex-col gap-10">
          {/* SECTION A (CARTES) : Nos Tacos Panés Croustillants */}
          {tacosPanesItems.length > 0 && (
            <div className="flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-bmc-gold/20 text-bmc-gold">
                    <Flame className="size-4 fill-current" />
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                    Tacos panés
                  </h3>
                </div>
                <span className="text-xs font-semibold text-zinc-400">
                  {tacosPanesItems.length} recettes
                </span>
              </div>

              {/* Grille de cartes : 2 colonnes sur mobile */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {tacosPanesItems.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={(p) => onAddToCart(p, 1)}
                    onSelect={(p) => setSelectedProduct(p)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SECTION C (CARTES) : Burgers Braisés & Tacos Simples */}
          {burgersAndTacosItems.length > 0 && (
            <div className="flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                    Burgers & Tacos Simples
                  </h3>
                </div>
                <span className="text-xs font-semibold text-zinc-400">
                  {burgersAndTacosItems.length} spécialités
                </span>
              </div>

              {/* Grille de cartes : 2 colonnes sur mobile */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {burgersAndTacosItems.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={(p) => onAddToCart(p, 1)}
                    onSelect={(p) => setSelectedProduct(p)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SECTION BOISSONS : une seule fois, tout en bas de la carte */}
          {drinksItems.length > 0 && (
            <div className="flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white">Boissons</h3>
                <span className="text-xs font-semibold text-zinc-400">{drinksItems.length} boissons</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {drinksItems.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={(p) => onAddToCart(p, 1)}
                    onSelect={(p) => setSelectedProduct(p)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. VUE FILTRÉE PAR CATÉGORIE OU PAR RECHERCHE : Grille 2 colonnes dynamique */}
      {!isLoading && !error && !isFullCatalogView && filteredProducts.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategoryId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={(p) => onAddToCart(p, 1)}
                onSelect={(p) => setSelectedProduct(p)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* 7. Modale de détails du plat inspirée de la maquette Gourmet (Screenshot 1) */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(prod, qty, note) => onAddToCart(prod, qty, note)}
        catalog={allItems}
      />
    </section>
  )
}
