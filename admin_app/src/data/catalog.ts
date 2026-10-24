export interface CatalogItem {
  id: number
  code: string
  name: string
  category: string
  price: number
  image_url: string
  description: string
}

export const BMC_CATALOG: CatalogItem[] = [
  // --- Tacos Panés ---
  {
    id: 1,
    code: 'tp-1',
    name: 'Tacos viande pané',
    category: 'Tacos panés',
    price: 3500,
    image_url: '/images/products/tacos-viande-pane.webp',
    description: 'Viande hachée assaisonnée, frites croustillantes, sauce fromagère maison et panure dorée.',
  },
  {
    id: 2,
    code: 'tp-2',
    name: 'Tacos poulet pané',
    category: 'Tacos panés',
    price: 3500,
    image_url: '/images/products/tacos-poulet-pane.webp',
    description: 'Morceaux de filet de poulet mariné, frites fraîches, sauce blanche gourmet et gratiné doré.',
  },
  {
    id: 3,
    code: 'tp-3',
    name: 'Tacos mixte pané',
    category: 'Tacos panés',
    price: 4000,
    image_url: '/images/products/tacos-mixte-pane.webp',
    description: 'Duo savoureux viande hachée & poulet mariné, sauce fromagère maison et panure croustillante.',
  },
  {
    id: 4,
    code: 'tp-4',
    name: 'Tacos cordon bleu pané',
    category: 'Tacos panés',
    price: 4500,
    image_url: '/images/products/tacos-cordon-bleu-pane.webp',
    description: 'Cordon bleu croustillant émincé, jambon de dinde fumé, fromage fondant et frites.',
  },
  // --- Burgers ---
  {
    id: 5,
    code: 'bg-1',
    name: 'Burger BMC Complet',
    category: 'Burgers',
    price: 4500,
    image_url: '/images/products/burger-bmc-complet.webp',
    description: 'Steak pur bœuf braisé minute, cheddar fondant, œuf à cheval, bacon de bœuf et sauce secrète.',
  },
  {
    id: 6,
    code: 'bg-2',
    name: 'Burger Poulet Crispy',
    category: 'Burgers',
    price: 4000,
    image_url: '/images/products/burger-poulet-crispy.webp',
    description: 'Filet de poulet ultra pané croustillant, pickles croquants, cheddar et sauce mayonnaise relevée.',
  },
  {
    id: 7,
    code: 'bg-3',
    name: 'Smash Burger Double Cheese',
    category: 'Burgers',
    price: 4500,
    image_url: '/images/products/smash-burger-double.webp',
    description: 'Deux steaks de bœuf smashés caramélisés, double tranche de cheddar mature, oignons fondants.',
  },
  // --- Tacos Simples ---
  {
    id: 8,
    code: 'ts-1',
    name: 'Tacos Simple Viande',
    category: 'Tacos simples',
    price: 3000,
    image_url: '/images/products/tacos-simple-viande.webp',
    description: 'Galette de blé toastée, viande hachée épicée, frites et notre onctueuse sauce fromagère.',
  },
  {
    id: 9,
    code: 'ts-2',
    name: 'Tacos Simple Poulet',
    category: 'Tacos simples',
    price: 3000,
    image_url: '/images/products/tacos-simple-poulet.webp',
    description: 'Poulet émincé mariné aux herbes, frites maison et sauce algérienne relevée.',
  },
  // --- Poulet & Finger Food ---
  {
    id: 10,
    code: 'ff-1',
    name: 'Box 6 Tenders Croustillants',
    category: 'Poulet & Finger Food',
    price: 3500,
    image_url: '/images/products/tenders-box.webp',
    description: 'Filets de poulet panés minute aux épices douces servis avec sauce barbecue et sauce blanche.',
  },
  {
    id: 11,
    code: 'ff-2',
    name: 'Box 8 Wings Épicées',
    category: 'Poulet & Finger Food',
    price: 4000,
    image_url: '/images/products/wings-box.webp',
    description: 'Ailes de poulet marinées et grillées, enrobées de sauce piquante maison.',
  },
  // --- Boissons & Desserts ---
  {
    id: 12,
    code: 'bv-1',
    name: 'Bissap Royal Glacé (50cl)',
    category: 'Boissons',
    price: 1000,
    image_url: '/images/products/bissap-royal.webp',
    description: 'Jus d’hibiscus frais infusé à la menthe poivrée et vanille naturelle, servi très frais.',
  },
  {
    id: 13,
    code: 'bv-2',
    name: 'Bouye Onctueux (50cl)',
    category: 'Boissons',
    price: 1200,
    image_url: '/images/products/bouye-frais.webp',
    description: 'Jus de pain de singe (fruit du baobab) velouté, parfumé à la muscade et fleur d’oranger.',
  },
]
