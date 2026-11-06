/**
 * BMC FOOD KDS - Palette Unique & Épurée
 * Règle stricte :
 * - Fond de page : #0F1115
 * - Surface (colonnes, tickets) : #181B22
 * - Bordures : #262A33
 * - Texte principal : #F2F4F7
 * - Texte secondaire : #8A93A3
 * - Accent (UNE seule couleur) : #F59E0B
 * - Alerte (retard uniquement) : #EF4444
 * - Exception : point vert "En direct"
 * Zéro bleu, zéro violet, zéro turquoise, zéro orange, zéro jaune, zéro ambre ailleurs.
 */

export interface ChronoThresholds {
  warningMinutes: number
  dangerMinutes: number // Seuil Retard (Rouge) : 15 min
}

export const DEFAULT_KDS_THRESHOLDS: ChronoThresholds = {
  warningMinutes: 10,
  dangerMinutes: 15,
}

export const KDS_TOKENS = {
  colors: {
    bgPage: '#0F1115',
    surface: '#181B22',
    surfaceSubtle: '#13151A',
    surfaceHover: '#1F232C',
    border: '#262A33',

    textPrimary: '#F2F4F7',
    textSecondary: '#8A93A3',
    textMuted: '#5E6676',

    accent: '#F59E0B',
    accentHover: '#D97706',
    alert: '#EF4444',
    liveGreen: '#22C55E',
  },

  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    ticketNumber: '22px',
    dishName: '17px',
    kitchenRemark: '14px',
    dishOption: '13px',
    customerLine: '14px',
  },

  thresholds: DEFAULT_KDS_THRESHOLDS,

  touchHeights: {
    actionButton: '48px',
    columnHeader: '40px',
  },

  borders: {
    radiusTicket: '10px',
    radiusButton: '6px',
    radiusPill: '9999px',
  },
} as const
