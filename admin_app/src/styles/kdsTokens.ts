/**
 * BMC FOOD KDS - Design Tokens Officiels
 * Spécifications "Écran de chaîne de restauration" (QSR / Fast-food & Grillades).
 * Lisible à 2 mètres, mains occupées. Zéro décoration superflue.
 */

export interface ChronoThresholds {
  warningMinutes: number // Seuil Attention (Jaune) : 10 min
  dangerMinutes: number  // Seuil Retard (Rouge) : 15 min
}

export const DEFAULT_KDS_THRESHOLDS: ChronoThresholds = {
  warningMinutes: 10,
  dangerMinutes: 15,
}

export const KDS_TOKENS = {
  // 1. PALETTE DE COULEURS FONDAMENTALE
  colors: {
    bgPage: '#0E1116',
    surfaceTicket: '#1A1F27',
    surfaceSubtle: '#13171E',
    surfaceHover: '#232934',
    borderDefault: '#262D38',
    borderStrong: '#3A4454',

    textPrimary: '#FFFFFF',
    textSecondary: '#9AA4B2',
    textMuted: '#687385',

    // 2. ÉTATS DU TICKET (L'en-tête entier porte la couleur d'état)
    stateNew: '#2F6FED',         // Nouveau (0 -> 10 min) : Bleu franc, texte blanc
    stateNewText: '#FFFFFF',

    stateWarning: '#F5B800',     // Attention (10 -> 15 min) : Jaune éclatant, texte noir
    stateWarningText: '#0E1116',

    stateLate: '#E5362B',        // En retard (> 15 min) : Rouge saturé, texte blanc
    stateLateText: '#FFFFFF',

    stateReady: '#1FA855',       // Prête / terminée : Vert franc, texte blanc
    stateReadyText: '#FFFFFF',

    // 3. TYPES DE COMMANDE (Bordure latérale gauche de 6 px)
    typeDelivery: '#8B5CF6',     // Livraison : Violet
    typeTakeaway: '#FB923C',     // À emporter : Orange braise
    typeDineIn: '#14B8A6',       // Sur place : Turquoise

    // 4. BANDES SPÉCIALES & REMARQUES CUISINE
    noteBannerBg: '#FEF3C7',     // Note de commande : Bande jaune pâle
    noteBannerText: '#1E293B',   // Texte noir/sombre sur jaune pâle
    kitchenRemark: '#F5B800',    // Remarques cuisine (cuisson, oignons) : Jaune vif gras

    // 5. ACCENTS
    accentGold: '#F5B800',
  },

  // 2. ÉCHELLE TYPOGRAPHIQUE STRICTE
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    ticketNumber: '32px',       // #numéro extra-gras
    dishName: '20px',           // Nom des plats semi-gras
    kitchenRemark: '16px',      // Remarques cuisine gras
    dishOption: '15px',         // Options gris
    counterNumber: '28px',      // Compteurs géants
  },

  // 3. SEUILS TEMPORELS
  thresholds: DEFAULT_KDS_THRESHOLDS,

  // 4. HAUTEURS TACTILES FAST-FOOD (Hands-busy)
  touchHeights: {
    itemLine: '56px',           // Zone tactile plat barrable (min 56px)
    actionButton: '56px',       // Bouton d'action principal pleine largeur (56px)
    header: '48px',             // En-tête de ticket bumpable
    trayTile: '44px',           // Tuiles prêtes à remettre
  },

  // 5. BORDURES INDICATEUR
  borders: {
    typeIndicatorWidth: '6px',  // Bordure gauche du ticket
    radiusTicket: '8px',
    radiusButton: '6px',
    radiusPill: '9999px',
  },
} as const
