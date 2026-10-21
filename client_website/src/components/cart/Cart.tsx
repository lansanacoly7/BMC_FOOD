import { useCart } from '../../hooks/useCart'
import { CartBar } from './CartBar'
import { CartDrawer } from './CartDrawer'

interface CartProps {
  /** « Valider la commande » : ouvre le checkout (tâche de Maimouna) puis l'envoi de la commande. */
  onCheckout: () => void
}

/** Panier complet branché sur le CartContext : barre flottante et tiroir. À placer une seule fois dans l'application. */
export function Cart({ onCheckout }: CartProps) {
  const { items, itemCount, subtotal, updateQuantity, removeFromCart, isCartOpen, openCart, closeCart } = useCart()

  return (
    <>
      <CartBar isVisible={itemCount > 0 && !isCartOpen} itemCount={itemCount} subtotal={subtotal} onOpen={openCart} />
      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={() => {
          closeCart()
          onCheckout()
        }}
      />
    </>
  )
}
