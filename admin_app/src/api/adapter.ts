import type { Order as ApiOrder, OrderItem as ApiOrderItem, OrderResponse } from '../types'
import type { KdsOrder, KdsOrderItem, KdsOrderStatus, OrderType, PaymentMethod, PaymentStatus } from '../types/kds'

/**
 * Adaptateur de données KDS BMC FOOD
 * Isole complètement les composants React de la structure brute de la base Django DRF.
 * Si le backend modifie ses noms de champs (snake_case -> camelCase ou renommage),
 * seul ce fichier doit être adapté.
 */

/**
 * Déduit le type de commande (sur place, à emporter, livraison) à partir de l'adresse ou des notes
 */
function inferOrderType(address: string = '', notes: string = ''): OrderType {
  const normalized = (address + ' ' + notes).toLowerCase()
  // À tester en premier : le site client écrit « Retrait sur place » pour une commande à emporter.
  if (normalized.includes('emporter') || normalized.includes('retrait') || normalized.includes('comptoir')) {
    return 'takeaway'
  }
  if (normalized.includes('sur place') || /\btable\b/.test(normalized)) {
    return 'dine_in'
  }
  return 'delivery'
}

/**
 * Transforme un article brut DRF en article KDS
 */
export function mapOrderItemFromApi(item: ApiOrderItem): KdsOrderItem {
  return {
    id: item.id,
    code: item.menu_item_code || '',
    name: item.item_name,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    notes: undefined,
    options: [],
  }
}

/**
 * Transforme une commande brute Django DRF (ou enveloppe OrderResponse) en commande KDS
 */
export function mapOrderFromApi(apiData: ApiOrder | OrderResponse): KdsOrder {
  // Supporte à la fois l'objet Order direct ou l'enveloppe { success: true, order: Order }
  const raw: ApiOrder = 'order' in apiData && apiData.order ? apiData.order : (apiData as ApiOrder)

  // Normalisation du statut DRF vers le cycle KDS
  let status: KdsOrderStatus = 'pending'
  const rawStatus = (raw.status || '').toLowerCase()

  if (rawStatus === 'confirmed' || rawStatus === 'pending') {
    status = 'pending'
  } else if (rawStatus === 'preparing') {
    status = 'preparing'
  } else if (rawStatus === 'ready') {
    status = 'ready'
  } else if (rawStatus === 'delivering') {
    status = 'delivering'
  } else if (rawStatus === 'delivered') {
    status = 'delivered'
  } else if (rawStatus === 'cancelled') {
    status = 'cancelled'
  }

  // Formatage propre du préfixe de référence (#BMC-...)
  const rawRef = raw.order_ref || `BMC-${raw.id}`
  const orderRef = rawRef.startsWith('#') ? rawRef : `#${rawRef}`

  // Type de commande : direct si fourni par le backend V1, sinon inféré
  let orderType: OrderType
  if (raw.order_type === 'pickup') {
    orderType = 'takeaway'
  } else if (raw.order_type === 'dine_in') {
    orderType = 'dine_in'
  } else if (raw.order_type === 'delivery') {
    orderType = 'delivery'
  } else {
    orderType = inferOrderType(raw.address, raw.notes)
  }

  // Détection allergie : drapeau booléen explicite ou mention dans la note
  const hasAllergy = Boolean(
    raw.has_allergy ||
      (raw.notes && /\ballergie|\ballergique|\barachide|\bgluten|\blactose\b/i.test(raw.notes)),
  )

  return {
    id: raw.id,
    orderRef,
    customerName: raw.customer_name || 'Client BMC',
    phone: raw.phone || '',
    address: raw.address || 'Livraison standard',
    notes: raw.notes || '',
    orderType,
    deliveryArea: raw.delivery_area || null,
    deliveryFee: typeof raw.delivery_fee === 'number' ? raw.delivery_fee : null,
    subtotal: typeof raw.subtotal === 'number' ? raw.subtotal : undefined,
    hasAllergy,
    cancelReason: raw.cancel_reason || null,
    status,
    paymentMethod: (raw.payment_method || 'cash') as PaymentMethod,
    paymentStatus: (raw.payment_status || 'unpaid') as PaymentStatus,
    totalAmount: typeof raw.total_amount === 'number' ? raw.total_amount : Number(raw.total_amount) || 0,
    createdAt: raw.created_at || new Date().toISOString(),
    isNew: raw.is_notified_to_admin === false,
    items: Array.isArray(raw.items) ? raw.items.map(mapOrderItemFromApi) : [],
  }
}

/**
 * Transforme une transition KDS vers le payload attendu par Django DRF
 */
export function mapKdsStatusToApiStatus(kdsStatus: KdsOrderStatus): string {
  switch (kdsStatus) {
    case 'pending':
      return 'pending'
    case 'preparing':
      return 'preparing'
    case 'ready':
      return 'ready'
    case 'delivering':
      return 'delivering'
    case 'delivered':
      return 'delivered'
    case 'cancelled':
      return 'cancelled'
    default:
      return kdsStatus
  }
}
