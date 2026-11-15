import React, { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Info,
  PauseCircle,
  Save,
  Store,
} from 'lucide-react'
import {
  Button,
  Card,
  Notice,
  PageBody,
  Stat,
  StatGrid,
  type NoticeState,
} from '../components/ui/primitives'
import {
  fetchRestaurantStatus,
  updateRestaurantSettings,
  type RestaurantStatus,
} from '../services/restaurant'

const SUGGESTED_MESSAGES = [
  'Coup de feu en cuisine : reprise des commandes dans 20 minutes.',
  'Pause technique : nos cuisiniers finalisent les commandes en cours.',
  'Rupture temporaire d’ingrédients : réouverture imminente.',
  'Le restaurant BMC Food est actuellement fermé. Réouverture à 11h00.',
]

export const RestaurantPage: React.FC = () => {
  const [status, setStatus] = useState<RestaurantStatus>({
    isOpen: true,
    acceptingOrders: true,
    manualClosed: false,
    closedMessage: 'Le restaurant est actuellement fermé. Réouverture prochaine.',
  })
  const [isManualClosed, setIsManualClosed] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [notice, setNotice] = useState<NoticeState | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await fetchRestaurantStatus()
        if (mounted) {
          setStatus(data)
          setIsManualClosed(data.manualClosed)
          setMessage(data.closedMessage)
        }
      } catch {
        if (mounted) {
          setNotice({
            type: 'error',
            message: 'Impossible de charger les paramètres actuels du restaurant.',
          })
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    setNotice(null)

    try {
      const updated = await updateRestaurantSettings({
        manual_closed: isManualClosed,
        closed_message: isManualClosed
          ? (message.trim() || 'Le restaurant est actuellement fermé.')
          : message.trim(),
      })
      setStatus(updated)
      setIsManualClosed(updated.manualClosed)
      setMessage(updated.closedMessage)
      setNotice({
        type: 'success',
        message: updated.manualClosed
          ? 'Restaurant mis en pause / fermé avec succès. Les nouvelles commandes sont bloquées.'
          : 'Restaurant ouvert ! Les commandes sont à nouveau acceptées en direct.',
      })
    } catch {
      setNotice({
        type: 'error',
        message: 'Erreur lors de l’enregistrement des paramètres du restaurant.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Détermination de l'état affiché
  const currentStateLabel = !status.isOpen
    ? 'Fermé (hors horaires)'
    : isManualClosed
    ? 'Pause cuisine / Fermé manuellement'
    : 'Ouvert (prise de commande active)'

  const currentStateTone = !status.isOpen
    ? 'text-ink-faint'
    : isManualClosed
    ? 'text-amber-400'
    : 'text-ok'

  return (
    <PageBody>
      <Notice notice={notice} />

      {/* STATS DU RESTAURANT */}
      <StatGrid>
        <Stat
          label="État de service"
          value={isLoading ? 'Chargement...' : currentStateLabel}
          hint={status.isOpen ? 'Horaires légaux actifs' : 'Fermeture nocturne ou hebdomadaire'}
        />
        <Stat
          label="Prise de commande en ligne"
          value={isLoading ? '...' : !isManualClosed && status.isOpen ? 'Active' : 'Bloquée'}
          hint={!isManualClosed && status.isOpen ? 'Site client ouvert' : 'Bouton de commande bloqué'}
        />
        <Stat
          label="Horaires habituels"
          value="11h00 – 02h00"
          hint="Mardi à dimanche (Fermé lundi)"
        />
        <Stat
          label="Dernière commande"
          value="01h30"
          hint="Arrêt automatique des commandes"
        />
      </StatGrid>

      {/* CARTE DE CONTRÔLE PRINCIPALE */}
      <Card className="p-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between border-b border-line pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Store className="size-5 text-bmc-gold" />
                <h3 className="font-display text-lg font-bold text-ink">
                  Gestion de l'Ouverture & Pause Cuisine
                </h3>
              </div>
              <p className="mt-1 text-xs text-ink-soft">
                Contrôlez instantanément la disponibilité du restaurant sur le site client.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`size-3 rounded-full ${isManualClosed ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${currentStateTone}`}>
                {isManualClosed ? 'Pause active' : 'En ligne'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* SÉLECTEUR D'ÉTAT : OUVERT VS PAUSE / FERMÉ */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-3">
                Disponibilité des commandes clients
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* OPTION 1 : OUVERT */}
                <button
                  type="button"
                  onClick={() => setIsManualClosed(false)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer ${
                    !isManualClosed
                      ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                      : 'border-line bg-canvas hover:bg-raised'
                  }`}
                >
                  <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${!isManualClosed ? 'bg-emerald-500 text-white' : 'bg-raised text-ink-soft'}`}>
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-ink">Ouvert & Réception active</h4>
                    <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                      Le restaurant accepte toutes les commandes des clients en direct sur le site et le KDS.
                    </p>
                  </div>
                </button>

                {/* OPTION 2 : FERMETURE / PAUSE MANUELLE */}
                <button
                  type="button"
                  onClick={() => setIsManualClosed(true)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer ${
                    isManualClosed
                      ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                      : 'border-line bg-canvas hover:bg-raised'
                  }`}
                >
                  <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${isManualClosed ? 'bg-amber-500 text-black font-bold' : 'bg-raised text-ink-soft'}`}>
                    <PauseCircle className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-ink">Pause cuisine / Fermer temporairement</h4>
                    <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                      Suspend les nouvelles commandes immédiatement (rush, coup de feu, inventaire ou rupture).
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* MESSAGE CLIENT */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="closed-message"
                  className="block text-xs font-semibold uppercase tracking-wider text-ink-soft"
                >
                  Message affiché aux clients sur le site
                </label>
                <span className="text-[11px] text-ink-faint">
                  Visible en bandeau sur le site client si pause ou fermeture
                </span>
              </div>

              <textarea
                id="closed-message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex. Pause cuisine : reprise des commandes dans 20 minutes."
                className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-bmc-gold focus:outline-none focus:ring-1 focus:ring-bmc-gold"
              />

              {/* MESSAGES PRÉDÉFINIS */}
              <div>
                <p className="text-xs text-ink-faint mb-2">Suggestions en un clic :</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_MESSAGES.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setMessage(sug)}
                      className="rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-bmc-gold hover:text-ink cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RAPPEL DES RÈGLES HORAIRES */}
            <div className="rounded-xl border border-line bg-canvas p-4 text-xs text-ink-soft flex items-start gap-3">
              <Info className="size-4 shrink-0 text-bmc-gold mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-ink">Règles automatiques du restaurant :</p>
                <ul className="list-disc list-inside space-y-0.5 text-ink-faint">
                  <li>Mardi à Dimanche : ouverture automatique de 11h00 à 02h00.</li>
                  <li>Lundi : fermeture hebdomadaire automatique toute la journée.</li>
                  <li>Dernière commande autorisée à 01h30 (30 min avant fermeture pour finir la cuisson).</li>
                  <li>L'interrupteur manuel ci-dessus a la priorité absolue sur les horaires programmés.</li>
                </ul>
              </div>
            </div>

            {/* BOUTON D'ENREGISTREMENT */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
              <Button
                variant="primary"
                icon={Save}
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 font-bold"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer et appliquer'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </PageBody>
  )
}
