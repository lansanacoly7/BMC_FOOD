import { useContext } from 'react'
import { CartContext, type CartContextValue } from '../context/cart'

/** Accès au panier depuis n'importe quel composant placé sous <CartProvider>. */
export function useCart(): CartContextValue {
  const cart = useContext(CartContext)
  if (!cart) throw new Error('useCart() doit être utilisé sous <CartProvider> (voir src/main.tsx).')
  return cart
}
