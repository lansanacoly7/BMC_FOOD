import {
  BellOff,
  BellRing,
  CookingPot,
  KeyRound,
  ShieldCheck,
  Star,
  Volume2,
  VolumeX,
  WifiOff,
} from 'lucide-react'
import { useState } from 'react'
import { AlertActivationPrompt } from './components/admin/AlertActivationPrompt'
import { AlertModal } from './components/admin/AlertModal'
import { AuthTokenModal } from './components/admin/AuthTokenModal'
import { DailySpecialManager } from './components/admin/DailySpecialManager'
import { OrdersDashboard } from './components/admin/OrdersDashboard'
import { useNewOrderAlerts } from './hooks/useNewOrderAlerts'
import { getAdminToken } from './services/api'
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

const pillClass = 'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold'

export default function App() {
  const [activeTab, setActiveTab] = useState<'orders' | 'specials'>('orders')
  const [isServiceStarted, setIsServiceStarted] = useState(false)
  const [isSoundReady, setIsSoundReady] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [hasToken, setHasToken] = useState<boolean>(Boolean(getAdminToken()))
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

  const handleAuthChange = () => {
    setHasToken(Boolean(getAdminToken()))
  }

  return (
    <>
      <div inert={hasOverlay} className="flex min-h-dvh flex-col bg-[#0C0C0D] text-white">
        {/* En-tête Sticky Cuisine BMC Food */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/95 backdrop-blur-md px-4 sm:px-6 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Logo & Titre */}
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-bmc-gold via-amber-400 to-amber-500 font-display text-sm font-black text-black shadow-md shadow-bmc-gold/20">
                BMC
              </span>
              <div>
                <p className="font-display text-lg sm:text-xl font-black leading-tight text-white">
                  BMC Food Dakar
                </p>
                <p className="text-xs text-zinc-400 font-medium">Administration Cuisine & Caisse</p>
              </div>
            </div>

            {/* Onglets de navigation principale */}
            <div className="inline-flex rounded-2xl border border-white/10 bg-zinc-900/90 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-bmc-gold text-black shadow-md shadow-bmc-gold/20'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <CookingPot className="size-4" />
                <span>Commandes Cuisine</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('specials')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'specials'
                    ? 'bg-bmc-gold text-black shadow-md shadow-bmc-gold/20'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <Star className="size-4" />
                <span>Plat du Jour</span>
              </button>
            </div>

            {/* Statuts Techniques : Sonnerie, Notifications & Authentification API */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Statut Sonnerie */}
              {isSoundReady ? (
                <span className={`${pillClass} bg-emerald-500/15 text-emerald-300 border border-emerald-500/30`}>
                  <Volume2 className="size-3.5" aria-hidden="true" />
                  <span>Sonnerie prête</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={unlockSound}
                  className={`${pillClass} bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 cursor-pointer`}
                >
                  <VolumeX className="size-3.5" aria-hidden="true" />
                  <span>Activer le son</span>
                </button>
              )}

              {/* Statut Notifications Navigateur */}
              <span
                className={`${pillClass} border ${
                  notificationAccess === 'granted'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-white/5 text-zinc-400 border-white/10'
                }`}
              >
                {notificationAccess === 'granted' ? (
                  <BellRing className="size-3.5" aria-hidden="true" />
                ) : (
                  <BellOff className="size-3.5" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">{NOTIFICATION_STATUS_LABELS[notificationAccess]}</span>
              </span>

              {/* Bouton Test Carillon */}
              <button
                type="button"
                onClick={() => audioAlertService.playTestChime()}
                disabled={!isSoundReady}
                title="Jouer le carillon d'alerte pour tester les enceintes de la cuisine"
                className={`${pillClass} bg-white/10 hover:bg-white/15 border border-white/10 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer`}
              >
                <BellRing className="size-3.5 text-bmc-gold" aria-hidden="true" />
                <span>Tester carillon</span>
              </button>

              {/* Statut Token API */}
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                title="Gérer le jeton Token d’accès à l'API Django REST"
                className={`${pillClass} border transition-colors cursor-pointer ${
                  hasToken
                    ? 'bg-bmc-gold/15 text-bmc-gold border-bmc-gold/30 hover:bg-bmc-gold/25'
                    : 'bg-zinc-800 text-zinc-300 border-white/10 hover:bg-zinc-700'
                }`}
              >
                {hasToken ? <ShieldCheck className="size-3.5" /> : <KeyRound className="size-3.5" />}
                <span>{hasToken ? 'Jeton API actif' : 'Connexion API'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Alerte si le serveur est inaccessible ou jeton manquant */}
        {isOffline && (
          <div role="alert" className="flex items-center justify-center gap-2 bg-amber-500/20 border-b border-amber-500/30 px-6 py-2.5 text-xs font-bold text-amber-300">
            {!hasToken ? (
              <>
                <KeyRound className="size-4 shrink-0 text-bmc-gold" aria-hidden="true" />
                <span>Jeton staff requis pour synchroniser les commandes en direct.</span>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="ml-1 underline text-white hover:text-bmc-gold cursor-pointer"
                >
                  Se connecter (admin / admin123)
                </button>
              </>
            ) : (
              <>
                <WifiOff className="size-4 shrink-0 text-amber-400" aria-hidden="true" />
                <span>Mode démonstration actif · Serveur Django local non connecté, données de démonstration chargées.</span>
              </>
            )}
          </div>
        )}

        {/* Contenu Principal */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === 'orders' ? (
            <OrdersDashboard onRefreshEvents={acknowledge} />
          ) : (
            <DailySpecialManager />
          )}
        </main>

        {/* Footer Admin discret */}
        <footer className="border-t border-white/10 bg-zinc-950 px-6 py-4 text-center text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} BMC FOOD · Teranga Labs · Système de Caisse & Cuisine v1.1</p>
        </footer>
      </div>

      {/* Alerte sonore et visuelle de nouvelle commande */}
      {isServiceStarted ? (
        <AlertModal orders={pendingOrders} onAcknowledge={acknowledge} />
      ) : (
        <AlertActivationPrompt onActivate={startService} />
      )}

      {/* Modale d'authentification API Token */}
      <AuthTokenModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthChange={handleAuthChange}
      />
    </>
  )
}
