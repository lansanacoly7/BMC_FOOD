import { ShoppingBag } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { CartDrawer } from './components/cart/CartDrawer'
import { DailySpecialBanner } from './components/client/DailySpecialBanner'
import { useDailySpecials } from './hooks/useDailySpecials'
import type { CartItem, Product } from './types'

// Page d'intégration provisoire : le CartContext (MS-1) remplacera cet état local et les modules C1/C3
// remplaceront cette page (le bandeau Plat du Jour y reste en tête). Le panier reprend le scénario de
// démonstration (total attendu : 5 500 F CFA).
const DEMO_CART: CartItem[] = [
  {
    product: {
      id: 1,
      code: 'tp-1',
      name: 'Tacos viande pané',
      category: 1,
      category_name: 'Tacos panés',
      description: 'Viande hachée assaisonnée, frites croustillantes, sauce fromagère maison et panure dorée.',
      price: 3500,
      image_url: '',
      is_available: true,
      is_daily_special: false,
      popular: true,
    },
    quantity: 1,
  },
  {
    product: {
      id: 21,
      code: 'bg-1',
      name: 'Burger complet',
      category: 6,
      category_name: 'Burgers',
      description: 'Steak pur bœuf, œuf, salade, tomate, oignons caramélisés et sauce burger maison.',
      price: 2000,
      image_url: '',
      is_available: true,
      is_daily_special: false,
      popular: true,
    },
    quantity: 1,
  },
]

export default function App() {
  const [items, setItems] = useState<CartItem[]>(DEMO_CART)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { specials, isLoading } = useDailySpecials()
  const itemCount = items.reduce((count, item) => count + item.quantity, 0)

  const addToCart = (product: Product) =>
    setItems((current) =>
      current.some((item) => item.product.code === product.code)
        ? current.map((item) => (item.product.code === product.code ? { ...item, quantity: item.quantity + 1 } : item))
        : [...current, { product, quantity: 1 }],
    )

  const updateQuantity = (code: string, quantity: number) =>
    setItems((current) => current.map((item) => (item.product.code === code ? { ...item, quantity } : item)))

  const removeFromCart = (code: string) =>
    setItems((current) => current.filter((item) => item.product.code !== code))

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-4 py-6">
      <DailySpecialBanner specials={specials} isLoading={isLoading} onAdd={addToCart} />

      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <span className="rounded-full bg-bmc-gold px-3 py-1 text-xs font-bold uppercase tracking-wider text-bmc-charcoal">
          Dakar · 11h – 02h
        </span>
        <h1 className="font-display text-5xl font-extrabold">BMC Food</h1>
        <p className="text-zinc-600">Le goût du vrai plaisir.</p>

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCartOpen(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-bmc-charcoal px-6 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-orange"
        >
          <ShoppingBag className="size-5" aria-hidden="true" />
          Voir le panier ({itemCount})
        </motion.button>
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        // Le module C3 (MS-3) ouvrira ici le CheckoutModal.
        onCheckout={() => setIsCartOpen(false)}
      />
    </main>
  )
}
