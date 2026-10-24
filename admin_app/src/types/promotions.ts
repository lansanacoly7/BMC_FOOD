export type DiscountType = 'percentage' | 'fixed' | 'custom_price'

export interface Promotion {
  id: string
  productId: number
  productName: string
  productCode: string
  categoryName: string
  productImage: string
  originalPrice: number
  discountType: DiscountType
  discountValue: number // e.g. 20 (pour 20%) ou 500 (pour 500 FCFA de remise)
  promoPrice: number // Prix final remisé
  badgeLabel: string // Ex: "-20%", "OFFRE SPECIALE", "MENU DUO", "FLASH"
  description?: string
  isActive: boolean
  createdAt: string
  endsAt?: string
}
