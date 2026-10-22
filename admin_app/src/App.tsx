import {
  CookingPot,
  KeyRound,
  ShieldCheck,
  Star,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  BellRing,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { AuthTokenModal } from './components/admin/AuthTokenModal'
import { DailySpecialManager } from './components/admin/DailySpecialManager'
import { OrdersDashboard } from './components/admin/OrdersDashboard'
import { useNewOrderAlerts } from './hooks/useNewOrderAlerts'
import { getAdminToken } from './services/api'
import { audioAlertService } from './services/audioAlertService'

export default function App() {
  const [activeTab, setActiveTab] = useState<'orders' | 'specials'>('orders')
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [hasToken, setHasToken] = useState<boolean>(Boolean(getAdminToken()))
  const [currentTime, setCurrentTime] = useState<string>('')
  const { pendingOrders, acknowledge, isOffline } = useNewOrderAlerts()

  // Horloge numérique en direct pour la cuisine (mise à jour chaque seconde)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      )
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  // Déblocage automatique et transparent de l'audio au premier clic sur la page
  useEffect(() => {
    const handleFirstInteraction = () => {
      void audioAlertService.unlock()
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }
    window.addEventListener('click', handleFirstInteraction, { once: true })
    window.addEventListener('keydown', handleFirstInteraction, { once: true })
    return () => {
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [])

  // Alerte sonore douce à l'arrivée d'une nouvelle commande si le son est activé
  useEffect(() => {
    if (pendingOrders.length > 0 && isSoundEnabled) {
      void audioAlertService.playTestChime()
    }
  }, [pendingOrders.length, isSoundEnabled])

  const toggleSound = () => {
    if (!isSoundEnabled) {
      void audioAlertService.unlock()
      void audioAlertService.playTestChime()
    }
    setIsSoundEnabled((prev) => !prev)
  }

  const handleAuthChange = () => {
    setHasToken(Boolean(getAdminToken()))
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#09090B] text-zinc-100 font-sans selection:bg-bmc-gold selection:text-black">
      {/* 1. EN-TÊTE ÉPURÉ & PROFESSIONNEL KDS CUISINE */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/95 backdrop-blur-md px-4 sm:px-8 py-3.5 shadow-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          
          {/* Logo BMC Food & Horloge Cuisine */}
          <div className="flex items-center gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-bmc-gold via-amber-400 to-amber-500 font-display font-black text-black shadow-md shadow-bmc-gold/25">
              BMC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base sm:text-lg font-black tracking-tight text-white">
                  BMC FOOD
                </span>
                <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-bmc-gold">
                  KDS Cuisine
                </span>
              </div>
              <p className="font-mono text-xs text-zinc-400 tabular-nums">
                {currentTime || 'Dakar · Service Actif'}
              </p>
            </div>
          </div>

          {/* Onglets de navigation épurés */}
          <nav aria-label="Navigation principale" className="inline-flex rounded-2xl border border-white/10 bg-zinc-900/90 p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-bmc-gold text-black shadow-md shadow-bmc-gold/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CookingPot className="size-4" />
              <span>Cuisine & Commandes</span>
              {pendingOrders.length > 0 && (
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white animate-pulse">
                  {pendingOrders.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specials')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'specials'
                  ? 'bg-bmc-gold text-black shadow-md shadow-bmc-gold/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Star className="size-4" />
              <span>Plat du Jour</span>
            </button>
          </nav>

          {/* Commandes rapides : Son, Connexion API */}
          <div className="flex items-center gap-2.5">
            {/* Bouton Son rapide */}
            <button
              type="button"
              onClick={toggleSound}
              title={isSoundEnabled ? 'Sonnerie active (cliquer pour couper)' : 'Sonnerie coupée (cliquer pour activer)'}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                isSoundEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-zinc-800/80 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {isSoundEnabled ? (
                <>
                  <Volume2 className="size-4 text-emerald-400 animate-pulse" />
                  <span className="hidden md:inline">Son actif</span>
                </>
              ) : (
                <>
                  <VolumeX className="size-4 text-zinc-500" />
                  <span className="hidden md:inline">Son muet</span>
                </>
              )}
            </button>

            {/* Statut Réseau & Jeton API discret */}
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              title={hasToken ? 'Jeton staff configuré' : 'Se connecter avec un jeton API'}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/90 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-bmc-gold hover:text-white transition-all cursor-pointer"
            >
              {isOffline ? (
                <WifiOff className="size-3.5 text-amber-400" />
              ) : (
                <Wifi className="size-3.5 text-emerald-400" />
              )}
              <span className="hidden lg:inline">{isOffline ? 'Démo locale' : 'API connectée'}</span>
              {hasToken ? (
                <ShieldCheck className="size-3.5 text-bmc-gold ml-1" />
              ) : (
                <KeyRound className="size-3.5 text-zinc-400 ml-1" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. BANNIÈRE DISCRÈTE LORS D'UNE NOUVELLE COMMANDE (NON BLOQUANTE) */}
      <AnimatePresence>
        {pendingOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="border-b border-red-500/40 bg-gradient-to-r from-red-950/90 via-zinc-950/90 to-red-950/90 px-4 py-3 text-white shadow-lg backdrop-blur-md"
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 animate-bounce">
                  <BellRing className="size-4" />
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-red-200">
                    {pendingOrders.length === 1
                      ? `Nouvelle commande reçue (#${pendingOrders[0].order_ref}) !`
                      : `${pendingOrders.length} nouvelles commandes en attente de préparation !`}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Cliquez sur « Prendre en charge » pour couper l’alerte et lancer la cuisine.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={acknowledge}
                className="shrink-0 rounded-xl bg-gradient-to-r from-bmc-gold to-amber-400 px-4 py-2 font-display text-xs font-bold text-black shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                Prendre en charge
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. CONTENU PRINCIPAL */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {activeTab === 'orders' ? (
          <OrdersDashboard onRefreshEvents={acknowledge} />
        ) : (
          <DailySpecialManager />
        )}
      </main>

      {/* Modale d'authentification API Token (ouverte seulement sur clic) */}
      <AuthTokenModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthChange={handleAuthChange}
      />
    </div>
  )
}
