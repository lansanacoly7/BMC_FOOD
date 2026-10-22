/*
 * Modèles partagés du frontend BMC Food - Application Admin
 */

export interface Category {
  id: number
  name: string
  slug: string
  icon: string
}

export interface Product {
  id: number
  code: string
  name: string
  category: number
  category_name: string
  description: string
  price: number
  image_url: string
  is_available: boolean
  is_daily_special: boolean
  popular: boolean
}

export interface DailySpecialState {
  activeProduct: Product | null
  updatedAt: string
}
