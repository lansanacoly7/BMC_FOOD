import { useState } from 'react'
import { CartDrawer } from './components/cart/CartDrawer'
import { DailySpecialBanner } from './components/client/DailySpecialBanner'
import { TopHeader } from './components/home/TopHeader'
import { HeroCinematic } from './components/home/HeroCinematic'
import { CategoryPills } from './components/home/CategoryPills'
import { FeaturedGrid } from './components/home/FeaturedGrid'
import { StickyCartBar } from './components/home/StickyCartBar'
import { NavMenuDrawer } from './components/home/NavMenuDrawer'
import { Footer } from './components/home/Footer'
import { ProvisionalCheckout } from './components/checkout/ProvisionalCheckout'
import { useDailySpecials } from './hooks/useDailySpecials'
import { useMenu } from './hooks/useMenu'
import { useCart } from './hooks/useCart'

export default function App() {
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const searchQuery = ''
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // Gestion centralisée du panier BMC Food (Pape Aliou)
  const { items, itemCount, subtotal, isCartOpen, openCart, closeCart, addToCart, updateQuantity, removeFromCart, clearCart } = useCart()

  // Hooks de données officiels BMC Food (avec support fallback)
  const { specials, isLoading: isSpecialsLoading } = useDailySpecials()
  const { items: menuProducts, isLoading: isMenuLoading } = useMenu()

  if (isCheckingOut) {
    return (
      <ProvisionalCheckout
        onBack={() => setIsCheckingOut(false)}
        onNewOrder={() => setIsCheckingOut(false)}
      />
    )
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100 pb-28 selection:bg-bmc-gold selection:text-black">
      {/* 
        1. EN-TÊTE NOIR ET LOGO (Page 11 de la charte graphique, Point 1)
        Menu hamburger à gauche, logo BMC Food centré, panier avec pastille braise à droite.
      */}
      <TopHeader
        cartItemCount={itemCount}
        onOpenCart={openCart}
        onToggleMenu={() => setIsNavMenuOpen(true)}
        onSelectCategory={setActiveCategory}
      />

      {/* Tiroir latéral de navigation & informations (accessible via hamburger) */}
      <NavMenuDrawer
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        onSelectCategory={setActiveCategory}
      />

      {/* 
        ÉTAPE 1 : LE HERO CINÉMATIQUE PLEINE LARGEUR SANS CARTE
        Centré sur la signature BMC Food : Le Tacos Pané sur ardoise avec dégradé progressif.
      */}
      <HeroCinematic
        onExploreMenu={() => {
          document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })
        }}
      />

      {/* 
        3. BANDEAU VEDETTE HYBRIDE PLAT DU JOUR & BEST-SELLERS
      */}
      <DailySpecialBanner
        specials={specials}
        fallbackProducts={menuProducts}
        isLoading={isSpecialsLoading}
        onAdd={addToCart}
      />

      {/* 
        ZONE DE CONTENU RESPONSIVE (Mobile / Tablette / Desktop) — UNIVERS DARK LUXURY
      */}
      <main id="menu-section" className="space-y-8 pt-6">
        {/* 4. CATÉGORIES EN VIGNETTES PHOTO CIRCULAIRES */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CategoryPills
            activeId={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>

        {/* 5. LES PLUS COMMANDÉS — GRILLE DU MENU AVEC BANNIÈRE PROMO PLEINE LARGEUR */}
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
        totalAmount={subtotal}
        onOpenCart={openCart}
        isVisible={!isCartOpen}
      />

      {/* 7. TIROIR PANIER COULISSANT DARK LUXURY */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={() => {
          closeCart()
          setIsCheckingOut(true)
        }}
        onClearCart={() => {
          clearCart()
          closeCart()
        }}
      />

      {/* Footer Institutionnel BMC Food Dakar (Univers Dark Luxury) */}
      <Footer onExploreMenu={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })} />
    </div>
  )
}

