import { useState } from 'react'
import { CartDrawer } from './components/cart/CartDrawer'
import { DailySpecialBanner } from './components/client/DailySpecialBanner'
import { TopHeader } from './components/home/TopHeader'
import { HeroCinematic } from './components/home/HeroCinematic'
import { CategoryPills } from './components/home/CategoryPills'
import { FeaturedGrid } from './components/home/FeaturedGrid'
import { StickyCartBar } from './components/home/StickyCartBar'
import { FloatingCartButton } from './components/home/FloatingCartButton'
import { NavMenuDrawer } from './components/home/NavMenuDrawer'
import { Footer } from './components/home/Footer'
import { CulinaryVideoShowcase } from './components/home/CulinaryVideoShowcase'
import { MenuView } from './components/menu/MenuView'
import { useDailySpecials } from './hooks/useDailySpecials'
import { useMenu } from './hooks/useMenu'
import type { CartItem, Product } from './types'

export default function App() {
  const [items, setItems] = useState<CartItem[]>([])
  const [currentPage, setCurrentPage] = useState<'home' | 'menu'>('home')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery] = useState('')

  // Hooks de données officiels BMC Food (avec support fallback)
  const { specials, isLoading: isSpecialsLoading } = useDailySpecials()
  const { items: menuProducts, isLoading: isMenuLoading } = useMenu()
  const hasDailySpecial = specials.length > 0

  const itemCount = items.reduce((count, item) => count + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const handleNavigate = (page: 'home' | 'menu') => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSelectDailySpecial = () => {
    setCurrentPage('home')
    setTimeout(() => {
      document.getElementById('daily-special-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSelectOffers = () => {
    setCurrentPage('home')
    setTimeout(() => {
      document.getElementById('special-offers-grid')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

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
    <div className="min-h-dvh bg-zinc-950 text-zinc-100 selection:bg-bmc-gold selection:text-black flex flex-col justify-between">
      {/* 
        1. EN-TÊTE OFFICIEL BMC FOOD AVEC NAVIGATION ACCUEIL / PLAT DU JOUR OU BEST-SELLERS / MENU / OFFRES
      */}
      <TopHeader
        currentPage={currentPage}
        cartItemCount={itemCount}
        hasDailySpecial={hasDailySpecial}
        onNavigate={handleNavigate}
        onSelectDailySpecial={handleSelectDailySpecial}
        onSelectOffers={handleSelectOffers}
        onOpenCart={() => setIsCartOpen(true)}
        onToggleMenu={() => setIsNavMenuOpen(true)}
        onSelectCategory={setActiveCategory}
      />

      {/* Tiroir latéral de navigation & informations (accessible via hamburger) */}
      <NavMenuDrawer
        isOpen={isNavMenuOpen}
        currentPage={currentPage}
        hasDailySpecial={hasDailySpecial}
        onClose={() => setIsNavMenuOpen(false)}
        onNavigate={handleNavigate}
        onSelectDailySpecial={handleSelectDailySpecial}
        onSelectOffers={handleSelectOffers}
        onSelectCategory={setActiveCategory}
      />

      {/* 
        AFFICHAGE CONDITIONNEL : PAGE D'ACCUEIL (Home) vs PAGE MENU (El Hadji)
      */}
      {currentPage === 'home' ? (
        <>
          {/* Hero cinématique avec bouton Explorer le Menu qui bascule vers le Menu */}
          <HeroCinematic
            onExploreMenu={() => handleNavigate('menu')}
          />

          {/* Bandeau hybride Plat du Jour & Best-Sellers */}
          <DailySpecialBanner
            specials={specials}
            fallbackProducts={menuProducts}
            isLoading={isSpecialsLoading}
            onAdd={addToCart}
          />

          {/* Grille d'accueil avec Catégories et Offres Spéciales */}
          <main id="menu-section" className="space-y-8 pt-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <CategoryPills
                activeId={activeCategory}
                onSelect={(catId) => {
                  setActiveCategory(catId)
                  if (catId !== 'all') {
                    handleNavigate('menu')
                  }
                }}
              />
            </div>

            <FeaturedGrid
              products={menuProducts}
              isLoading={isMenuLoading}
              activeCategory={activeCategory}
              searchQuery={searchQuery}
              onAddToCart={addToCart}
              onSeeAll={() => handleNavigate('menu')}
            />
          </main>

          {/* Capsule Vidéo Culinaire Immersive (« L'Art du Tacos Pané » - Étape 3 Benchmark) */}
          <CulinaryVideoShowcase onExploreMenu={() => handleNavigate('menu')} />
        </>
      ) : (
        /* PAGE MENU COMPLÈTE RÉALISÉE PAR EL HADJI */
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-h-[65vh]">
          <MenuView onAddToCart={addToCart} />
        </main>
      )}

      {/* 
        6. BARRE PANIER FLOTTANTE (« Pensé pour le pouce »)
      */}
      <StickyCartBar
        itemCount={itemCount}
        totalAmount={totalAmount}
        onOpenCart={() => setIsCartOpen(true)}
        isVisible={!isCartOpen}
      />

      {/* 6.bis BULLE PANIER FLOTTANTE EN BAS À DROITE */}
      <FloatingCartButton
        itemCount={itemCount}
        totalAmount={totalAmount}
        onOpenCart={() => setIsCartOpen(true)}
        isVisible={!isCartOpen}
      />

      {/* 7. TIROIR PANIER COULISSANT */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={() => setIsCartOpen(false)}
        onClearCart={() => {
          setItems([])
          setIsCartOpen(false)
        }}
      />

      {/* Footer Institutionnel BMC Food Dakar */}
      <Footer
        onExploreMenu={() => handleNavigate('menu')}
      />
    </div>
  )
}
