import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Flame, Search, UtensilsCrossed } from 'lucide-react'
import type { Product } from '../../types'
import { useMenu } from '../../hooks/useMenu'
import { CategoryNav } from './CategoryNav'
import { ProductCard } from './ProductCard'
import { ProductCarousel } from './ProductCarousel'
import { ProductDetailModal } from './ProductDetailModal'
import { Skeleton } from '../ui/Loader'
import { ErrorMessage } from '../ui/ErrorMessage'
import { EmptyState } from '../ui/EmptyState'

export interface MenuViewProps {
  onAddToCart: (product: Product, quantity?: number) => void
}

export function MenuView({ onAddToCart }: MenuViewProps) {
  const { categories, items, isLoading, error, refetch } = useMenu()
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Filtrage combiné par catégorie et recherche texte
  const filteredProducts = useMemo(() => {
    return items.filter((product) => {
      const matchCategory =
        selectedCategoryId === 'all' || product.category === selectedCategoryId
      const matchSearch =
        searchQuery.trim() === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())

      return matchCategory && matchSearch
    })
  }, [items, selectedCategoryId, searchQuery])

  // Groupes de produits pour le rendu rythmé alternant Carrousel -> Cartes -> Carrousel -> Cartes
  const popularItems = useMemo(
    () => items.filter((p) => p.popular || p.is_daily_special).slice(0, 6),
    [items],
  )
  const tacosPanesItems = useMemo(
    () => items.filter((p) => p.category === 1),
    [items],
  )
  const drinksItems = useMemo(
    () => items.filter((p) => p.category === 5),
    [items],
  )
  const burgersAndTacosItems = useMemo(
    () => items.filter((p) => p.category === 2 || p.category === 3),
    [items],
  )
  const saucesItems = useMemo(
    () => items.filter((p) => p.category === 4),
    [items],
  )

  const isFullCatalogView = selectedCategoryId === 'all' && searchQuery.trim() === ''

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-zinc-800/80 pt-6">
        <div>
          <h2
            id="menu-heading"
            className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight text-left"
          >
            Toute la Carte BMC
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 text-left">
            Tacos panés signatures, burgers complets, sauces maison & boissons fraîches.
          </p>
        </div>

        {/* Champ de recherche rapide sur fond sombre */}
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un plat..."
            aria-label="Rechercher un plat du menu"
            className="w-full rounded-full border border-zinc-800 bg-zinc-900/90 py-2.5 pl-9.5 pr-4 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:border-bmc-gold focus:outline-none focus:ring-2 focus:ring-bmc-gold/20 shadow-xs"
          />
        </div>
      </div>

      {/* 3. Barre de navigation par rondelles (CategoryNav) */}
      <CategoryNav
        categories={categories}
        activeCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      {/* 4. État de chargement : Skeletons sombres à 2 colonnes */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2.5 rounded-2xl bg-[#121214] p-2.5 sm:p-3 border border-zinc-800 shadow-xs">
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
          description={
            searchQuery
              ? `Aucun plat ne correspond à « ${searchQuery} ». Essayez un autre mot-clé ou réinitialisez la recherche.`
              : 'Aucun plat disponible dans cette catégorie pour le moment.'
          }
          actionLabel="Réinitialiser les filtres"
          onAction={() => {
            setSelectedCategoryId('all')
            setSearchQuery('')
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
                  <h3 className="font-display text-xl sm:text-2xl font-black text-white">
                    Tacos Panés Signatures
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

          {/* SECTION B (CARROUSEL) : Boissons Fraîches & Jus Locaux de la Charte */}
          {drinksItems.length > 0 && (
            <div className="rounded-3xl bg-gradient-to-r from-zinc-900/60 via-[#141417] to-zinc-900/60 p-4 sm:p-6 border border-zinc-800/80 shadow-inner">
              <ProductCarousel
                id="drinks-carousel"
                title="Boissons Fraîches & Jus Locaux"
                subtitle="Canettes Givrées BMC Food : Bissap, Mangue, Bouye & Tamarin"
                badgeText="FRAIS"
                products={drinksItems}
                onAddToCart={(p) => onAddToCart(p, 1)}
                onSelectProduct={(p) => setSelectedProduct(p)}
              />
            </div>
          )}

          {/* SECTION C (CARTES) : Burgers Braisés & Tacos Simples */}
          {burgersAndTacosItems.length > 0 && (
            <div className="flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl sm:text-2xl font-black text-white">
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

          {/* SECTION D (CARROUSEL) : Sauces & Extras Maison */}
          {saucesItems.length > 0 && (
            <ProductCarousel
              id="sauces-carousel"
              title="Sauces & Accompagnements Maison"
              subtitle="Fromagère onctueuse, Samouraï & Algérienne"
              badgeText="MAISON"
              products={saucesItems}
              onAddToCart={(p) => onAddToCart(p, 1)}
              onSelectProduct={(p) => setSelectedProduct(p)}
            />
          )}
        </div>
      )}

      {/* 6. VUE FILTRÉE PAR CATÉGORIE OU PAR RECHERCHE : Grille 2 colonnes dynamique */}
      {!isLoading && !error && !isFullCatalogView && filteredProducts.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedCategoryId}-${searchQuery}`}
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
        onAddToCart={(prod, qty) => onAddToCart(prod, qty)}
      />
    </section>
  )
}
