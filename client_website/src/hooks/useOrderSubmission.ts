import { useCallback, useRef, useState } from 'react'
import { type OrderCustomerDetails, OrderSubmitError, submitOrder } from '../services/orders'
import type { Order } from '../types'
import { useCart } from './useCart'

export type OrderSubmissionStatus = 'idle' | 'submitting' | 'success' | 'error'

export interface OrderSubmission {
  status: OrderSubmissionStatus
  isSubmitting: boolean
  /** Commande enregistrée par le serveur, disponible uniquement après une réponse réussie. */
  order: Order | null
  /** Dernière erreur d'envoi (messages par champ, par article, message général). */
  error: OrderSubmitError | null
  /** Envoie le panier avec les informations du checkout. Renvoie la commande, ou null en cas d'échec. */
  submit: (customer: OrderCustomerDetails) => Promise<Order | null>
  /** Efface le message d'erreur (ex. quand le client corrige un champ). */
  clearError: () => void
  /** Revient à l'état initial après la confirmation (« Nouvelle commande »). */
  reset: () => void
}

/**
 * Envoi de la commande (tâche 2) :
 * - un seul envoi à la fois, même en cas de double appui ;
 * - le panier n'est vidé qu'après la réponse réussie du serveur ;
 * - en cas d'erreur, rien n'est effacé : le client corrige et renvoie.
 */
export function useOrderSubmission(): OrderSubmission {
  const { items, clearCart } = useCart()
  const [status, setStatus] = useState<OrderSubmissionStatus>('idle')
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<OrderSubmitError | null>(null)
  // Garde synchrone : l'état React ne bloque pas un deuxième appui arrivé avant le prochain rendu.
  const inFlight = useRef(false)

  const submit = useCallback(
    async (customer: OrderCustomerDetails) => {
      if (inFlight.current) return null
      inFlight.current = true
      setStatus('submitting')
      setError(null)
      try {
        const created = await submitOrder(items, customer)
        setOrder(created)
        setStatus('success')
        clearCart()
        return created
      } catch (caught) {
        setError(
          caught instanceof OrderSubmitError
            ? caught
            : new OrderSubmitError('Une erreur inattendue est survenue. Réessayez.', 'server'),
        )
        setStatus('error')
        return null
      } finally {
        inFlight.current = false
      }
    },
    [items, clearCart],
  )

  const clearError = useCallback(() => {
    setError(null)
    setStatus((current) => (current === 'error' ? 'idle' : current))
  }, [])

  const reset = useCallback(() => {
    setOrder(null)
    setError(null)
    setStatus('idle')
  }, [])

  return { status, isSubmitting: status === 'submitting', order, error, submit, clearError, reset }
}
