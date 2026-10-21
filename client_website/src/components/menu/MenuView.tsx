import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, UtensilsCrossed } from 'lucide-react'
import type { Product } from '../../types'
import { useMenu } from '../../hooks/useMenu'
import { CategoryNav } from './CategoryNav'
import { ProductCard } from './ProductCard'
import { Skeleton } from '../ui/Loader'
import { ErrorMessage } from '../ui/ErrorMessage'
import { EmptyState } from '../ui/EmptyState'

export interface MenuViewProps {
  onAddToCart: (product: Product) => void
}

export function MenuView({ onAddToCart }: MenuViewProps) {
  const { categories, items, isLoading, error, refetch } = useMenu()
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filtrage combiné par catégorie et par recherche texte
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

  return (
    <section aria-labelledby="menu-heading" className="w-full flex flex-col gap-6">
      {/* En-tête de section avec titre et barre de recherche */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="menu-heading" className="font-display text-2xl font-extrabold text-zinc-950 sm:text-3xl text-left">
            La Carte & Spécialités
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 text-left">
            Tacos panés signatures, burgers gourmets & saveurs authentiques.
          </p>
        </div>

        {/* Champ de recherche rapide */}
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un plat..."
            aria-label="Rechercher un plat du menu"
            className="w-full rounded-full border border-zinc-200 bg-white py-2 pl-9.5 pr-4 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-bmc-orange-braise focus:outline-none focus:ring-2 focus:ring-bmc-orange-braise/20 shadow-xs"
          />
        </div>
      </div>

      {/* Barre de navigation tactile par catégories */}
      <CategoryNav
        categories={categories}
        activeCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      {/* État de chargement : Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-3 rounded-2xl bg-white p-3.5 border border-zinc-100 shadow-xs">
              <Skeleton className="aspect-4/3 w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="size-10 rounded-xl" />
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

      {/* État vide si aucun produit ne correspond à la recherche */}
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

      {/* Grille responsive des produits */}
      {!isLoading && !error && filteredProducts.length > 0 && (
        <motion.div
          layout
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={onAddToCart}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  )
}
