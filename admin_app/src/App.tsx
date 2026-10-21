import { BellOff, BellRing, Volume2, VolumeX, WifiOff } from 'lucide-react'
import { useState } from 'react'
import { AlertActivationPrompt } from './components/admin/AlertActivationPrompt'
import { AlertModal } from './components/admin/AlertModal'
import { useNewOrderAlerts } from './hooks/useNewOrderAlerts'
import { audioAlertService } from './services/audioAlertService'
import {
  getNotificationAccess,
  type NotificationAccess,
  requestNotificationAccess,
} from './services/notificationService'

const NOTIFICATION_STATUS_LABELS: Record<NotificationAccess, string> = {
  granted: 'Notifications activées',
  denied: 'Notifications bloquées par le navigateur',
  default: 'Notifications non autorisées',
  unsupported: 'Notifications indisponibles',
}

const pillClass = 'inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium'

export default function App() {
  const [isServiceStarted, setIsServiceStarted] = useState(false)
  const [isSoundReady, setIsSoundReady] = useState(false)
  const [notificationAccess, setNotificationAccess] = useState<NotificationAccess>(getNotificationAccess)
  const { pendingOrders, acknowledge, isOffline } = useNewOrderAlerts()
  const hasOverlay = !isServiceStarted || pendingOrders.length > 0

  // Lancés directement dans le clic : les navigateurs l'exigent pour autoriser le son et les notifications.
  const unlockSound = () => {
    void audioAlertService.unlock().then(setIsSoundReady)
  }
  const startService = () => {
    unlockSound()
    void requestNotificationAccess().then(setNotificationAccess)
    setIsServiceStarted(true)
  }

  return (
    <>
      <div inert={hasOverlay} className="flex min-h-dvh flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-bmc-gold font-display text-sm font-extrabold text-bmc-charcoal">
              BMC
            </span>
            <div>
              <p className="font-display text-xl font-bold leading-tight">BMC Food</p>
              <p className="text-sm text-zinc-400">Cuisine & caisse</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            {isSoundReady ? (
              <span className={`${pillClass} bg-emerald-500/15 text-emerald-300`}>
                <Volume2 className="size-4" aria-hidden="true" />
                Sonnerie activée
              </span>
            ) : (
              <button
                type="button"
                onClick={unlockSound}
                className={`${pillClass} bg-red-500/15 text-red-300 hover:bg-red-500/25`}
              >
                <VolumeX className="size-4" aria-hidden="true" />
                Sonnerie bloquée : activer
              </button>
            )}
            <span
              className={`${pillClass} ${notificationAccess === 'granted' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-zinc-300'}`}
            >
              {notificationAccess === 'granted' ? (
                <BellRing className="size-4" aria-hidden="true" />
              ) : (
                <BellOff className="size-4" aria-hidden="true" />
              )}
              {NOTIFICATION_STATUS_LABELS[notificationAccess]}
            </span>
            <button
              type="button"
              onClick={() => audioAlertService.playTestChime()}
              disabled={!isSoundReady}
              className={`${pillClass} bg-white/10 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <BellRing className="size-4" aria-hidden="true" />
              Tester la sonnerie
            </button>
          </div>
        </header>

        {isOffline && (
          <div role="alert" className="flex items-center gap-2 bg-red-600 px-6 py-3 font-semibold text-white">
            <WifiOff className="size-5 shrink-0" aria-hidden="true" />
            Serveur injoignable : nouvelle tentative automatique…
          </div>
        )}

        <main className="grid flex-1 place-items-center p-6">
          {/* Module A1 (MS-4) : le tableau de bord AdminDashboard prendra place ici. */}
          <div className="text-center">
            <p className="font-display text-2xl font-bold">En attente de commandes</p>
            <p className="mt-2 text-zinc-400">La sonnerie retentira à chaque nouvelle commande.</p>
          </div>
        </main>
      </div>

      {isServiceStarted ? (
        <AlertModal orders={pendingOrders} onAcknowledge={acknowledge} />
      ) : (
        <AlertActivationPrompt onActivate={startService} />
      )}
    </>
  )
}
