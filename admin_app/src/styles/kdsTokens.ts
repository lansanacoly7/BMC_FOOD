/**
 * Seuils de l'écran cuisine. Les couleurs vivent dans index.css (.theme-dark).
 */

export interface ChronoThresholds {
  warningMinutes: number
  dangerMinutes: number // Seuil Retard (Rouge) : 15 min
}

/** Au-delà de ce nombre de tickets, une colonne passe en affichage compact. */
export const KDS_COMPACT_THRESHOLD = 12

export const DEFAULT_KDS_THRESHOLDS: ChronoThresholds = {
  warningMinutes: 10,
  dangerMinutes: 15,
}
