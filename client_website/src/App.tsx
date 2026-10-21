import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ShoppingBag } from 'lucide-react'
import { Header } from './components/ui/Header'
import { DailySpecialBanner } from './components/client/DailySpecialBanner'
import { MenuView } from './components/menu/MenuView'
import { CartDrawer } from './components/cart/CartDrawer'
import { useDailySpecials } from './hooks/useDailySpecials'
import { formatFcfa } from './lib/format'
import type { CartItem, Product } from './types'

export default function App() {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { specials, isLoading: isSpecialsLoading } = useDailySpecials()

  const itemCount = items.reduce((count, item) => count + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const addToCart = (product: Product) =>
    setItems((current) =>
      current.some((item) => item.product.code === product.code)
        ? current.map((item) =>
            item.product.code === product.code
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...current, { product, quantity: 1 }],
    )

  const updateQuantity = (code: string, quantity: number) =>
    setItems((current) =>
      current.map((item) =>
        item.product.code === code ? { ...item, quantity } : item,
      ),
    )

  const removeFromCart = (code: string) =>
    setItems((current) => current.filter((item) => item.product.code !== code))

  return (
    <div className="flex min-h-dvh flex-col bg-bmc-offwhite text-bmc-charcoal">
      {/* Header Sticky avec Logo officiel BMC Food */}
      <Header
        itemCount={itemCount}
        onOpenCart={() => setIsCartOpen(true)}
        onLogoClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* Conteneur principal */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6">
        {/* Plat du Jour Vedette */}
        <DailySpecialBanner
          specials={specials}
          isLoading={isSpecialsLoading}
          onAdd={addToCart}
        />

        {/* Page Menu complète de Massogui Diop */}
        <MenuView onAddToCart={addToCart} />
      </main>

      {/* Barre d'action mobile flottante si le panier contient des articles */}
      <AnimatePresence>
        {itemCount > 0 && !isCartOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-4 left-4 right-4 z-30 sm:hidden"
          >
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl bg-bmc-charcoal px-5 py-4 text-white shadow-xl focus-visible:outline-2 focus-visible:outline-bmc-orange-braise cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="relative flex size-8 items-center justify-center rounded-full bg-white/20">
                  <ShoppingBag className="size-4" aria-hidden="true" />
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-bmc-orange-braise text-[10px] font-bold text-white">
                    {itemCount}
                  </span>
                </div>
                <span className="text-sm font-bold">Voir mon panier</span>
              </div>
              <span className="font-display text-sm font-extrabold text-bmc-gold">
                {formatFcfa(subtotal)}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tiroir Panier coulissant */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={() => setIsCartOpen(false)}
      />

      {/* Footer Institutionnel BMC Food */}
      <footer className="mt-12 border-t border-zinc-200/80 bg-white py-10 text-center text-xs text-zinc-500">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between">
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

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <span className="rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-700">Espèces à la livraison</span>
            <span className="rounded-md bg-[#1DC8F2]/15 px-2 py-1 font-semibold text-[#0284C7]">Wave</span>
            <span className="rounded-md bg-[#FF7900]/15 px-2 py-1 font-semibold text-[#C2410C]">Orange Money</span>
          </div>
        </div>

        <div className="mt-6 border-t border-zinc-100 pt-4">
          <p>© {new Date().getFullYear()} BMC FOOD · Teranga Labs. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
