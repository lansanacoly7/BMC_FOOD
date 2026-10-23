import type { KdsOrder } from '../types/kds'

/**
 * Jeu de données de démonstration réaliste pour le KDS BMC FOOD (Dakar, Sénégal)
 * Conçu pour tester les 4 colonnes, la lisibilité à distance, et les 3 seuils de chrono :
 * - Normal (< 10 min)
 * - Attention (10 - 15 min, ambre)
 * - Retard critique (> 15 min, rouge vif avec pulsation douce)
 */

const now = Date.now()
const minutesAgo = (mins: number) => new Date(now - mins * 60 * 1000).toISOString()

export const MOCK_KDS_ORDERS: KdsOrder[] = [
  // =========================================================================
  // COLONNE 1 : À PRÉPARER (pending)
  // =========================================================================
  {
    id: 123,
    orderRef: '#BMC-0123',
    customerName: 'Fatou Sall',
    phone: '+221 77 654 32 10',
    address: 'Mermoz, Rue MZ-14, Immeuble Horizon Appt 3B',
    notes: 'Piment bien séparé svp. Sonner à l’interphone Sall.',
    orderType: 'delivery',
    status: 'pending',
    paymentMethod: 'wave',
    paymentStatus: 'paid',
    totalAmount: 14500,
    createdAt: minutesAgo(3), // 3 min : Normal
    isNew: true, // Badge NOUVEAU
    items: [
      {
        id: 1,
        code: 'grill-1',
        name: 'Poulet Braisé Entier au Feu de Bois',
        quantity: 1,
        unitPrice: 8500,
        options: ['Sauce verte BMC', 'Oignons caramélisés'],
        notes: 'Bien cuit, peau croustillante',
      },
      {
        id: 2,
        code: 'side-2',
        name: 'Portion Alloco Banane Plantain',
        quantity: 2,
        unitPrice: 2000,
        options: ['Sauce piment à part'],
      },
      {
        id: 3,
        code: 'drink-1',
        name: 'Jus de Bissap Maison Menthe 50cl',
        quantity: 2,
        unitPrice: 1000,
      },
    ],
  },
  {
    id: 124,
    orderRef: '#BMC-0124',
    customerName: 'Moussa Diop',
    phone: '+221 78 901 23 45',
    address: 'Point E, Rue 5 × Boulevard de l’Est',
    notes: 'Pas d’oignons crus dans la garniture.',
    orderType: 'delivery',
    status: 'pending',
    paymentMethod: 'orange_money',
    paymentStatus: 'paid',
    totalAmount: 11000,
    createdAt: minutesAgo(11), // 11 min : Attention (Ambre)
    items: [
      {
        id: 4,
        code: 'grill-3',
        name: 'Dibiterie Agneau BMC (500g)',
        quantity: 1,
        unitPrice: 9000,
        options: ['Piment fort', 'Moutarde douce'],
        notes: 'Sans oignons crus',
      },
      {
        id: 5,
        code: 'drink-2',
        name: 'Jus de Bouye Frais 50cl',
        quantity: 2,
        unitPrice: 1000,
      },
    ],
  },
  {
    id: 125,
    orderRef: '#BMC-0125',
    customerName: 'Cheikh Ndiaye',
    phone: '+221 70 889 00 12',
    address: 'Sur place · Table 04',
    notes: 'Client pressé, pause déjeuner.',
    orderType: 'dine_in',
    status: 'pending',
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    totalAmount: 7500,
    createdAt: minutesAgo(17), // 17 min : RETARD CRITIQUE (Rouge pulsant)
    items: [
      {
        id: 6,
        code: 'grill-2',
        name: 'Demi-Poulet Braisé & Frites Maison',
        quantity: 1,
        unitPrice: 5500,
        options: ['Sauce Barbecue Maison'],
      },
      {
        id: 7,
        code: 'drink-3',
        name: 'Canette Gazouz Pamplemousse',
        quantity: 2,
        unitPrice: 1000,
      },
    ],
  },

  // =========================================================================
  // COLONNE 2 : EN CUISINE / AU GRIL (preparing)
  // =========================================================================
  {
    id: 120,
    orderRef: '#BMC-0120',
    customerName: 'Awa Diallo',
    phone: '+221 76 543 21 09',
    address: 'Almadies, En face Ambassade USA, Villa 12',
    notes: 'Portail noir en fer forgé. Appeler à l’arrivée.',
    orderType: 'delivery',
    status: 'preparing',
    paymentMethod: 'wave',
    paymentStatus: 'paid',
    totalAmount: 22000,
    createdAt: minutesAgo(7), // 7 min : Normal
    items: [
      {
        id: 8,
        code: 'grill-1',
        name: 'Poulet Braisé Entier au Feu de Bois',
        quantity: 2,
        unitPrice: 8500,
        notes: 'Bien doré au feu doux',
      },
      {
        id: 9,
        code: 'side-1',
        name: 'Portion d’Attiéké de Grand-Bassam',
        quantity: 2,
        unitPrice: 1500,
      },
      {
        id: 10,
        code: 'drink-1',
        name: 'Jus de Bissap Maison Menthe 50cl',
        quantity: 2,
        unitPrice: 1000,
      },
    ],
  },
  {
    id: 121,
    orderRef: '#BMC-0121',
    customerName: 'Ibrahima Sow',
    phone: '+221 77 412 88 90',
    address: 'À emporter · Comptoir Retrait',
    notes: 'Prêt pour 13h15 impératif.',
    orderType: 'takeaway',
    status: 'preparing',
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    totalAmount: 9500,
    createdAt: minutesAgo(13), // 13 min : Attention (Ambre)
    items: [
      {
        id: 11,
        code: 'grill-4',
        name: 'Brochettes de Filet de Bœuf (×4)',
        quantity: 1,
        unitPrice: 7500,
        options: ['Sauce au poivre noir de Casamance'],
        notes: 'Cuisson à point',
      },
      {
        id: 12,
        code: 'side-2',
        name: 'Portion Alloco Banane Plantain',
        quantity: 1,
        unitPrice: 2000,
      },
    ],
  },
  {
    id: 122,
    orderRef: '#BMC-0122',
    customerName: 'Mariama Bâ',
    phone: '+221 78 220 54 31',
    address: 'Plateau, 18 Avenue Léopold Sédar Senghor',
    notes: 'Commande bureau DG · Couverts svp.',
    orderType: 'delivery',
    status: 'preparing',
    paymentMethod: 'wave',
    paymentStatus: 'paid',
    totalAmount: 18000,
    createdAt: minutesAgo(21), // 21 min : RETARD CRITIQUE (Rouge pulsant)
    items: [
      {
        id: 13,
        code: 'grill-3',
        name: 'Dibiterie Agneau BMC (500g)',
        quantity: 2,
        unitPrice: 9000,
        notes: 'Beaucoup de sauce moutarde et piment sec',
      },
    ],
  },

  // =========================================================================
  // COLONNE 3 : PRÊT À RÉCUPÉRER (ready)
  // =========================================================================
  {
    id: 118,
    orderRef: '#BMC-0118',
    customerName: 'Ousmane Fall',
    phone: '+221 77 301 99 22',
    address: 'Ouakam, Cité Avion, Villa 88',
    notes: 'Livreur Modou assigné.',
    orderType: 'delivery',
    status: 'ready',
    paymentMethod: 'orange_money',
    paymentStatus: 'paid',
    totalAmount: 12500,
    createdAt: minutesAgo(9), // 9 min : Normal
    items: [
      {
        id: 14,
        code: 'grill-1',
        name: 'Poulet Braisé Entier au Feu de Bois',
        quantity: 1,
        unitPrice: 8500,
      },
      {
        id: 15,
        code: 'side-2',
        name: 'Portion Alloco Banane Plantain',
        quantity: 2,
        unitPrice: 2000,
      },
    ],
  },
  {
    id: 119,
    orderRef: '#BMC-0119',
    customerName: 'Khady Guèye',
    phone: '+221 76 890 12 34',
    address: 'Sur place · Table 02 (Terrasse)',
    orderType: 'dine_in',
    status: 'ready',
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    totalAmount: 6500,
    createdAt: minutesAgo(14), // 14 min : Attention (Ambre)
    items: [
      {
        id: 16,
        code: 'grill-2',
        name: 'Demi-Poulet Braisé & Frites Maison',
        quantity: 1,
        unitPrice: 5500,
      },
      {
        id: 17,
        code: 'drink-1',
        name: 'Jus de Bissap Maison Menthe 50cl',
        quantity: 1,
        unitPrice: 1000,
      },
    ],
  },

  // =========================================================================
  // COLONNE 4 : EN LIVRAISON (delivering)
  // =========================================================================
  {
    id: 116,
    orderRef: '#BMC-0116',
    customerName: 'Mamadou Cissé',
    phone: '+221 77 554 11 00',
    address: 'Ngor Virage, Résidence Marina Appt 12',
    notes: 'Livreur Samba en route (Scooter Yamaha #3).',
    orderType: 'delivery',
    status: 'delivering',
    paymentMethod: 'wave',
    paymentStatus: 'paid',
    totalAmount: 19500,
    createdAt: minutesAgo(24),
    items: [
      {
        id: 18,
        code: 'grill-1',
        name: 'Poulet Braisé Entier au Feu de Bois',
        quantity: 2,
        unitPrice: 8500,
      },
      {
        id: 19,
        code: 'side-1',
        name: 'Portion d’Attiéké de Grand-Bassam',
        quantity: 1,
        unitPrice: 1500,
      },
      {
        id: 20,
        code: 'drink-2',
        name: 'Jus de Bouye Frais 50cl',
        quantity: 1,
        unitPrice: 1000,
      },
    ],
  },
  {
    id: 117,
    orderRef: '#BMC-0117',
    customerName: 'Aminata Bâ',
    phone: '+221 78 632 09 88',
    address: 'Fann Résidence, Rue des Eucalyptus',
    orderType: 'delivery',
    status: 'delivering',
    paymentMethod: 'orange_money',
    paymentStatus: 'paid',
    totalAmount: 13000,
    createdAt: minutesAgo(32),
    items: [
      {
        id: 21,
        code: 'grill-3',
        name: 'Dibiterie Agneau BMC (500g)',
        quantity: 1,
        unitPrice: 9000,
      },
      {
        id: 22,
        code: 'side-2',
        name: 'Portion Alloco Banane Plantain',
        quantity: 2,
        unitPrice: 2000,
      },
    ],
  },

  // =========================================================================
  // HISTORIQUE (delivered / cancelled)
  // =========================================================================
  {
    id: 112,
    orderRef: '#BMC-0112',
    customerName: 'Babacar Sy',
    phone: '+221 77 120 44 55',
    address: 'Médina, Rue 22 × Blaise Diagne',
    orderType: 'delivery',
    status: 'delivered',
    paymentMethod: 'wave',
    paymentStatus: 'paid',
    totalAmount: 15000,
    createdAt: minutesAgo(65),
    items: [
      {
        id: 23,
        code: 'grill-1',
        name: 'Poulet Braisé Entier au Feu de Bois',
        quantity: 1,
        unitPrice: 8500,
      },
      {
        id: 24,
        code: 'side-2',
        name: 'Portion Alloco Banane Plantain',
        quantity: 2,
        unitPrice: 2000,
      },
      {
        id: 25,
        code: 'drink-1',
        name: 'Jus de Bissap Maison Menthe 50cl',
        quantity: 2,
        unitPrice: 1000,
      },
    ],
  },
  {
    id: 113,
    orderRef: '#BMC-0113',
    customerName: 'Seynabou Faye',
    phone: '+221 76 770 12 90',
    address: 'Sur place · Table 01',
    orderType: 'dine_in',
    status: 'delivered',
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    totalAmount: 8500,
    createdAt: minutesAgo(75),
    items: [
      {
        id: 26,
        code: 'grill-1',
        name: 'Poulet Braisé Entier au Feu de Bois',
        quantity: 1,
        unitPrice: 8500,
      },
    ],
  },
  {
    id: 114,
    orderRef: '#BMC-0114',
    customerName: 'Abdoulaye Wade',
    phone: '+221 70 334 55 66',
    address: 'Yoff Tonghor, Plage',
    notes: 'Commande annulée par le client avant cuisson.',
    orderType: 'delivery',
    status: 'cancelled',
    paymentMethod: 'wave',
    paymentStatus: 'unpaid',
    totalAmount: 16000,
    createdAt: minutesAgo(90),
    items: [
      {
        id: 27,
        code: 'grill-4',
        name: 'Brochettes de Filet de Bœuf (×4)',
        quantity: 2,
        unitPrice: 7500,
      },
      {
        id: 28,
        code: 'drink-1',
        name: 'Jus de Bissap Maison Menthe 50cl',
        quantity: 1,
        unitPrice: 1000,
      },
    ],
  },
]
