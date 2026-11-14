import React, { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Bike,
  History,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingBag,
  Utensils,
  Volume2,
  VolumeX,
} from 'lucide-react'
import type { OrderType } from '../../types/kds'
import { IconButton, SearchInput, Segmented, type SegmentOption } from '../ui/primitives'

interface KdsTopBarProps {
  isSidebarCollapsed: boolean
  onToggleSidebar: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  typeFilter: 'all' | OrderType
  onTypeFilterChange: (type: 'all' | OrderType) => void
  countsByType: {
    all: number
    delivery: number
    takeaway: number
    dine_in: number
  }
  lateCount: number
  avgWaitMinutes: number
  historyCount: number
  onOpenHistory: () => void
  isAudioMuted: boolean
  onToggleAudio: () => void
}

export const KdsTopBar: React.FC<KdsTopBarProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  countsByType,
  lateCount,
  avgWaitMinutes,
  historyCount,
  onOpenHistory,
  isAudioMuted,
  onToggleAudio,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
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

  const typeOptions: SegmentOption<'all' | OrderType>[] = [
    { id: 'all', label: 'Tous', count: countsByType.all },
    { id: 'delivery', label: 'Livraison', count: countsByType.delivery, icon: Bike },
    { id: 'takeaway', label: 'À emporter', count: countsByType.takeaway, icon: ShoppingBag },
    { id: 'dine_in', label: 'Sur place', count: countsByType.dine_in, icon: Utensils },
  ]

  return (
    <header className="@container relative z-30 flex h-[72px] shrink-0 select-none items-center gap-3 border-b border-line bg-canvas px-4 text-ink">
      <IconButton
        icon={isSidebarCollapsed ? PanelLeftOpen : PanelLeftClose}
        label={isSidebarCollapsed ? 'Déplier le menu' : 'Replier le menu'}
        onClick={onToggleSidebar}
        className="-ml-1"
      />

      <div className="shrink-0 text-left">
        <h1 className="font-display text-[22px] font-bold leading-7">Cuisine</h1>
      </div>

      <div className="mx-1 h-8 w-px shrink-0 bg-line" aria-hidden="true" />

      <Segmented
        label="Filtrer par type de commande"
        options={typeOptions}
        value={typeFilter}
        onChange={onTypeFilterChange}
        labelClassName="hidden @[1130px]:inline"
      />

      <div className="ml-auto flex min-w-0 items-center gap-3">
        {lateCount > 0 && (
          <span
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] font-semibold text-bad"
            title={`${lateCount} commande(s) en retard (plus de 15 min)`}
          >
            <AlertTriangle className="size-3.5" />
            {lateCount} en retard
          </span>
        )}

        <SearchInput
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher…"
          aria-label="Rechercher une commande"
          wrapperClassName="hidden w-40 shrink-0 @[800px]:block @[1380px]:w-56"
          className="border-line bg-surface focus:border-bmc-gold focus:ring-bmc-gold/20"
        />
      </div>

      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={onOpenHistory}
          aria-label={`Historique des commandes, ${historyCount} terminées`}
          title="Historique des commandes"
          className="flex h-9 cursor-pointer items-center gap-1 rounded-lg px-2 text-ink-soft transition-colors hover:bg-raised hover:text-ink"
        >
          <History className="size-[18px]" />
          <span className="text-xs tabular-nums">{historyCount}</span>
        </button>
        <IconButton
          icon={isAudioMuted ? VolumeX : Volume2}
          label={isAudioMuted ? 'Activer le son' : 'Couper le son'}
          onClick={onToggleAudio}
        />
        <IconButton
          icon={isFullscreen ? Minimize2 : Maximize2}
          label={isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}
          onClick={toggleFullscreen}
        />
      </div>
    </header>
  )
}
