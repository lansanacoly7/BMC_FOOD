import { createContext } from 'react'
import type { CartItem, Product } from '../types'

/** Quantité maximale d'un même plat, alignée sur le backend (order_rules.MAX_QUANTITY_PER_LINE). */
export const MAX_ITEM_QUANTITY = 20

/** Identifiant d'une ligne du panier : le même plat avec une personnalisation différente est une autre ligne. */
export function getLineId(item: Pick<CartItem, 'product' | 'note'>): string {
  return item.note ? `|` : item.product.code
}

export interface CartContextValue {
  items: CartItem[]
  /** Nombre total d'articles (somme des quantités). */
  itemCount: number
  /** Sous-total indicatif en F CFA : le serveur recalcule toujours le montant réel. */
  subtotal: number
  /** Ajoute un plat (ou augmente sa quantité si la même variante est déjà au panier). */
  addToCart: (product: Product, quantity?: number, note?: string) => void
  /** Retire une ligne du panier (identifiant de ligne : voir getLineId). */
  removeFromCart: (lineId: string) => void
  /** Change la quantité d'une ligne ; elle reste comprise entre 1 et MAX_ITEM_QUANTITY. */
  updateQuantity: (lineId: string, quantity: number) => void
  clearCart: () => void
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)
