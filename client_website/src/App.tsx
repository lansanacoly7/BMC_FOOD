import { useEffect, useMemo, useState } from 'react'
import { SearchOverlay } from './components/search/SearchOverlay'
import { ProductDetailModal } from './components/menu/ProductDetailModal'
import type { Product } from './types'
import { FALLBACK_PRODUCTS } from './data/mockMenu'
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
import { ContactView } from './components/contact/ContactView'
import { ProfileView } from './components/profile/ProfileView'
import { type OrderSummary, USER_KEY } from './services/clientData'
import { normalize } from './data/productOptions'
import { ProvisionalCheckout } from './components/checkout/ProvisionalCheckout'
import { AuthModal, type ClientUser } from './components/auth/AuthModal'
import { useDailySpecials } from './hooks/useDailySpecials'
import { useMenu } from './hooks/useMenu'
import { useCart } from './hooks/useCart'

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'menu' | 'contact' | 'profile'>('home')
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [clientUser, setClientUser] = useState<ClientUser | null>(() => {
    try {
      const saved = localStorage.getItem('bmc_client_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [activeCategory, setActiveCategory] = useState('all')
  const searchQuery = ''
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // Navigation fluide entre Accueil, la page Menu d'El Hadji et la page Contact
  const handleNavigate = (page: 'home' | 'menu' | 'contact' | 'profile') => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  // Lien direct vers la connexion (#login), par exemple depuis l'application cuisine
  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === '#login') setIsAuthModalOpen(true)
    }
    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    return () => window.removeEventListener('hashchange', openFromHash)
  }, [])

  // Le bouton « compte » ouvre la page profil si le client est connecté, sinon la fenêtre de connexion
  const openAccount = () => {
    if (clientUser) handleNavigate('profile')
    else setIsAuthModalOpen(true)
  }

  // « Commander à nouveau » : retrouve chaque plat dans la carte actuelle (par code, sinon par nom) et le remet au panier
  const reorderFromHistory = (order: OrderSummary) => {
    let added = 0
    let missing = 0
    for (const item of order.items) {
      const cleanName = normalize(item.name.replace(/\s*\(-20 ?%\)\s*$/, ''))
      const product =
        (item.code ? searchProducts.find((p) => p.code === item.code) : undefined) ??
        searchProducts.find((p) => normalize(p.name) === cleanName)
      if (product && product.is_available) {
        addToCart(product, item.quantity)
        added += item.quantity
      } else {
        missing += 1
      }
    }
    if (added > 0) openCart()
    return { added, missing }
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem(USER_KEY)
    } catch {
      /* rien à effacer */
    }
    setClientUser(null)
    handleNavigate('home')
  }

  // Gestion centralisée du panier BMC Food (Pape Aliou)
  const { items, itemCount, subtotal, isCartOpen, openCart, closeCart, addToCart, updateQuantity, removeFromCart, clearCart } = useCart()

  // Hooks de données officiels BMC Food (avec support fallback)
  const { specials, isLoading: isSpecialsLoading } = useDailySpecials()
  const { items: menuProducts, isLoading: isMenuLoading } = useMenu()

  // Produits de la recherche : la carte du serveur, avec les boissons BMC en renfort si le serveur n'en renvoie pas
  const searchProducts = useMemo(() => {
    const base = menuProducts.length > 0 ? menuProducts : FALLBACK_PRODUCTS
    const hasDrinks = base.some((p) => p.category_name?.toLowerCase().includes('boisson') || p.code.toLowerCase().startsWith('bv'))
    return hasDrinks ? base : [...base, ...FALLBACK_PRODUCTS.filter((p) => p.code.startsWith('bv'))]
  }, [menuProducts])

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
    <div className="min-h-dvh text-zinc-100 pb-28 selection:bg-bmc-gold selection:text-black">
      {/* 
        1. EN-TÊTE NOIR ET LOGO
        Menu hamburger à gauche, logo BMC Food centré, navigation Accueil / Menu & La Carte, bouton Connexion / Inscription avec Logo BMC, panier à droite.
      */}
      <TopHeader
        cartItemCount={itemCount}
        onOpenCart={openCart}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleMenu={() => setIsNavMenuOpen(true)}
        onSelectCategory={setActiveCategory}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenAuth={openAccount}
        clientUser={clientUser}
      />

      {/* Tiroir latéral de navigation & informations (accessible via hamburger) */}
      <NavMenuDrawer
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        onSelectCategory={setActiveCategory}
        onNavigate={handleNavigate}
        onOpenAuth={openAccount}
        clientUser={clientUser}
      />

      {/* Recherche globale (icône de l'en-tête) */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={searchProducts}
        onAdd={(product) => addToCart(product, 1)}
        onSelect={(product) => setSelectedProduct(product)}
        onOpenMenu={() => handleNavigate('menu')}
      />

      {/* Fiche produit ouverte depuis l'accueil ou la recherche (la page carte a la sienne) */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(product, quantity, note) => addToCart(product, quantity, note)}
        catalog={searchProducts}
      />

      {/* Modal d'authentification client BMC Food (Connexion / Inscription) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogout={handleLogout}
        onSuccess={(user) => {
          setClientUser(user)
        }}
      />

      {currentPage === 'home' && (
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
            onSeeAll={() => handleNavigate('menu')}
            onSelect={setSelectedProduct}
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
              onSelectProduct={setSelectedProduct}
            />
          </main>

          {/* Capsule Vidéo Culinaire Immersive (« L'Art du Tacos Pané » - 5 Scènes Vidéo) */}
          <CulinaryVideoShowcase onExploreMenu={() => handleNavigate('menu')} />
        </>
      )}

      {currentPage === 'menu' && (
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

      {currentPage === 'contact' && (
        /* =========================================================================
           PAGE CONTACT OFFICIELLE : Hub de contact rapide, formulaire conforme 
           charte v1.1, localisation Cité Mixta & FAQ
           ========================================================================= */
        <main>
          <ContactView onExploreMenu={() => handleNavigate('menu')} />
        </main>
      )}

      {currentPage === 'profile' && (
        <main>
          <ProfileView
            user={clientUser}
            onUserChange={setClientUser}
            onLogout={handleLogout}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onExploreMenu={() => handleNavigate('menu')}
            onReorder={reorderFromHistory}
          />
        </main>
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
      <Footer onExploreMenu={() => handleNavigate('menu')} onNavigate={handleNavigate} />
    </div>
  )
}

