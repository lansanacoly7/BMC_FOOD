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
 * Liste à choix du quartier de livraison (Univers Dark Luxury).
 * Affiche les zones de Dakar et les frais calculés avec contraste élevé.
 */
export function DeliveryZoneSelect({ value, onChange, disabled = false, error }: DeliveryZoneSelectProps) {
  const selectId = useId()
  const hintId = useId()
  const area = value ? findDeliveryArea(value) : undefined

  return (
    <div>
      <label htmlFor={selectId} className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
        Quartier de livraison
      </label>
      <div className="relative mt-1.5">
        <select
          id={selectId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={hintId}
          className={`h-12 w-full appearance-none rounded-xl border bg-zinc-950/90 pl-3.5 pr-10 text-sm focus:outline-none focus:border-bmc-gold focus:ring-2 focus:ring-bmc-gold/25 transition-all disabled:opacity-50 cursor-pointer ${
            error ? 'border-red-500 text-red-200' : 'border-white/15'
          } ${value ? 'text-white font-medium' : 'text-zinc-500'}`}
        >
          <option value="" disabled className="bg-zinc-900 text-zinc-500">
            Choisissez votre quartier
          </option>
          {DELIVERY_ZONES.map((zone) => (
            <optgroup key={zone.zone} label={`Zone ${zone.zone} — ${zone.label}`} className="bg-zinc-900 font-bold text-bmc-gold">
              {zone.areas.map((option) => (
                <option key={option.id} value={option.id} className="bg-zinc-950 text-white font-normal">
                  {option.name} · {option.fee === null ? 'prix sur appel' : formatOptionFee(option.fee)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        />
      </div>

      <div id={hintId} aria-live="polite" className="mt-2 text-xs">
        {error ? (
          <span className="font-bold text-red-400">{error}</span>
        ) : area ? (
          area.fee === null ? (
            <div className="flex items-center gap-2 rounded-xl bg-zinc-950/70 border border-white/10 px-3 py-2 text-zinc-300">
              <Phone className="size-4 shrink-0 text-bmc-gold" aria-hidden="true" />
              <span>BMC Food vous appelle pour confirmer les frais de livraison.</span>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-zinc-950/70 border border-white/10 px-3 py-2 text-zinc-300">
              <div className="flex items-center gap-2">
                <Truck className="size-4 shrink-0 text-bmc-gold" aria-hidden="true" />
                <span>Livraison {area.name} (zone {area.zone})</span>
              </div>
              <strong className="text-bmc-gold font-bold">{formatFcfa(area.fee)}</strong>
            </div>
          )
        ) : (
          <span className="text-zinc-400">Les frais de livraison sont calculés selon le quartier sélectionné.</span>
        )}
      </div>
    </div>
  )
}
