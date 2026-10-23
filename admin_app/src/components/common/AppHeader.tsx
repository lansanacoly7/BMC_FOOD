import React, { useEffect, useState } from 'react'
import {
  Volume2,
  VolumeX,
  Flame,
  UtensilsCrossed,
  Maximize2,
  Minimize2,
  LogOut,
} from 'lucide-react'
import { audioAlert } from '../../lib/audioAlert'
import { formatClockTime } from '../../lib/formatters'
import type { ApiConnectionState } from '../../hooks/useOrders'

interface AppHeaderProps {
  currentTab: 'kds' | 'special'
  onTabChange: (tab: 'kds' | 'special') => void
  connectionState: ApiConnectionState
  lastSyncTime: Date | null
  onManualRefresh: () => void
  onLogout?: () => void
  currentUser?: string | null
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab,
  onTabChange,
  connectionState,
  lastSyncTime,
  onManualRefresh,
  onLogout,
  currentUser,
}) => {

  const [clock, setClock] = useState<string>('')
  const [isMuted, setIsMuted] = useState<boolean>(audioAlert.muted)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [syncAgoSec, setSyncAgoSec] = useState<number>(0)

  // Horloge 24h grand format mise à jour chaque seconde
  useEffect(() => {
    const update = () => {
      setClock(formatClockTime(new Date()))
      if (lastSyncTime) {
        const diff = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000)
        setSyncAgoSec(Math.max(0, diff))
      }
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [lastSyncTime])

  const toggleSound = () => {
    const nextState = audioAlert.toggleMute()
    setIsMuted(nextState)
    if (!nextState) {
      audioAlert.playActionConfirm()
    }
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {
      // Plein écran non autorisé
    }
  }

  // Petit point vert (#22C55E) si connecté, orange si synchro, rouge (#EF4444) si erreur/déconnecté
  const apiDotColor = {
    connected: '#22C55E',
    syncing: '#F5B301',
    error: '#EF4444',
    offline: '#EF4444',
  }[connectionState]

  const apiLabel = {
    connected: 'API connectée',
    syncing: 'Synchro…',
    error: 'API hors-ligne',
    offline: 'Hors-ligne',
  }[connectionState]

  return (
    <header
      className="sticky top-0 z-40 w-full h-[72px] min-h-[72px] max-h-[72px] flex items-center justify-between px-6 border-b select-none"
      style={{
        backgroundColor: '#14171C',
        borderColor: '#232830',
      }}
      role="banner"
    >
      {/* GAUCHE : LOGO CORRIGÉ + TITRE + BADGE */}
      <div className="flex items-center gap-3.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm tracking-wider shrink-0 shadow-sm"
          style={{
            backgroundColor: '#F5B301',
            color: '#0B0D10',
          }}
          aria-hidden="true"
        >
          BMC
        </div>

        <div className="flex items-center gap-2.5">
          <h1
            className="text-xl font-black tracking-tight"
            style={{ color: '#F2F4F7' }}
          >
            BMC FOOD
          </h1>
          <span
            className="text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border"
            style={{
              backgroundColor: '#0B0D10',
              borderColor: '#232830',
              color: '#F5B301',
            }}
          >
            KDS CUISINE
          </span>
        </div>
      </div>

      {/* CENTRE : ONGLETS CUISINE / PLAT DU JOUR */}
      <nav
        className="flex items-center p-1 rounded-xl border"
        style={{
          backgroundColor: '#0B0D10',
          borderColor: '#232830',
        }}
        aria-label="Navigation principale"
      >
        <button
          type="button"
          onClick={() => onTabChange('kds')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
          style={{
            backgroundColor: currentTab === 'kds' ? '#F5B301' : 'transparent',
            color: currentTab === 'kds' ? '#0B0D10' : '#9AA3AF',
          }}
        >
          <Flame size={16} strokeWidth={2.5} />
          <span>Cuisine & Commandes</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('special')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
          style={{
            backgroundColor: currentTab === 'special' ? '#F5B301' : 'transparent',
            color: currentTab === 'special' ? '#0B0D10' : '#9AA3AF',
          }}
        >
          <UtensilsCrossed size={16} strokeWidth={2.5} />
          <span>Plat du Jour</span>
        </button>
      </nav>

      {/* DROITE : HORLOGE + SON + API (AVEC POINT VERT) + PLEIN ÉCRAN */}
      <div className="flex items-center gap-3">
        {/* Horloge numérique grand format */}
        <div
          className="px-3.5 py-1.5 rounded-xl border flex items-center"
          style={{
            backgroundColor: '#0B0D10',
            borderColor: '#232830',
          }}
          aria-label={`Heure actuelle : ${clock}`}
        >
          <span
            className="text-xl font-black font-tabular tracking-wider"
            style={{ color: '#F2F4F7' }}
          >
            {clock || '12:00:00'}
          </span>
        </div>

        {/* Pastille Son Neutre */}
        <button
          type="button"
          onClick={toggleSound}
          title={isMuted ? 'Sonnerie coupée (Cliquer pour activer)' : 'Sonnerie active (Cliquer pour couper)'}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold"
          style={{
            backgroundColor: '#14171C',
            borderColor: '#232830',
            color: isMuted ? '#9AA3AF' : '#F2F4F7',
          }}
          aria-pressed={!isMuted}
        >
          {isMuted ? (
            <VolumeX size={16} className="text-slate-400" />
          ) : (
            <Volume2 size={16} style={{ color: '#F5B301' }} />
          )}
          <span>{isMuted ? 'Son muet' : 'Son actif'}</span>
        </button>

        {/* Pastille API Neutre avec point vert/rouge */}
        <button
          type="button"
          onClick={onManualRefresh}
          className="group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all"
          style={{
            backgroundColor: '#14171C',
            borderColor: '#232830',
            color: '#F2F4F7',
          }}
          title={`Dernière synchro il y a ${syncAgoSec} s · Cliquer pour forcer`}
        >
          {/* Petit point de statut : vert si connecté, rouge si erreur */}
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: apiDotColor }}
            aria-hidden="true"
          />
          <span>{apiLabel}</span>

          <div className="absolute top-full mt-2 right-0 hidden group-hover:block z-50 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap bg-black/90 text-white border border-white/20 shadow-xl pointer-events-none">
            Dernière synchro : il y a {syncAgoSec} s
          </div>
        </button>

        {/* Bouton Plein écran */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2 rounded-xl border text-slate-400 hover:text-white transition-all flex items-center justify-center"
          style={{
            backgroundColor: '#14171C',
            borderColor: '#232830',
          }}
          title="Basculer en plein écran"
          aria-label="Plein écran"
        >
          {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>

        {/* Bouton Déconnexion */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-xl border text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-all flex items-center justify-center"
            style={{
              backgroundColor: '#14171C',
              borderColor: '#232830',
            }}
            title={currentUser ? `Déconnexion (${currentUser})` : 'Déconnexion'}
            aria-label="Déconnexion"
          >
            <LogOut size={17} />
          </button>
        )}
      </div>
    </header>
  )
}

