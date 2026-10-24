import type { Product } from '../types'

const CODE_TO_IMAGE: Record<string, string> = {
  // Tacos Panés
  'tp-1': '/images/products/tacos-viande-pane.webp',
  'tp-2': '/images/products/tacos-poulet-pane.webp',
  'tp-3': '/images/products/tacos-mixte-pane.webp',
  'tp-4': '/images/products/tacos-jambon-pane.webp',
  'tp-viande': '/images/products/tacos-viande-pane.webp',
  'tp-poulet': '/images/products/tacos-poulet-pane.webp',
  'tp-mixte': '/images/products/tacos-mixte-pane.webp',
  'tp-cordon-bleu': '/images/products/tacos-cordon-bleu-pane.webp',

  // Tacos jambon pané
  'tjp-1': '/images/products/tacos-viande-jambon-pane.webp',
  'tjp-2': '/images/products/tacos-poulet-jambon-pane.webp',
  'tjp-3': '/images/products/tacos-mixte-jambon-pane.webp',

  // Tacos Royal pané
  'trp-1': '/images/products/tacos-viande-jambon-royal-pane.webp',
  'trp-2': '/images/products/tacos-poulet-jambon-royal-pane.webp',
  'trp-3': '/images/products/tacos-mixte-jambon-royal-pane.webp',
  'trp-4': '/images/products/tacos-viande-royal-pane.webp',
  'trp-5': '/images/products/tacos-poulet-royal-pane.webp',
  'trp-6': '/images/products/tacos-mixte-royal-pane.webp',

  // Tacos Hot Dog pané
  'thp-1': '/images/products/tacos-viande-hot-dog-pane.webp',
  'thp-2': '/images/products/tacos-poulet-hot-dog-pane.webp',
  'thp-3': '/images/products/tacos-mixte-hot-dog-pane.webp',
  'thp-4': '/images/products/tacos-viande-hot-dog-royal-pane.webp',
  'thp-5': '/images/products/tacos-poulet-hot-dog-royal-pane.webp',
  'thp-6': '/images/products/tacos-mixte-hot-dog-royal-pane.webp',

  // Tacos XL pané
  'txl-1': '/images/products/tacos-xl-pane.webp',

  // Burgers
  'bg-1': '/images/products/burger-complet.webp',
  'bg-2': '/images/products/double-burger.webp',
  'bg-3': '/images/products/burger-jambon.webp',
  'bg-4': '/images/products/burger-royal.webp',
  'bg-complet': '/images/products/burger-bmc-complet.webp',
  'bg-crispy': '/images/products/burger-poulet-crispy.webp',
  'bg-cheese': '/images/products/burger-cheese-simple.webp',

  // Tacos simples
  'ts-1': '/images/products/tacos-viande.webp',
  'ts-2': '/images/products/tacos-poulet.webp',
  'ts-3': '/images/products/tacos-mixte.webp',
  'ts-4': '/images/products/tacos-jambon.webp',
  'ts-5': '/images/products/tacos-viande-jambon.webp',
  'ts-6': '/images/products/tacos-poulet-jambon.webp',
  'ts-7': '/images/products/tacos-mixte-jambon.webp',
  'ts-8': '/images/products/tacos-viande-jambon-royal.webp',
  'ts-9': '/images/products/tacos-poulet-jambon-royal.webp',
  'ts-10': '/images/products/tacos-mixte-jambon-royal.webp',
  'ts-11': '/images/products/tacos-viande-royal.webp',
  'ts-12': '/images/products/tacos-poulet-royal.webp',
  'ts-13': '/images/products/tacos-mixte-royal.webp',
  'ts-14': '/images/products/tacos-viande-hot-dog.webp',
  'ts-15': '/images/products/tacos-poulet-hot-dog.webp',
  'ts-16': '/images/products/tacos-mixte-hot-dog.webp',
  'ts-17': '/images/products/tacos-viande-hot-dog-royal.webp',
  'ts-18': '/images/products/tacos-poulet-hot-dog-royal.webp',
  'ts-19': '/images/products/tacos-xl-simple.webp',

  // Finger food & accompagnements
  'td-poulet': '/images/products/tenders-poulet.webp',
  'td-1': '/images/products/tenders-poulet.webp',
  'ck-wings': '/images/products/chicken-wings-bbq.webp',
  'fr-maison': '/images/products/frites-maison.webp',
  'fr-1': '/images/products/frites-maison.webp',
  'sc-assortiment': '/images/products/sauces-assortiment.webp',
  'sc-1': '/images/products/sauces-assortiment.webp',
  'bb-fraiches': '/images/products/boissons-fraiches.webp',
  'bb-1': '/images/products/boissons-fraiches.webp',
  'bv-2': '/images/products/canette-bissap-bmc.webp',
  'bv-3': '/images/products/canette-bouye-bmc.webp',
  'bv-4': '/images/products/canette-mangue-bmc.webp',
  'bv-5': '/images/products/canette-tamarin-bmc.webp',
  'bv-6': '/images/products/canette-the-glace-bmc.webp',
  'bv-7': '/images/products/canette-chocolat-bmc.webp',
}

/**
 * Résout de façon garantie l'URL d'image d'un produit BMC Food.
 * Si le backend Django renvoie une chaîne vide ou invalide, cette fonction
 * trouve l'image WebP officielle correspondante par code ou nom.
 */
export function getProductImageUrl(product: Partial<Product>): string {
  if (product.image_url && product.image_url.trim() !== '') {
    return product.image_url
  }

  const code = (product.code || '').toLowerCase().trim()
  if (code && CODE_TO_IMAGE[code]) {
    return CODE_TO_IMAGE[code]
  }

  const name = (product.name || '').toLowerCase()
  const cat = (product.category_name || '').toLowerCase()

  if (name.includes('burger') || cat.includes('burger')) {
    if (name.includes('double')) return '/images/products/double-burger.webp'
    if (name.includes('jambon')) return '/images/products/burger-jambon.webp'
    if (name.includes('royal')) return '/images/products/burger-royal.webp'
    if (name.includes('crispy') || name.includes('poulet')) return '/images/products/burger-poulet-crispy.webp'
    return '/images/products/burger-bmc-complet.webp'
  }

  if (name.includes('tender') || name.includes('wing') || cat.includes('poulet')) {
    if (name.includes('wing')) return '/images/products/chicken-wings-bbq.webp'
    return '/images/products/tenders-poulet.webp'
  }

  if (name.includes('frite') || cat.includes('accompagnement')) {
    return '/images/products/frites-maison.webp'
  }

  if (name.includes('sauce') || cat.includes('sauce')) {
    return '/images/products/sauces-assortiment.webp'
  }

  if (cat.includes('boisson') || name.includes('canette')) {
    if (name.includes('bissap')) return '/images/products/canette-bissap-bmc.webp'
    if (name.includes('bouye')) return '/images/products/canette-bouye-bmc.webp'
    if (name.includes('mangue')) return '/images/products/canette-mangue-bmc.webp'
    if (name.includes('tamarin')) return '/images/products/canette-tamarin-bmc.webp'
    if (name.includes('thé') || name.includes('the glac')) return '/images/products/canette-the-glace-bmc.webp'
    if (name.includes('chocolat')) return '/images/products/canette-chocolat-bmc.webp'
  }

  if (name.includes('boisson') || name.includes('soda') || name.includes('eau') || cat.includes('boisson')) {
    return '/images/products/boissons-fraiches.webp'
  }

  if (name.includes('glace') || name.includes('dessert') || cat.includes('dessert')) {
    return '/images/products/dessert-glace-gourmande.webp'
  }

  // Par défaut : Tacos pané signature
  if (name.includes('poulet')) return '/images/products/tacos-poulet-pane.webp'
  if (name.includes('mixte')) return '/images/products/tacos-mixte-pane.webp'
  if (name.includes('jambon')) return '/images/products/tacos-jambon-pane.webp'
  return '/images/products/tacos-viande-pane.webp'
}
