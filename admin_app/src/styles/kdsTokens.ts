/**
 * BMC FOOD KDS - Design Tokens Officiels
 * Spécifications KDS 3 Colonnes (À préparer / En cuisson / Prêt)
 * Règle de couleur stricte :
 * - Bleu (#3B82F6) / Ambre (#F59E0B) / Vert (#22C55E) = étapes de préparation (en-têtes de colonnes et boutons).
 * - Rouge (#EF4444) = retard (> 15 min : chrono + fine bordure 2px).
 * - Neutres : fond #0E1116, tickets #1A1F27, bordures #262D38, texte #FFFFFF / #9AA4B2.
 * - Zéro violet, turquoise ou orange.
 */

export interface ChronoThresholds {
  warningMinutes: number // Seuil Attention (Ambre) : 10 min
  dangerMinutes: number  // Seuil Retard (Rouge) : 15 min
}

export const DEFAULT_KDS_THRESHOLDS: ChronoThresholds = {
  warningMinutes: 10,
  dangerMinutes: 15,
}

export const KDS_TOKENS = {
  colors: {
    // Fond et surfaces
    bgPage: '#0E1116',
    surfaceTicket: '#1A1F27',
    surfaceSubtle: '#13171E',
    surfaceHover: '#232934',
    borderDefault: '#262D38',
    borderStrong: '#3A4454',

    // Textes neutres
    textPrimary: '#FFFFFF',
    textSecondary: '#9AA4B2',
    textMuted: '#687385',

    // Étapes de travail (colonnes et boutons)
    stepPending: '#3B82F6',    // À préparer : Bleu
    stepPreparing: '#F59E0B',  // En cuisson : Ambre
    stepReady: '#22C55E',      // Prêt : Vert

    // Urgence temporelle (chrono et bordure uniquement)
    chronoNormal: '#9AA4B2',   // < 10 min : Gris
    chronoWarning: '#F59E0B',  // 10-15 min : Ambre
    chronoDanger: '#EF4444',   // > 15 min : Rouge
    chronoDangerBg: '#2D1214', // Fond rouge très sombre pour chrono retard
    borderDanger: '#EF4444',   // Fine bordure 2px si retard

    // Notes de commande (bande ambre pâle, texte ambre)
    noteBg: '#3A2E12',
    noteText: '#F5C451',
    noteBorder: '#524119',

    // Remarques cuisine
    kitchenRemark: '#F59E0B',
  },

  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    ticketNumber: '22px',       // #numéro gras
    dishName: '17px',           // Nom des plats semi-gras
    kitchenRemark: '14px',      // Remarques cuisine gras
    dishOption: '13px',         // Options gris
    customerLine: '14px',       // Ligne client
  },

  thresholds: DEFAULT_KDS_THRESHOLDS,

  touchHeights: {
    actionButton: '48px',       // Bouton principal pleine largeur (48px)
    columnHeader: '44px',       // En-tête de colonne coloré
  },

  borders: {
    radiusTicket: '10px',
    radiusButton: '6px',
    radiusPill: '9999px',
  },
} as const
