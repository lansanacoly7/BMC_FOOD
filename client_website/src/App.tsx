import { useState, useEffect } from 'react'
import { CartDrawer } from './components/cart/CartDrawer'
import { DailySpecialBanner } from './components/client/DailySpecialBanner'
import { TopHeader } from './components/home/TopHeader'
import { HeroCinematic } from './components/home/HeroCinematic'
import { CategoryPills } from './components/home/CategoryPills'
import { FeaturedGrid } from './components/home/FeaturedGrid'
import { StickyCartBar } from './components/home/StickyCartBar'
import { NavMenuDrawer } from './components/home/NavMenuDrawer'
import { Footer } from './components/home/Footer'
import { CulinaryVideoShowcase } from './components/home/CulinaryVideoShowcase'
import { MenuHero } from './components/home/MenuHero'
import { MenuView } from './components/menu/MenuView'
import { ProvisionalCheckout } from './components/checkout/ProvisionalCheckout'
import { AuthModal, type ClientUser } from './components/auth/AuthModal'
import { useDailySpecials } from './hooks/useDailySpecials'
import { useMenu } from './hooks/useMenu'
import { useCart } from './hooks/useCart'

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'menu'>('home')
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [clientUser, setClientUser] = useState<ClientUser | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const searchQuery = ''
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // Chargement du compte client BMC sauvegardé et écoute hash #login
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bmc_client_user')
      if (saved) {
        setClientUser(JSON.parse(saved))
      }
    } catch {
      // Ignorer
    }

    if (window.location.hash === '#login') {
      setIsAuthModalOpen(true)
    }

    const handleHash = () => {
      if (window.location.hash === '#login') {
        setIsAuthModalOpen(true)
      }
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  // Navigation fluide entre Accueil et la page Menu d'El Hadji
  const handleNavigate = (page: 'home' | 'menu') => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Gestion centralisée du panier BMC Food (Pape Aliou)
  const { items, itemCount, subtotal, isCartOpen, openCart, closeCart, addToCart, updateQuantity, removeFromCart, clearCart } = useCart()

  // Hooks de données officiels BMC Food (avec support fallback)
  const { specials, isLoading: isSpecialsLoading } = useDailySpecials()
  const { items: menuProducts, isLoading: isMenuLoading } = useMenu()

  if (isCheckingOut) {
    return (
      <ProvisionalCheckout
        clientUser={clientUser}
        onBack={() => setIsCheckingOut(false)}
        onNewOrder={() => setIsCheckingOut(false)}
      />
    )
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100 pb-28 selection:bg-bmc-gold selection:text-black">
      {/* 
        1. EN-TÊTE NOIR ET LOGO
        Menu hamburger à gauche, logo BMC Food centré, navigation Accueil / Menu & La Carte, bouton Connexion / Inscription avec Logo BMC, panier à droite.
      */}
      <TopHeader
        cartItemCount={itemCount}
        onOpenCart={openCart}
        onToggleMenu={() => setIsNavMenuOpen(true)}
        onSelectCategory={setActiveCategory}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        clientUser={clientUser}
      />

      {/* Tiroir latéral de navigation & informations (accessible via hamburger) */}
      <NavMenuDrawer
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        onSelectCategory={setActiveCategory}
        onNavigate={handleNavigate}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        clientUser={clientUser}
      />

      {/* Modal d'authentification client BMC Food (Connexion / Inscription) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setClientUser(user)
        }}
        onLogout={() => {
          setClientUser(null)
        }}
      />

      {currentPage === 'home' ? (
        /* =========================================================================
           PAGE D'ACCUEIL (Maimouna Sall) : Hero Vidéo Unique, Plat du Jour, 
           Catégories, Grille & Showcase Vidéos Culinaires
           ========================================================================= */
        <>
          {/* ÉTAPE 1 : LE HERO CINÉMATIQUE PLEINE LARGEUR SANS CARTE */}
          <HeroCinematic onExploreMenu={() => handleNavigate('menu')} />

          {/* BANDEAU VEDETTE HYBRIDE PLAT DU JOUR & BEST-SELLERS */}
          <DailySpecialBanner
            specials={specials}
            fallbackProducts={menuProducts}
            isLoading={isSpecialsLoading}
            onAdd={addToCart}
          />

          {/* ZONE DE CONTENU RESPONSIVE (Mobile / Tablette / Desktop) — UNIVERS DARK LUXURY */}
          <main id="menu-section" className="space-y-8 pt-6">
            {/* CATÉGORIES EN VIGNETTES PHOTO CIRCULAIRES */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <CategoryPills
                activeId={activeCategory}
                onSelect={setActiveCategory}
              />
            </div>

            {/* LES PLUS COMMANDÉS — GRILLE DU MENU AVEC BANNIÈRE PROMO PLEINE LARGEUR */}
            <FeaturedGrid
              products={menuProducts}
              isLoading={isMenuLoading}
              activeCategory={activeCategory}
              searchQuery={searchQuery}
              onAddToCart={addToCart}
              onSeeAll={() => handleNavigate('menu')}
            />
          </main>

          {/* Capsule Vidéo Culinaire Immersive (« L'Art du Tacos Pané » - 5 Scènes Vidéo) */}
          <CulinaryVideoShowcase onExploreMenu={() => handleNavigate('menu')} />
        </>
      ) : (
        /* =========================================================================
           PAGE MENU D'EL HADJI : MenuHero panoramique & MenuView complet 
           avec carrousels de spécialités, fiches produits détaillées et sélection
           ========================================================================= */
        <div className="space-y-8">
          {/* 1. MenuHero panoramique avec carrousel promotionnel */}
          <MenuHero onExploreMenu={() => {
            const target = document.getElementById('menu-heading')
            target?.scrollIntoView({ behavior: 'smooth' })
          }} />

          {/* 2. Vue du Menu complète d'El Hadji Diop */}
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <MenuView onAddToCart={addToCart} />
          </main>
        </div>
      )}

      {/* BARRE PANIER FLOTTANTE (« Pensé pour le pouce », Page 11, Point 6) */}
      <StickyCartBar
        itemCount={itemCount}
        totalAmount={subtotal}
        onOpenCart={openCart}
        isVisible={!isCartOpen}
      />

      {/* TIROIR PANIER COULISSANT DARK LUXURY */}
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
      <Footer onExploreMenu={() => handleNavigate('menu')} />
    </div>
  )
}

