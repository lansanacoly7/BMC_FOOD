import { FlaskConical } from 'lucide-react'

/** Rappel visible sur les écrans de paiement simulés : la démo ne débite aucun compte. */
export function SimulationBadge() {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-white">
      <FlaskConical className="size-3.5" aria-hidden="true" />
      Simulation · aucun débit réel
    </p>
  )
}
