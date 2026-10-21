const NBSP = String.fromCharCode(0xa0)
const fcfaNumberFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

/** Formate un montant entier en francs CFA : 3500 → « 3 500 F CFA », avec espaces insécables. */
export function formatFcfa(amount: number): string {
  return `${fcfaNumberFormat.format(amount)}${NBSP}F${NBSP}CFA`
}
