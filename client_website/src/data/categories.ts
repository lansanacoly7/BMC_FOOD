export interface CategoryItem {
  id: string
  name: string
  image: string
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: 'all',
    name: 'Tout voir',
    image: '/images/products/tacos-viande-pane.webp',
  },
  {
    id: 'tacos-panes',
    name: 'Tacos panés',
    image: '/images/products/tacos-mixte-pane.webp',
  },
  {
    id: 'burgers',
    name: 'Burgers',
    image: '/images/products/burger-bmc-complet.webp',
  },
  {
    id: 'tacos-simples',
    name: 'Tacos simples',
    image: '/images/products/tacos-poulet-pane.webp',
  },
  {
    id: 'boissons',
    name: 'Boissons',
    image: '/images/products/boissons-fraiches.webp',
  },
  {
    id: 'sauces',
    name: 'Sauces',
    image: '/images/products/sauces-assortiment.webp',
  },
]
