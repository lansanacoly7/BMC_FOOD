/*
 * Modèles partagés du frontend BMC Food.
 * Miroir exact du contrat de l'API Django REST (backend/api/serializers.py et views.py) :
 * les noms de champs restent en snake_case pour être utilisés tels quels, sans couche de conversion.
 * Ce fichier existe à l'identique dans client_website/ et admin_app/ (src/types/index.ts) :
 * toute modification doit être reportée dans les deux applications.
 */

/** Moyens de paiement acceptés par le backend. */
export type PaymentMethod = 'cash' | 'wave' | 'orange_money'

/** État du paiement : `unpaid` (espèces), `pending` (Wave / Orange Money en attente), `paid`. */
export type PaymentStatus = 'unpaid' | 'pending' | 'paid'

/** Cycle de vie d'une commande (Order.STATUS_CHOICES). */
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled'

/** Catégorie du menu (CategorySerializer). `icon` est un nom d'icône lucide-react, ex. « Flame ». */
export interface Category {
  id: number
  name: string
  slug: string
  icon: string
}

/** Plat de la carte (MenuItemSerializer). `price` est un entier en F CFA, fourni par le serveur. */
export interface Product {
  id: number
  /** Identifiant métier stable (ex. « tp-1 ») : c'est lui qui est envoyé dans les commandes. */
  code: string
  name: string
  /** Identifiant de la catégorie. */
  category: number
  category_name: string
  description: string
  price: number
  /** Chemin de l'image ; chaîne vide tant que la photo n'est pas fournie. */
  image_url: string
  is_available: boolean
  is_daily_special: boolean
  popular: boolean
}

/** Catégorie accompagnée de ses plats disponibles (GET /api/menu/). */
export interface MenuCategory extends Category {
  items_count: number
  items: Product[]
}

/** Ligne de commande enregistrée (OrderItemSerializer) : prix figés par le serveur. */
export interface OrderItem {
  id: number
  /** Identifiant numérique du plat. */
  menu_item: number
  menu_item_code: string
  item_name: string
  unit_price: number
  quantity: number
  subtotal: number
}

/** Commande complète (OrderSerializer). `total_amount` est toujours recalculé côté serveur. */
export interface Order {
  id: number
  /** Référence visible par le client, ex. « BMC-4821 ». */
  order_ref: string
  customer_name: string
  phone: string
  address: string
  notes: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  total_amount: number
  status: OrderStatus
  is_notified_to_admin: boolean
  /** Date ISO 8601 UTC, ex. « 2026-10-21T14:05:00Z ». */
  created_at: string
  items: OrderItem[]
  items_count: number
}

/** Article du panier côté navigateur. Le prix affiché est indicatif : le serveur fait foi. */
export interface CartItem {
  product: Product
  quantity: number
}

/** Ligne envoyée à POST /api/orders/ : uniquement le code du plat et la quantité, jamais de prix. */
export interface OrderCreateItem {
  id: string
  quantity: number
}

/** Corps de POST /api/orders/. */
export interface OrderCreatePayload {
  customer_name: string
  phone: string
  address: string
  notes?: string
  payment_method: PaymentMethod
  items: OrderCreateItem[]
}

/** Réponse de GET /api/menu/. */
export interface MenuResponse {
  success: boolean
  total_items: number
  categories: MenuCategory[]
  items: Product[]
}

/** Réponse de GET /api/daily-special/. */
export interface DailySpecialResponse {
  success: boolean
  count: number
  daily_specials: Product[]
}

/** Réponse de PATCH /api/daily-special/<id>/toggle/. */
export interface ToggleDailySpecialResponse {
  success: boolean
  message: string
  item: Product
}

/** Réponse de GET /api/orders/ (filtre optionnel ?status=). */
export interface OrderListResponse {
  success: boolean
  count: number
  orders: Order[]
}

/** Réponse de POST /api/orders/ (201), GET /api/orders/<ref>/ et PATCH /api/orders/<ref>/status/. */
export interface OrderResponse {
  success: boolean
  message?: string
  order: Order
}

/** Corps d'une réponse 400 de POST /api/orders/ : erreurs de validation DRF par champ. */
export interface OrderValidationErrorResponse {
  success: false
  errors: Record<string, unknown>
}

/** Réponse de GET /api/orders/events/unnotified/ : commandes qui doivent déclencher la sonnerie. */
export interface UnnotifiedOrdersResponse {
  has_new_orders: boolean
  count: number
  new_orders: Order[]
}

/** Corps de POST /api/orders/events/unnotified/. Sans `order_refs`, le serveur acquitte TOUT. */
export interface AcknowledgeOrdersPayload {
  order_refs: string[]
}

/** Réponse de POST /api/orders/events/unnotified/. */
export interface AcknowledgeOrdersResponse {
  success: boolean
  message: string
}
