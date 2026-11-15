/**
 * Horaires d'ouverture BMC Food Dakar : du mardi au dimanche, 11h00 – 02h00. Fermé le lundi.
 * Le service d'un soir déborde après minuit : lundi à 1h, on sert encore le service du dimanche.
 *
 * Tout est calculé à l'heure de Dakar (Africa/Dakar), jamais à l'heure de l'ordinateur du client :
 * un client à l'étranger ou une horloge mal réglée ne doivent pas changer la réponse.
 * Le backend reste l'autorité : ces règles servent à prévenir le client, pas à protéger la cuisine.
 */

export const OPENING_HOUR = 11
export const CLOSING_HOUR = 2
/** Jour de fermeture (0 = dimanche, 1 = lundi). */
export const CLOSED_DAY = 1
export const OPENING_HOURS_LABEL = 'Mardi – dimanche, 11h – 02h'

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

const dakarFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Africa/Dakar',
  weekday: 'short',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
})

/** Jour de la semaine, heure et minute à Dakar. */
export function dakarTime(date: Date = new Date()): { day: number; hour: number; minute: number } {
  const parts = Object.fromEntries(dakarFormatter.formatToParts(date).map((part) => [part.type, part.value]))
  return { day: WEEKDAY_INDEX[parts.weekday] ?? date.getDay(), hour: Number(parts.hour) % 24, minute: Number(parts.minute) }
}

/** Jour de service : après minuit et avant la fermeture, on compte encore dans le service de la veille. */
function serviceDay(day: number, hour: number): number {
  return hour < CLOSING_HOUR ? (day + 6) % 7 : day
}

export function isOpenAt(date: Date = new Date()): boolean {
  const { day, hour } = dakarTime(date)
  if (hour >= OPENING_HOUR) return day !== CLOSED_DAY
  if (hour < CLOSING_HOUR) return serviceDay(day, hour) !== CLOSED_DAY
  return false
}

export interface OpeningStatus {
  isOpen: boolean
  /** Prochaine ouverture, à lire après « Réouverture » : « aujourd'hui à 11h », « demain à 11h », « mardi à 11h ». */
  reopensLabel: string
  /** Statut court : « Ouvert jusqu'à 02h » ou « Fermé · réouverture demain à 11h ». */
  label: string
}

export function getOpeningStatus(date: Date = new Date()): OpeningStatus {
  const isOpen = isOpenAt(date)
  const { day, hour } = dakarTime(date)

  // Prochaine ouverture : aujourd'hui si on est avant 11h un jour ouvré, sinon le prochain jour ouvré.
  let offset = hour < OPENING_HOUR && day !== CLOSED_DAY ? 0 : 1
  while ((day + offset) % 7 === CLOSED_DAY) offset += 1
  const when = offset === 0 ? "aujourd'hui" : offset === 1 ? 'demain' : WEEKDAYS[(day + offset) % 7]
  const reopensLabel = `${when} à ${OPENING_HOUR}h`

  return {
    isOpen,
    reopensLabel,
    label: isOpen ? "Ouvert jusqu'à 02h" : `Fermé · réouverture ${reopensLabel}`,
  }
}
