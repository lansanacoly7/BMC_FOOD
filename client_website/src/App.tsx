import { useState } from 'react'
import { CartDrawer } from './components/cart/CartDrawer'
import { DailySpecialBanner } from './components/client/DailySpecialBanner'
import { TopHeader } from './components/home/TopHeader'
import { HeroCinematic } from './components/home/HeroCinematic'
import { FeaturedGrid } from './components/home/FeaturedGrid'
import { NavMenuDrawer } from './components/home/NavMenuDrawer'
import { Footer } from './components/home/Footer'
import { CulinaryVideoShowcase } from './components/home/CulinaryVideoShowcase'
import { useDailySpecials } from './hooks/useDailySpecials'
import { useMenu } from './hooks/useMenu'
import type { CartItem, Product } from './types'

export default function App() {
  const [items, setItems] = useState<CartItem[]>([])
  const [currentPage] = useState<'home'>('home')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [hasSpecialOffers] = useState(true)

  // Hooks de données officiels BMC Food (avec support fallback)
  const { specials, isLoading: isSpecialsLoading } = useDailySpecials()
  const { items: menuProducts, isLoading: isMenuLoading } = useMenu()
  const hasDailySpecial = specials.length > 0

  const itemCount = items.reduce((count, item) => count + item.quantity, 0)

  const handleNavigate = (page: 'home' | 'menu') => {
    if (page === 'menu') {
      document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSelectDailySpecial = () => {
    setTimeout(() => {
      document.getElementById('daily-special-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSelectOffers = () => {
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
        hasSpecialOffers={hasSpecialOffers}
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
        hasSpecialOffers={hasSpecialOffers}
        onClose={() => setIsNavMenuOpen(false)}
        onNavigate={handleNavigate}
        onSelectDailySpecial={handleSelectDailySpecial}
        onSelectOffers={handleSelectOffers}
        onSelectCategory={setActiveCategory}
      />

      {/* 
        PAGE D'ACCUEIL OFFICIELLE DARK LUXURY (Scope exclusif de Maimouna Sall)
      */}
      {/* Hero cinématique avec bouton Explorer le Menu */}
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

      {/* Grille d'accueil et Offres Spéciales */}
      <main id="menu-section" className="space-y-8 pt-4">
        <FeaturedGrid
          products={menuProducts}
          isLoading={isMenuLoading}
          activeCategory={activeCategory}
          onAddToCart={addToCart}
          onSeeAll={() => handleNavigate('menu')}
          hasSpecialOffers={hasSpecialOffers}
        />
      </main>

      {/* Capsule Vidéo Culinaire Immersive (« L'Art du Tacos Pané » - Étape 3 Benchmark) */}
      <CulinaryVideoShowcase onExploreMenu={() => handleNavigate('menu')} />

      {/* TIROIR PANIER COULISSANT (Géré par Pape Alioune) */}
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
