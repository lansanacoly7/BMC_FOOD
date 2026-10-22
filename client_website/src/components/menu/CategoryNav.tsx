import { Flame, Utensils, Sparkles, Coffee, Soup, Layers } from 'lucide-react'
import type { Category } from '../../types'

export interface CategoryNavProps {
  categories: Category[]
  activeCategoryId: number | 'all'
  onSelectCategory: (id: number | 'all') => void
}

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes('tacos pané') || lower.includes('flame')) return Flame
  if (lower.includes('burger')) return Utensils
  if (lower.includes('sauce')) return Soup
  if (lower.includes('boisson')) return Coffee
  if (lower.includes('poulet') || lower.includes('finger')) return Sparkles
  return Layers
}

export function CategoryNav({
  categories,
  activeCategoryId,
  onSelectCategory,
}: CategoryNavProps) {
  return (
    <nav
      aria-label="Catégories du menu"
      className="scrollbar-none -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0"
    >
      {/* Option "Tous les plats" */}
      <button
        type="button"
        onClick={() => onSelectCategory('all')}
        className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-bmc-gold
          ${
            activeCategoryId === 'all'
              ? 'bg-bmc-charcoal text-white shadow-xs'
              : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
          }`}
      >
        <Layers className="size-3.5" aria-hidden="true" />
        <span>Tous</span>
      </button>

      {/* Liste des catégories réelles */}
      {categories.map((category) => {
        const IconComponent = getCategoryIcon(category.name)
        const isActive = activeCategoryId === category.id

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectCategory(category.id)}
            className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-bmc-gold
              ${
                isActive
                  ? 'bg-bmc-charcoal text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
          >
            <IconComponent
              className={`size-3.5 ${isActive ? 'text-bmc-gold' : 'text-zinc-400'}`}
              aria-hidden="true"
            />
            <span>{category.name}</span>
          </button>
        )
      })}
    </nav>
  )
}
