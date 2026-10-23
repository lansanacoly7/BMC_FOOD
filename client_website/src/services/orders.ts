import type { CartItem, Order, OrderCreatePayload, OrderResponse } from '../types'
import { ApiError, apiRequest } from './api'

/** Délai maximal d'attente du serveur avant d'abandonner l'envoi (réseau mobile lent ou coupé). */
const SUBMIT_TIMEOUT_MS = 20_000

/** Informations saisies au checkout : tout le corps de POST /api/orders/ sauf les articles. */
export type OrderCustomerDetails = Omit<OrderCreatePayload, 'items'>

/** Champs du checkout qui peuvent recevoir un message d'erreur du serveur. */
export type OrderField = keyof OrderCustomerDetails

/** Nature de l'échec, pour adapter le message et l'action proposée au client. */
export type OrderErrorKind = 'validation' | 'network' | 'server'

/** Échec d'envoi traduit pour l'interface. Le panier et le formulaire ne sont jamais vidés. */
export class OrderSubmitError extends Error {
  readonly kind: OrderErrorKind
  /** Messages par champ du formulaire (ex. téléphone trop court), à afficher sous le champ concerné. */
  readonly fieldErrors: Partial<Record<OrderField, string>>
  /** Problèmes sur les articles (plat indisponible, quantité trop élevée), à afficher près du panier. */
  readonly itemErrors: string[]

  constructor(
    message: string,
    kind: OrderErrorKind,
    fieldErrors: Partial<Record<OrderField, string>> = {},
    itemErrors: string[] = [],
  ) {
    super(message)
    this.name = 'OrderSubmitError'
    this.kind = kind
    this.fieldErrors = fieldErrors
    this.itemErrors = itemErrors
  }
}

const ORDER_FIELDS: OrderField[] = ['customer_name', 'phone', 'address', 'notes', 'payment_method']

const NETWORK_MESSAGE =
  'Connexion au serveur impossible. Vérifiez votre connexion internet puis réessayez : votre panier et vos informations sont conservés.'

/** Premier message lisible d'une valeur d'erreur DRF (chaîne, liste ou objet imbriqué). */
function firstMessage(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    for (const entry of value) {
      const message = firstMessage(entry)
      if (message) return message
    }
  }
  if (value && typeof value === 'object') return firstMessage(Object.values(value))
  return undefined
}

/** Tous les messages d'une valeur d'erreur DRF, à plat. */
function allMessages(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(allMessages)
  if (value && typeof value === 'object') return Object.values(value).flatMap(allMessages)
  return []
}

/**
 * Traduit une erreur de l'API (contrat backend : `{ success: false, error, errors, code? }`)
 * en erreur affichable : messages par champ, problèmes d'articles, message général.
 */
function toOrderSubmitError(error: unknown): OrderSubmitError {
  if (!(error instanceof ApiError)) return new OrderSubmitError(NETWORK_MESSAGE, 'network')

  const payload = (error.payload ?? {}) as { error?: unknown; errors?: Record<string, unknown> }
  const errors = payload.errors ?? {}

  if (error.status === 400) {
    const fieldErrors: Partial<Record<OrderField, string>> = {}
    for (const field of ORDER_FIELDS) {
      const message = firstMessage(errors[field])
      if (message) fieldErrors[field] = message
    }
    const itemErrors = allMessages(errors.items)
    const hasFieldErrors = Object.keys(fieldErrors).length > 0
    const message = hasFieldErrors
      ? 'Certaines informations sont à corriger avant d’envoyer la commande.'
      : itemErrors.length > 0
        ? 'Un plat de votre panier pose problème : retirez-le ou modifiez la quantité, puis renvoyez.'
        : (firstMessage(payload.error) ?? 'La commande n’a pas pu être validée. Vérifiez vos informations.')
    return new OrderSubmitError(message, 'validation', fieldErrors, itemErrors)
  }

  if (error.status === 429) {
    return new OrderSubmitError('Trop de tentatives en peu de temps. Patientez une minute puis réessayez.', 'server')
  }

  const serverMessage = firstMessage(payload.error)
  return new OrderSubmitError(
    serverMessage ?? 'Le serveur n’a pas pu enregistrer la commande. Réessayez dans un instant.',
    'server',
  )
}

/** Corps de la commande : uniquement le code et la quantité de chaque plat, jamais de prix. */
export function buildOrderPayload(items: CartItem[], customer: OrderCustomerDetails): OrderCreatePayload {
  return {
    customer_name: customer.customer_name.trim(),
    phone: customer.phone.trim(),
    address: customer.address.trim(),
    notes: customer.notes?.trim() ?? '',
    payment_method: customer.payment_method,
    items: items.map((item) => ({ id: item.product.code, quantity: item.quantity })),
  }
}

/**
 * Envoie la commande à `POST /api/orders/` et renvoie la commande enregistrée par le serveur
 * (référence BMC-XXXX, montant recalculé). Lève une OrderSubmitError en cas d'échec.
 */
export async function submitOrder(items: CartItem[], customer: OrderCustomerDetails): Promise<Order> {
  if (items.length === 0) {
    throw new OrderSubmitError('Votre panier est vide : ajoutez au moins un plat.', 'validation')
  }

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS)
  try {
    const { order } = await apiRequest<OrderResponse>('/orders/', {
      method: 'POST',
      body: JSON.stringify(buildOrderPayload(items, customer)),
      signal: controller.signal,
    })
    return order
  } catch (error) {
    throw toOrderSubmitError(error)
  } finally {
    window.clearTimeout(timer)
  }
}
