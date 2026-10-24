import type { Product } from '../types'

/** Choix de personnalisation proposés au client sur la fiche d'un plat. */
export interface ProductOptions {
  /** Ingrédients que le client peut retirer. */
  removable: string[]
  /** Sauces au choix (incluses : aucun supplément). */
  sauces: string[]
  /** Nombre maximal de sauces cumulables. */
  maxSauces: number
}

const REMOVABLE = ['Ketchup', 'Mayonnaise', 'Moutarde', 'Oignons', 'Salade', 'Tomate', 'Cornichons']
// Les sauces de la carte : Algérienne, Samouraï, Fromagère maison, Blanche, Barbecue
const SAUCES = ['Samouraï', 'Algérienne', 'Fromagère maison', 'Blanche', 'Barbecue']

/** Minuscules sans accents, pour comparer des libellés. */
export const normalize = (value: string | undefined) =>
  (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** Sauces et accompagnements : jamais vendus seuls, ils n'existent que dans la fiche d'un plat. */
export const isAddOnOnly = (product: Product) => {
  const category = normalize(product.category_name)
  return category.includes('sauce') || category.includes('accompagnement') || /^(sc|ac|fr)-/.test(product.code.toLowerCase())
}

export const isAddOnCategory = (category: { name?: string; slug?: string }) => {
  const label = normalize(`${category.name ?? ''} ${category.slug ?? ''}`)
  return label.includes('sauce') || label.includes('accompagnement')
}

export const isDrink = (product: Product) =>
  normalize(product.category_name).includes('boisson') || product.code.toLowerCase().startsWith('bv')

/**
 * Options d'un plat selon sa famille : tacos, burgers et sandwichs se personnalisent entièrement ;
 * le finger food ne propose que le choix de sauce ; boissons, sauces et accompagnements n'ont pas d'options.
 */
export function getProductOptions(product: Product): ProductOptions | null {
  const label = `${normalize(product.name)} ${normalize(product.category_name)}`
  if (/tacos|burger|sandwich|chawarma/.test(label)) {
    return { removable: REMOVABLE, sauces: SAUCES, maxSauces: 2 }
  }
  if (/tender|wing|poulet|pastel|sambousa|finger/.test(label)) {
    return { removable: [], sauces: SAUCES, maxSauces: 1 }
  }
  return null
}

/**
 * Accompagnements proposés avec un plat, pris dans la vraie carte (donc avec leurs vrais prix) :
 * boissons, frites et autres accompagnements, milkshakes et desserts. Les sauces et le plat lui-même sont exclus.
 */
export function getAccompaniments(product: Product, catalog: Product[]): Product[] {
  if (!getProductOptions(product)) return []
  const rank = (candidate: Product) => (isDrink(candidate) ? 0 : /milkshake|dessert|glace/.test(normalize(candidate.name)) ? 2 : 1)
  return catalog
    .filter((candidate) => {
      if (candidate.code === product.code || !candidate.is_available) return false
      const label = `${normalize(candidate.name)} ${normalize(candidate.category_name)}`
      if (label.includes('sauce')) return false
      return isDrink(candidate) || /accompagnement|frite|milkshake|dessert|glace/.test(label)
    })
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, 12)
}
