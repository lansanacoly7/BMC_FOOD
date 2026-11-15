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

const ORDER_FIELDS: OrderField[] = [
  'customer_name',
  'phone',
  'order_type',
  'delivery_area',
  'address',
  'notes',
  'has_allergy',
  'payment_method',
]

/** Génère un UUID v4 pour l'en-tête Idempotency-Key (avec repli hors contexte HTTPS sur mobile). */
export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0
    return (char === 'x' ? rand : (rand & 0x3) | 0x8).toString(16)
  })
}

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

  const rawPayload = (error.payload && typeof error.payload === 'object' ? error.payload : {}) as Record<
    string,
    unknown
  >
  const errors =
    rawPayload.errors && typeof rawPayload.errors === 'object'
      ? (rawPayload.errors as Record<string, unknown>)
      : rawPayload

  if (error.status === 400) {
    const fieldErrors: Partial<Record<OrderField, string>> = {}
    for (const field of ORDER_FIELDS) {
      const message = firstMessage(errors[field])
      if (message) fieldErrors[field] = message
    }
    const itemErrors = allMessages(errors.items)
    const nonFieldError = firstMessage(errors.non_field_errors) ?? firstMessage(rawPayload.non_field_errors)
    const hasFieldErrors = Object.keys(fieldErrors).length > 0
    const message =
      nonFieldError ??
      (hasFieldErrors
        ? 'Certaines informations sont à corriger avant d’envoyer la commande.'
        : itemErrors.length > 0
          ? 'Un plat de votre panier pose problème : retirez-le ou modifiez la quantité, puis renvoyez.'
          : (firstMessage(rawPayload.error) ?? 'La commande n’a pas pu être validée. Vérifiez vos informations.'))
    return new OrderSubmitError(message, 'validation', fieldErrors, itemErrors)
  }

  if (error.status === 429) {
    return new OrderSubmitError('Trop de tentatives en peu de temps. Patientez une minute puis réessayez.', 'server')
  }

  // 404 : le site parle à un serveur qui ne connaît pas la route des commandes (mauvais service sur ce port)
  if (error.status === 404) {
    return new OrderSubmitError(
      'Le serveur de commandes est introuvable (erreur 404). Vérifiez que le serveur BMC Food est bien lancé sur le bon port.',
      'server',
    )
  }

  const serverMessage = firstMessage(rawPayload.error)
  return new OrderSubmitError(
    serverMessage ?? `Le serveur n’a pas pu enregistrer la commande (erreur ${error.status}). Réessayez dans un instant.`,
    'server',
  )
}

/** Corps de la commande : uniquement le code et la quantité de chaque plat, jamais de prix. */
export function buildOrderPayload(items: CartItem[], customer: OrderCustomerDetails): OrderCreatePayload {
  // Une même référence peut avoir plusieurs variantes au panier : le serveur reçoit une seule ligne par plat
  const quantities = new Map<string, number>()
  for (const item of items) {
    quantities.set(item.product.code, (quantities.get(item.product.code) ?? 0) + item.quantity)
  }

  // Les personnalisations (sans ketchup, sauces…) partent dans les notes, une ligne par variante
  const customizations = items
    .filter((item) => item.note)
    .map((item) => `• ${item.quantity} × ${item.product.name} : ${item.note}`)
  const notes = [customer.notes?.trim() ?? '', ...customizations].filter(Boolean).join('\n')

  const payload: OrderCreatePayload = {
    customer_name: customer.customer_name.trim(),
    phone: customer.phone.trim(),
    order_type: customer.order_type,
    notes,
    has_allergy: Boolean(customer.has_allergy),
    payment_method: customer.payment_method,
    items: [...quantities].map(([id, quantity]) => ({ id, quantity })),
  }

  if (customer.order_type === 'delivery') {
    const area = customer.delivery_area?.trim()
    if (area) payload.delivery_area = area
    payload.address = customer.address?.trim() ?? ''
  }

  return payload
}

/**
 * Envoie la commande à `POST /api/orders/` et renvoie la commande enregistrée par le serveur
 * (référence BMC-XXXX, montants calculés). Lève une OrderSubmitError en cas d'échec.
 */
export async function submitOrder(
  items: CartItem[],
  customer: OrderCustomerDetails,
  idempotencyKey: string = createIdempotencyKey(),
): Promise<Order> {
  if (items.length === 0) {
    throw new OrderSubmitError('Votre panier est vide : ajoutez au moins un plat.', 'validation')
  }

  const controller = new AbortController()
  const timer = globalThis.setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS)
  try {
    const { order } = await apiRequest<OrderResponse>('/orders/', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(buildOrderPayload(items, customer)),
      signal: controller.signal,
    })
    return order
  } catch (error) {
    throw toOrderSubmitError(error)
  } finally {
    globalThis.clearTimeout(timer)
  }
}
