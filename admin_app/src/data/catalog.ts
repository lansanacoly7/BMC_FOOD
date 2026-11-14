export interface CatalogItem {
  id: number
  name: string
  category: string
  price: number
  image_url: string
}

/** Carte du menu BMC Food (identique à celle du site client). */
export const BMC_CATALOG: CatalogItem[] = [
  { id: 1, name: 'Tacos viande pané', category: 'Tacos panés', price: 3500, image_url: '/images/products/tacos-viande-pane.webp' },
  { id: 2, name: 'Tacos poulet pané', category: 'Tacos panés', price: 3500, image_url: '/images/products/tacos-poulet-pane.webp' },
  { id: 3, name: 'Tacos mixte pané', category: 'Tacos panés', price: 4000, image_url: '/images/products/tacos-mixte-pane.webp' },
  { id: 4, name: 'Tacos cordon bleu pané', category: 'Tacos panés', price: 4000, image_url: '/images/products/tacos-cordon-bleu-pane.webp' },
  { id: 5, name: 'Burger BMC complet', category: 'Burgers', price: 2500, image_url: '/images/products/burger-bmc-complet.webp' },
  { id: 6, name: 'Burger cheese simple', category: 'Burgers', price: 2000, image_url: '/images/products/burger-cheese-simple.webp' },
  { id: 7, name: 'Burger poulet croustillant', category: 'Burgers', price: 2500, image_url: '/images/products/burger-poulet-crispy.webp' },
  { id: 8, name: 'Tacos simple viande hachée', category: 'Tacos simples', price: 2500, image_url: '/images/products/tacos-viande-pane.webp' },
  { id: 9, name: 'Tacos simple poulet', category: 'Tacos simples', price: 2500, image_url: '/images/products/tacos-poulet-pane.webp' },
  { id: 10, name: 'Sandwich Chawarma Dakar', category: 'Tacos simples', price: 2000, image_url: '/images/products/sandwich-chawarma.webp' },
  { id: 14, name: 'Tenders de poulet (x5)', category: 'Poulet', price: 3000, image_url: '/images/products/tenders-poulet.webp' },
  { id: 15, name: 'Ailes de poulet BBQ (x6)', category: 'Poulet', price: 3000, image_url: '/images/products/chicken-wings-bbq.webp' },
  { id: 16, name: 'Frites maison', category: 'Accompagnements', price: 1000, image_url: '/images/products/frites-maison.webp' },
  { id: 17, name: 'Pastels au poisson (x5)', category: 'Accompagnements', price: 1500, image_url: '/images/products/pastels-dakar.webp' },
]
