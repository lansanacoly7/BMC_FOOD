import { useState } from 'react'
import { Header } from './components/ui/Header'
import { MenuHero } from './components/home/MenuHero'
import { MenuView } from './components/menu/MenuView'
import { CartDrawer } from './components/cart/CartDrawer'
import { StickyCartBar } from './components/home/StickyCartBar'
import { Footer } from './components/home/Footer'
import { ContactModal } from './components/contact/ContactModal'
import type { CartItem, Product } from './types'

export default function App() {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)


  const itemCount = items.reduce((count, item) => count + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const addToCart = (product: Product, quantity = 1) =>
    setItems((current) =>
      current.some((item) => item.product.code === product.code)
        ? current.map((item) =>
            item.product.code === product.code
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          )
        : [...current, { product, quantity }],
    )

  const updateQuantity = (code: string, quantity: number) =>
    setItems((current) =>
      current.map((item) =>
        item.product.code === code ? { ...item, quantity } : item,
      ),
    )

  const removeFromCart = (code: string) =>
    setItems((current) => current.filter((item) => item.product.code !== code))

  const clearCart = () => setItems([])

  const scrollToMenu = () => {
    const el = document.getElementById('menu-heading')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#0C0C0D] text-white">
      {/* Header Sticky avec fond sombre sublimant le logo */}
      <Header
        itemCount={itemCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        onLogoClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* 1. HÉRO PANORAMIQUE PLEINE PAGE (Full-Bleed 100vw edge-to-edge) */}
      <MenuHero onExploreMenu={scrollToMenu} />

      {/* 2. Conteneur principal de la Carte et des Offres */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">

        {/* Page Menu avec Carrousel des plus commandés, rondelles et grille 2 colonnes */}
        <MenuView onAddToCart={addToCart} />
      </main>

      {/* Barre de panier flottante (« Pensé pour le pouce », Maimouna Sall) */}
      <StickyCartBar
        itemCount={itemCount}
        totalAmount={subtotal}
        onOpenCart={() => setIsCartOpen(true)}
        isVisible={!isCartOpen}
      />

      {/* Tiroir Panier coulissant Dark Luxury de Maimouna Sall */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onClearCart={clearCart}
        onCheckout={() => setIsCartOpen(false)}
      />

      {/* Footer Institutionnel BMC Food Dakar (Univers Dark Luxury) */}
      <Footer
        onExploreMenu={scrollToMenu}
      />

      {/* Modale Contact au design Gourmet inspiré du Screenshot 1 */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  )
}
