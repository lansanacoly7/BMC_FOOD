import React, { useEffect, useState } from 'react'
import { Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, Volume2, VolumeX } from 'lucide-react'
import { IconButton } from '../ui/primitives'

export type AdminTab = 'kds' | 'special' | 'promotions' | 'transactions' | 'staff'

interface AppHeaderProps {
  currentTab: AdminTab
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  isAudioMuted?: boolean
  onToggleAudio?: () => void
}

const PAGE_COPY: Record<AdminTab, { title: string; description: string }> = {
  kds: { title: 'Cuisine', description: '' },
  promotions: {
    title: 'Promotions',
    description: 'Les remises actives s’affichent sur le site client.',
  },
  transactions: {
    title: 'Transactions',
    description: 'Encaissements et paiements des commandes.',
  },
  special: {
    title: 'Plat du jour',
    description: 'Choisissez les plats mis en avant sur le site client.',
  },
  staff: {
    title: 'Personnel',
    description: 'Accès des équipes en cuisine, en caisse et en salle.',
  },
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab,
  isSidebarCollapsed = false,
  onToggleSidebar,
  isAudioMuted = false,
  onToggleAudio,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const copy = PAGE_COPY[currentTab]

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  return (
    <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-line bg-surface px-4 text-ink sm:px-6">
      {onToggleSidebar && (
        <IconButton
          icon={isSidebarCollapsed ? PanelLeftOpen : PanelLeftClose}
          label={isSidebarCollapsed ? 'Déplier le menu' : 'Replier le menu'}
          onClick={onToggleSidebar}
          className="-ml-2"
        />
      )}

      <div className="min-w-0 flex-1 text-left">
        <h1 className="truncate font-display text-[22px] font-bold leading-7">{copy.title}</h1>
        <p className="truncate text-[13px] text-ink-soft">{copy.description}</p>
      </div>

      {onToggleAudio && (
        <IconButton
          icon={isAudioMuted ? VolumeX : Volume2}
          label={isAudioMuted ? 'Activer le son' : 'Couper le son'}
          onClick={onToggleAudio}
        />
      )}
      <IconButton
        icon={isFullscreen ? Minimize2 : Maximize2}
        label={isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}
        onClick={toggleFullscreen}
      />
    </header>
  )
}
