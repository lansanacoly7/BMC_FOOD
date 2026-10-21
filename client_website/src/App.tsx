import { useState } from 'react'
import { CartDrawer } from './components/cart/CartDrawer'
import { DailySpecialBanner } from './components/client/DailySpecialBanner'
import { TopHeader } from './components/home/TopHeader'
import { HeroSearch } from './components/home/HeroSearch'
import { CategoryPills } from './components/home/CategoryPills'
import { FeaturedGrid } from './components/home/FeaturedGrid'
import { StickyCartBar } from './components/home/StickyCartBar'
import { NavMenuDrawer } from './components/home/NavMenuDrawer'
import { useDailySpecials } from './hooks/useDailySpecials'
import { useMenu } from './hooks/useMenu'
import type { CartItem, Product } from './types'

export default function App() {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Hooks de données officiels BMC Food (avec support fallback)
  const { specials, isLoading: isSpecialsLoading } = useDailySpecials()
  const { items: menuProducts, isLoading: isMenuLoading } = useMenu()

  const itemCount = items.reduce((count, item) => count + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const addToCart = (product: Product) => {
    setItems((current) =>
      current.some((item) => item.product.code === product.code)
        ? current.map((item) =>
            item.product.code === product.code
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...current, { product, quantity: 1 }]
    )
  }

  const updateQuantity = (code: string, quantity: number) => {
    setItems((current) =>
      current.map((item) =>
        item.product.code === code ? { ...item, quantity } : item
      )
    )
  }

  const removeFromCart = (code: string) => {
    setItems((current) => current.filter((item) => item.product.code !== code))
  }

  return (
    <div className="min-h-dvh bg-bmc-offwhite text-bmc-charcoal pb-28">
      {/* 
        1. EN-TÊTE NOIR ET LOGO (Page 11 de la charte graphique, Point 1)
        Menu hamburger à gauche, logo BMC Food centré, panier avec pastille braise à droite.
      */}
      <TopHeader
        cartItemCount={itemCount}
        onOpenCart={() => setIsCartOpen(true)}
        onToggleMenu={() => setIsNavMenuOpen(true)}
      />

      {/* Tiroir latéral de navigation & informations (accessible via hamburger) */}
      <NavMenuDrawer
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        onSelectCategory={setActiveCategory}
      />

      {/* 
        2. ACCUEIL ET RECHERCHE DANS LE HERO SOMBRE (Page 11, Point 2)
        Salutation contextuelle dynamique, barre de recherche et horaires d'ouverture.
      */}
      <HeroSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 
        3. PLAT DU JOUR EN HÉROS (Page 11, Point 3 & Page 10 Format 1)
        Positionné STRICTEMENT après le hero d'accueil.
        Si aucun plat du jour n'est actif, le composant retourne null sans laisser de vide.
      */}
      <DailySpecialBanner
        specials={specials}
        isLoading={isSpecialsLoading}
        onAdd={addToCart}
      />

      {/* 
        ZONE DE CONTENU CLAIRE (Page 11, Points 4 & 5)
      */}
      <main className="mx-auto max-w-lg space-y-6 px-4 pt-5 sm:px-6">
        {/* 4. CATÉGORIES EN VIGNETTES PHOTO (Page 11, Point 4) */}
        <CategoryPills
          activeId={activeCategory}
          onSelect={setActiveCategory}
        />

        {/* 5. LES PLUS COMMANDÉS — GRILLE DU MENU (Page 11, Point 5 & Page 9 Carte Classique A) */}
        <FeaturedGrid
          products={menuProducts}
          isLoading={isMenuLoading}
          activeCategory={activeCategory}
          searchQuery={searchQuery}
          onAddToCart={addToCart}
          onSeeAll={() => setActiveCategory('all')}
        />
      </main>

      {/* 
        6. BARRE PANIER FLOTTANTE (« Pensé pour le pouce », Page 11, Point 6)
      */}
      <StickyCartBar
        itemCount={itemCount}
        totalAmount={totalAmount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* 7. TIROIR PANIER COULISSANT */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={() => setIsCartOpen(false)}
      />

      {/* Footer Institutionnel BMC Food Dakar */}
      <footer className="mt-16 border-t border-zinc-200/80 bg-white py-10 text-center text-xs text-zinc-500">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3 text-left">
            <img
              src="/images/brand/logo.png"
              alt="BMC Food"
              className="h-8 w-auto object-contain"
              width={80}
              height={32}
            />
            <div>
              <p className="font-display text-sm font-bold text-zinc-900">BMC FOOD Dakar</p>
              <p className="text-[11px] text-zinc-400">Tacos panés & Saveurs généreuses · 11h – 02h</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
            <span className="rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-700">Espèces</span>
            <span className="rounded-md bg-[#1DC8F2]/15 px-2 py-1 font-semibold text-[#0284C7]">Wave</span>
            <span className="rounded-md bg-[#FF7900]/15 px-2 py-1 font-semibold text-[#C2410C]">Orange Money</span>
          </div>
        </div>

        <div className="mt-6 border-t border-zinc-100 pt-4 text-[11px] text-zinc-400">
          <p>© {new Date().getFullYear()} BMC FOOD · Teranga Labs. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
