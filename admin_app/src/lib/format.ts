const NBSP = String.fromCharCode(0xa0)
const fcfaNumberFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

/** Formate un montant entier en francs CFA : 3500 → « 3 500 F CFA », avec espaces insécables. */
export function formatFcfa(amount: number): string {
  return `${fcfaNumberFormat.format(amount)}${NBSP}F${NBSP}CFA`
}

/** Heure locale d'une date ISO renvoyée par l'API : « 2026-10-21T14:05:00Z » → « 14:05 » à Dakar. */
export function formatTime(isoDate: string): string {
  return timeFormat.format(new Date(isoDate))
}
