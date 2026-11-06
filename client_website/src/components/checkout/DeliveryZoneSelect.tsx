import { Phone, Truck } from 'lucide-react'
import { useId, useMemo } from 'react'
import { DELIVERY_ZONES, findDeliveryArea } from '../../lib/delivery'
import { formatFcfa } from '../../lib/format'
import { Select } from '../ui/Select'

interface DeliveryZoneSelectProps {
  /** Identifiant du quartier choisi (`DeliveryArea.id`), chaîne vide tant que rien n'est choisi. */
  value: string
  onChange: (areaId: string) => void
  disabled?: boolean
  /** Message d'erreur de validation (ex. « Choisissez votre quartier »). */
  error?: string
}

/**
 * Choix du quartier de livraison, avec la liste déroulante du site. Les quartiers sont classés par zone ;
 * le tarif de chaque quartier est affiché dans la liste, puis rappelé sous le champ une fois choisi.
 */
export function DeliveryZoneSelect({ value, onChange, disabled = false, error }: DeliveryZoneSelectProps) {
  const selectId = useId()
  const area = value ? findDeliveryArea(value) : undefined

  const options = useMemo(
    () =>
      DELIVERY_ZONES.flatMap((zone) =>
        zone.areas.map((option) => ({
          value: option.id,
          label: option.name,
          hint: `${zone.label} · ${option.fee === null ? 'prix sur appel' : formatFcfa(option.fee)}`,
        })),
      ),
    [],
  )

  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-zinc-200">
        Quartier
      </label>
      <div className={disabled ? 'pointer-events-none opacity-60' : ''}>
        <Select id={selectId} value={value} onChange={onChange} options={options} placeholder="Choisir mon quartier" />
      </div>

      <div aria-live="polite" className="min-h-5 text-sm">
        {error ? (
          <span className="font-medium text-red-400">{error}</span>
        ) : area ? (
          area.fee === null ? (
            <span className="flex items-center gap-2 text-zinc-300">
              <Phone className="size-4 shrink-0 text-bmc-gold" aria-hidden="true" />
              BMC Food vous appelle pour confirmer les frais.
            </span>
          ) : (
            <span className="flex items-center gap-2 text-zinc-300">
              <Truck className="size-4 shrink-0 text-bmc-gold" aria-hidden="true" />
              Livraison <strong className="font-semibold tabular-nums text-white">{formatFcfa(area.fee)}</strong>
            </span>
          )
        ) : null}
      </div>
    </div>
  )
}
