/**
 * Salutation et statut d'ouverture BMC Food Dakar.
 * Horaires : mardi – dimanche, 11h00 – 02h00. Fermé le lundi.
 */

export interface DynamicGreeting {
  salutation: string
  subtitle: string
  isOpen: boolean
  statusLabel: string
}

/** Après minuit, on compte dans le service de la veille. */
export function isOpenAt(date: Date = new Date()): boolean {
  const hours = date.getHours()
  const day = date.getDay() // 0 = dimanche, 1 = lundi
  if (hours >= 11) return day !== 1
  if (hours < 2) return (day + 6) % 7 !== 1
  return false
}

export function getDynamicGreeting(date: Date = new Date()): DynamicGreeting {
  const hours = date.getHours()
  const isOpen = isOpenAt(date)

  let salutation: string
  let subtitle: string

  if (hours >= 18 || hours < 2) {
    salutation = 'Bonsoir'
    subtitle = "Qu'est-ce qui vous fait envie ce soir ?"
  } else if (hours >= 11 && hours < 14) {
    salutation = 'Bonjour'
    subtitle = "Qu'est-ce qui vous ferait plaisir ce midi ?"
  } else if (hours >= 14 && hours < 18) {
    salutation = 'Bonjour'
    subtitle = 'Une petite faim cet après-midi ?'
  } else {
    salutation = 'Bonjour'
    subtitle = 'Le restaurant ouvre à 11h.'
  }

  const statusLabel = isOpen
    ? "Ouvert jusqu'à 02h · Livraison à Dakar"
    : 'Fermé · Ouvert du mardi au dimanche, 11h – 02h'

  return {
    salutation,
    subtitle,
    isOpen,
    statusLabel,
  }
}
