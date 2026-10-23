import { DEFAULT_THRESHOLDS, type ChronoThresholds, type KdsOrder, type UrgencyLevel } from '../types/kds'

/**
 * Formate un montant en Francs CFA selon les normes locales sénégalaises :
 * Espaces insécables entre les milliers, suffixe officiel "F CFA".
 * Ex : formatFcfa(15000) → "15 000 F CFA"
 */
export function formatFcfa(amount: number): string {
  const rounded = Math.round(amount || 0)
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')
  return `${formatted}\u00A0F\u00A0CFA`
}

/**
 * Calcule les secondes écoulées depuis la création de la commande
 */
export function getElapsedSeconds(createdAt: string, nowMs: number): number {
  const createdMs = new Date(createdAt).getTime()
  if (isNaN(createdMs)) return 0
  const diffSec = Math.floor((nowMs - createdMs) / 1000)
  return Math.max(0, diffSec)
}

/**
 * Formate une durée en chaîne lisible MM:SS ou HH:MM
 */
export function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60

  if (mins >= 60) {
    const hours = Math.floor(mins / 60)
    const remainMins = mins % 60
    return `${hours}h\u00A0${remainMins.toString().padStart(2, '0')}m`
  }

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Détermine le niveau d'urgence d'une commande selon son temps d'attente
 * - Normal (< 10 min)
 * - Attention / Warning (10 - 15 min, ambre)
 * - Retard critique (>= 15 min, rouge avec pulsation douce)
 */
export function getUrgencyLevel(
  elapsedSeconds: number,
  thresholds: ChronoThresholds = DEFAULT_THRESHOLDS,
): UrgencyLevel {
  const minutes = elapsedSeconds / 60
  if (minutes >= thresholds.dangerMinutes) return 'danger'
  if (minutes >= thresholds.warningMinutes) return 'warning'
  return 'normal'
}

/**
 * Formate une heure complète HH:MM:SS
 */
export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

/**
 * Formate une date courte en français (ex. 22 oct. 21:30)
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Exporte une liste de commandes en fichier CSV (encodage UTF-8 avec BOM)
 */
export function exportOrdersToCsv(orders: KdsOrder[]): void {
  const headers = ['Référence', 'Date/Heure', 'Client', 'Téléphone', 'Adresse', 'Statut', 'Paiement', 'Articles', 'Total (F CFA)']
  
  const rows = orders.map((o) => {
    const itemsSummary = o.items.map((i) => `${i.quantity}x ${i.name}`).join('; ')
    return [
      `"${o.orderRef}"`,
      `"${formatDateTime(o.createdAt)}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.phone}"`,
      `"${o.address.replace(/"/g, '""')}"`,
      `"${o.status}"`,
      `"${o.paymentMethod} (${o.paymentStatus})"`,
      `"${itemsSummary.replace(/"/g, '""')}"`,
      o.totalAmount,
    ].join(',')
  })

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `kds-commandes-bmc-${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
