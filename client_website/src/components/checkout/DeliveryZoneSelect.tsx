import { ChevronDown, Phone, Truck } from 'lucide-react'
import { useId } from 'react'
import { DELIVERY_ZONES, findDeliveryArea } from '../../lib/delivery'
import { formatFcfa } from '../../lib/format'

/** Les listes natives n'affichent pas l'espace fine (U+202F) produite par Intl : remplacée par une espace insécable. */
const NARROW_NBSP = new RegExp(String.fromCharCode(0x202f), 'g')
const formatOptionFee = (fee: number) => formatFcfa(fee).replace(NARROW_NBSP, String.fromCharCode(0xa0))

interface DeliveryZoneSelectProps {
  /** Identifiant du quartier choisi (`DeliveryArea.id`), chaîne vide tant que rien n'est choisi. */
  value: string
  onChange: (areaId: string) => void
  disabled?: boolean
  /** Message d'erreur de validation (ex. « Choisissez votre quartier »). */
  error?: string
}

/**
 * Liste à choix du quartier de livraison, regroupée par zone, avec les frais payés par le client.
 * Liste native : sur téléphone, elle ouvre le sélecteur du système, plus confortable pour une cinquantaine de quartiers.
 */
export function DeliveryZoneSelect({ value, onChange, disabled = false, error }: DeliveryZoneSelectProps) {
  const selectId = useId()
  const hintId = useId()
  const area = value ? findDeliveryArea(value) : undefined

  return (
    <div>
      <label htmlFor={selectId} className="block text-sm font-medium">
        Quartier de livraison
      </label>
      <div className="relative mt-1">
        <select
          id={selectId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={hintId}
          className={`h-12 w-full appearance-none rounded-xl border bg-white pl-3 pr-10 focus:outline-2 focus:outline-bmc-orange disabled:opacity-60 ${
            error ? 'border-red-500' : 'border-zinc-300'
          } ${value ? 'text-bmc-charcoal' : 'text-zinc-500'}`}
        >
          <option value="" disabled>
            Choisissez votre quartier
          </option>
          {DELIVERY_ZONES.map((zone) => (
            <optgroup key={zone.zone} label={`Zone ${zone.zone} — ${zone.label}`}>
              {zone.areas.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} · {option.fee === null ? 'prix sur appel' : formatOptionFee(option.fee)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-zinc-500"
          aria-hidden="true"
        />
      </div>

      <p id={hintId} aria-live="polite" className="mt-2 flex items-center gap-2 text-sm">
        {error ? (
          <span className="text-red-600">{error}</span>
        ) : area ? (
          area.fee === null ? (
            <>
              <Phone className="size-4 shrink-0 text-bmc-orange-deep" aria-hidden="true" />
              <span>BMC Food vous appelle pour confirmer les frais de livraison.</span>
            </>
          ) : (
            <>
              <Truck className="size-4 shrink-0 text-bmc-orange-deep" aria-hidden="true" />
              <span>
                Livraison {area.name} (zone {area.zone}) : <strong>{formatFcfa(area.fee)}</strong>
              </span>
            </>
          )
        ) : (
          <span className="text-zinc-500">Les frais de livraison sont à la charge du client.</span>
        )}
      </p>
    </div>
  )
}
