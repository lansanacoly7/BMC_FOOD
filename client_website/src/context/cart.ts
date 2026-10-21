import { createContext } from 'react'
import type { CartItem, Product } from '../types'

/** Quantité maximale d'un même plat dans le panier. */
export const MAX_ITEM_QUANTITY = 99

export interface CartContextValue {
  items: CartItem[]
  /** Nombre total d'articles (somme des quantités). */
  itemCount: number
  /** Sous-total indicatif en F CFA : le serveur recalcule toujours le montant réel. */
  subtotal: number
  /** Ajoute un plat (ou augmente sa quantité s'il est déjà au panier). */
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (code: string) => void
  /** Change la quantité d'un plat ; elle reste comprise entre 1 et MAX_ITEM_QUANTITY. */
  updateQuantity: (code: string, quantity: number) => void
  clearCart: () => void
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)
