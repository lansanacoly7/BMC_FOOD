/**
 * Salutation et statut d'ouverture BMC Food Dakar.
 * Les horaires vivent dans `openingHours.ts` (calculés à l'heure de Dakar).
 */
import { dakarTime, isOpenAt } from './openingHours'

export { isOpenAt }

export interface DynamicGreeting {
  salutation: string
  subtitle: string
  isOpen: boolean
  statusLabel: string
}

export function getDynamicGreeting(date: Date = new Date()): DynamicGreeting {
  const hours = dakarTime(date).hour
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
