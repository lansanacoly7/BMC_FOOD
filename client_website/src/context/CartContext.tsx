import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import type { CartItem, Product } from '../types'
import { CartContext, type CartContextValue, MAX_ITEM_QUANTITY } from './cart'

/** Clé de sauvegarde du panier dans le navigateur ; changer le suffixe invalide les anciens paniers. */
const STORAGE_KEY = 'bmc-food:panier:v1'

const clampQuantity = (quantity: number) => Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.round(quantity)))

/** Vérifie qu'une ligne relue du navigateur a bien la forme attendue (données éventuellement modifiées ou anciennes). */
function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) return false
  const { product, quantity } = value as Partial<CartItem>
  return (
    typeof quantity === 'number' &&
    Number.isFinite(quantity) &&
    typeof product === 'object' &&
    product !== null &&
    typeof product.code === 'string' &&
    typeof product.name === 'string' &&
    typeof product.price === 'number'
  )
}

function readStoredCart(): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isCartItem).map((item) => ({ ...item, quantity: clampQuantity(item.quantity) }))
  } catch {
    // Stockage indisponible (navigation privée, données corrompues) : on repart d'un panier vide.
    return []
  }
}

function writeStoredCart(items: CartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Stockage plein ou bloqué : le panier reste utilisable, il ne survivra simplement pas au rechargement.
  }
}

/**
 * État global du panier : articles, quantités, sous-total et ouverture du tiroir.
 * Le panier est sauvegardé dans le navigateur : il survit à la navigation, au rechargement et suit les autres onglets.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStoredCart)
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    writeStoredCart(items)
  }, [items])

  // Un autre onglet a modifié le panier : on reprend sa version.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setItems(readStoredCart())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.product.code === product.code)
      if (!existing) return [...current, { product, quantity: clampQuantity(quantity) }]
      // On garde la fiche produit la plus récente (prix et photo à jour).
      return current.map((item) =>
        item.product.code === product.code ? { product, quantity: clampQuantity(item.quantity + quantity) } : item,
      )
    })
  }, [])

  const removeFromCart = useCallback((code: string) => {
    setItems((current) => current.filter((item) => item.product.code !== code))
  }, [])

  const updateQuantity = useCallback((code: string, quantity: number) => {
    setItems((current) =>
      current.map((item) => (item.product.code === code ? { ...item, quantity: clampQuantity(quantity) } : item)),
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])
  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isCartOpen,
      openCart,
      closeCart,
    }),
    [items, isCartOpen, addToCart, removeFromCart, updateQuantity, clearCart, openCart, closeCart],
  )

  return <CartContext value={value}>{children}</CartContext>
}
