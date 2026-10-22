/**
 * Frais de livraison BMC Food par quartier, payés par le client.
 * Grille fournie par Pape Aliou Sène (21/10/2026). Les zones 3, 8 et 9 avaient une fourchette de prix :
 * un prix par quartier a été proposé selon la distance (à valider par BMC, voir docs/frais_livraison_bmc.md).
 */

export interface DeliveryArea {
  /** Identifiant stable du quartier, ex. « grand-yoff ». */
  id: string
  name: string
  zone: number
  /** Frais en F CFA ; null : destination éloignée, prix confirmé par téléphone. */
  fee: number | null
}

export interface DeliveryZone {
  zone: number
  label: string
  areas: DeliveryArea[]
}

const slug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const zone = (number: number, label: string, areas: [name: string, fee: number | null][]): DeliveryZone => ({
  zone: number,
  label,
  areas: areas.map(([name, fee]) => ({ id: slug(name), name, zone: number, fee })),
})

export const DELIVERY_ZONES: DeliveryZone[] = [
  zone(1, 'Très proche', [
    ['Cité Mixta', 1000],
    ['Grand Yoff', 1000],
    ['Patte d’Oie', 1000],
    ['Arafat', 1000],
  ]),
  zone(2, 'Proche', [
    ['Nord Foire', 1500],
    ['Foire', 1500],
    ['Liberté 5', 1500],
    ['Liberté 6', 1500],
    ['HLM', 1500],
    ['Dieuppeul', 1500],
    ['Cité des Eaux', 1500],
  ]),
  zone(3, 'Dakar nord', [
    ['Parcelles Assainies', 1500],
    ['Yoff', 1500],
    ['Ouest Foire', 1500],
    ['Cambérène', 2000],
    ['Tivaouane Peulh', 2000],
  ]),
  zone(4, 'Dakar centre', [
    ['Sacré-Cœur', 2000],
    ['Sicap', 2000],
    ['Castors', 2000],
    ['Amitié', 2000],
    ['Fann', 2000],
    ['Point E', 2000],
    ['Fass', 2000],
    ['Médina', 2000],
  ]),
  zone(5, 'Dakar ouest', [
    ['Mermoz', 2500],
    ['Ouakam', 2500],
    ['Ngor', 2500],
    ['Almadies', 2500],
    ['Mamelles', 2500],
    ['Corniche Ouest', 2500],
  ]),
  zone(6, 'Plateau et sud', [
    ['Plateau', 2500],
    ['Colobane', 2500],
    ['Rebeuss', 2500],
    ['Gueule Tapée', 2500],
    ['Hann Maristes', 2500],
    ['Hann Bel-Air', 2500],
  ]),
  zone(7, 'Banlieue proche', [
    ['Pikine', 3000],
    ['Dalifort', 3000],
    ['Thiaroye', 3000],
    ['Guédiawaye', 3000],
    ['Golf Sud', 3000],
    ['Yeumbeul', 3000],
  ]),
  zone(8, 'Banlieue éloignée', [
    ['Keur Massar', 3000],
    ['Malika', 3500],
    ['Jaxaay', 3500],
    ['Rufisque', 3500],
    ['Sangalkam', 3500],
  ]),
  zone(9, 'Longue distance', [
    ['Bargny', 3500],
    ['Diamniadio', 3500],
    ['Sébikotane', 4000],
    ['Autre destination plus éloignée', null],
  ]),
]

const AREAS_BY_ID = new Map(DELIVERY_ZONES.flatMap((z) => z.areas).map((area) => [area.id, area]))

export function findDeliveryArea(id: string): DeliveryArea | undefined {
  return AREAS_BY_ID.get(id)
}
