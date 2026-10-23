/**
 * Utilitaires contextuels de salutation et statut d'ouverture BMC FOOD Dakar.
 * Conforme à la page 11 de la charte graphique : salutation dynamique selon l'heure.
 * Horaires officiels : 11h00 – 02h00 (7j/7).
 */

export interface DynamicGreeting {
  salutation: string
  subtitle: string
  isOpen: boolean
  statusLabel: string
}

export function getDynamicGreeting(date: Date = new Date()): DynamicGreeting {
  const hours = date.getHours()

  // Horaires : Ouvert de 11h00 à 02h00 du matin (Dakar)
  const isOpen = hours >= 11 || hours < 2

  let salutation: string
  let subtitle: string

  if (hours >= 18 || hours < 2) {
    salutation = 'Bonsoir !'
    subtitle = "Qu'est-ce qui vous fait envie ce soir ?"
  } else if (hours >= 11 && hours < 14) {
    salutation = 'Bon appétit !'
    subtitle = "Qu'est-ce qui vous ferait plaisir ce midi ?"
  } else if (hours >= 14 && hours < 18) {
    salutation = 'Bonjour !'
    subtitle = "Une petite faim gourmande cet après-midi ?"
  } else {
    // Entre 02h et 11h (pendant la fermeture nocturne)
    salutation = 'Bonjour !'
    subtitle = 'Le restaurant ouvre à 11h. Préparez votre commande !'
  }

  const statusLabel = isOpen
    ? "Ouvert jusqu'à 02h · Livraison partout à Dakar"
    : 'Ouvre à 11h00 · Commandes ouvertes partout à Dakar'

  return {
    salutation,
    subtitle,
    isOpen,
    statusLabel,
  }
}
