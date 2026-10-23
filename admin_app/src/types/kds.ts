/**
 * BMC FOOD KDS - Modèles de données typés pour l'interface Cuisine
 */

export type KdsOrderStatus = 
  | 'pending'    // À préparer (nouvelle commande reçue)
  | 'preparing'  // En cuisine / Au Gril
  | 'ready'      // Prêt à récupérer (comptoir ou départ livreur)
  | 'delivering' // En livraison (sur la route)
  | 'delivered'  // Livrée (terminée / archivée)
  | 'cancelled'  // Annulée

export type OrderType = 'delivery' | 'dine_in' | 'takeaway'

export type PaymentMethod = 'cash' | 'wave' | 'orange_money'
export type PaymentStatus = 'unpaid' | 'pending' | 'paid'

export type UrgencyLevel = 'normal' | 'warning' | 'danger'

export interface KdsOrderItem {
  id: number | string
  code?: string
  name: string
  quantity: number
  unitPrice: number
  notes?: string
  options?: string[]
}

export interface KdsOrder {
  id: number | string
  orderRef: string
  customerName: string
  phone: string
  address: string
  notes?: string
  orderType: OrderType
  status: KdsOrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  totalAmount: number
  createdAt: string // ISO date
  items: KdsOrderItem[]
  isNew?: boolean   // Affiché avec badge NOUVEAU
}

export interface KdsKpis {
  todayRevenue: number
  totalOrders: number
  activeOrders: number
  avgPrepTimeMinutes: number
}

export interface ChronoThresholds {
  warningMinutes: number // Défaut: 10 min
  dangerMinutes: number  // Défaut: 15 min
}

export const DEFAULT_THRESHOLDS: ChronoThresholds = {
  warningMinutes: 10,
  dangerMinutes: 15,
}

export interface ColumnDefinition {
  id: KdsOrderStatus
  title: string
  subtitle: string
  badgeColor: string
  borderColor: string
  actionLabel: string
  actionClass: string
  nextStatus: KdsOrderStatus
  emptyMessage: string
}
