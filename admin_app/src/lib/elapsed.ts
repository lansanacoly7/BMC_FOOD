/**
 * Temps écoulé depuis une date ISO : « 3 min », « 1h 25min », « 2h+ ».
 * Rend aussi un niveau d'urgence pour piloter la couleur du timer sur les cartes.
 */

export type UrgencyLevel = 'normal' | 'warning' | 'urgent' | 'critical'

export interface ElapsedInfo {
  /** Libellé lisible, ex. « 12 min » */
  label: string
  /** Nombre total de minutes écoulées */
  minutes: number
  /** Niveau d'urgence pour la couleur du timer */
  urgency: UrgencyLevel
}

/**
 * Seuils en minutes, ajustés pour un restaurant de fast-casual :
 * - < 10 min : normal (bleu ice #1DC8F2)
 * - 10–19 min : warning (or #FCB800)
 * - 20–29 min : urgent (braise #CF4A08)
 * - >= 30 min : critical (rouge, pulse)
 */
export function getElapsedInfo(isoDate: string): ElapsedInfo {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60_000))

  let label: string
  if (totalMinutes < 60) {
    label = `${totalMinutes} min`
  } else {
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    label = m > 0 ? `${h}h ${m}min` : `${h}h`
  }

  let urgency: UrgencyLevel
  if (totalMinutes < 10) urgency = 'normal'
  else if (totalMinutes < 20) urgency = 'warning'
  else if (totalMinutes < 30) urgency = 'urgent'
  else urgency = 'critical'

  return { label, minutes: totalMinutes, urgency }
}
