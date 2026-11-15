import React, { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Bike,
  History,
  Layers,
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
    { id: 'all', label: 'Tous', count: countsByType.all, icon: Layers },
    { id: 'delivery', label: 'Livraison', count: countsByType.delivery, icon: Bike },
    { id: 'takeaway', label: 'À emporter', count: countsByType.takeaway, icon: ShoppingBag },
    { id: 'dine_in', label: 'Sur place', count: countsByType.dine_in, icon: Utensils },
  ]

  return (
    <header className="@container relative z-30 flex h-[72px] shrink-0 select-none items-center justify-between gap-4 border-b border-line bg-canvas px-4 text-ink">
      {/* 1. Bloc Gauche : Contrôle Menu & Titre */}
      <div className="flex shrink-0 items-center gap-3">
        <IconButton
          icon={isSidebarCollapsed ? PanelLeftOpen : PanelLeftClose}
          label={isSidebarCollapsed ? 'Déplier le menu' : 'Replier le menu'}
          onClick={onToggleSidebar}
          className="-ml-1"
        />
        <div className="shrink-0 text-left">
          <h1 className="font-display text-[22px] font-bold leading-7">Cuisine</h1>
        </div>
      </div>

      {/* 2. Bloc Centre : Filtres Centrés et Mis en Valeur */}
      <div className="flex flex-1 items-center justify-center px-2">
        <Segmented
          label="Filtrer par type de commande"
          options={typeOptions}
          value={typeFilter}
          onChange={onTypeFilterChange}
          variant="gold"
          size="md"
        />
      </div>

      {/* 3. Bloc Droite : Alertes, Recherche & Actions */}
      <div className="flex shrink-0 items-center gap-3">
        {lateCount > 0 && (
          <span
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-bad/30 bg-bad/10 px-2.5 py-1 text-[13px] font-semibold text-bad"
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
          wrapperClassName="hidden w-36 shrink-0 @[1050px]:block @[1400px]:w-52"
          className="border-line bg-surface focus:border-bmc-gold focus:ring-bmc-gold/20"
        />

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
      </div>
    </header>
  )
}
