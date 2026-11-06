import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Search,
  Bike,
  ShoppingBag,
  Utensils,
  Volume2,
  VolumeX,
  History,
  Circle,
  MoreVertical,
  ChevronDown,
  AlertTriangle,
  UtensilsCrossed,
  SlidersHorizontal,
} from 'lucide-react'
import type { KdsOrder, OrderType } from '../../types/kds'

interface KdsTopBarProps {
  orders: KdsOrder[]
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
  orders,
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
  const [showProduceDropdown, setShowProduceDropdown] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const produceRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Fermeture des popovers au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (produceRef.current && !produceRef.current.contains(e.target as Node)) {
        setShowProduceDropdown(false)
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  // Agréger les plats pour le bouton déroulant "Total à produire"
  const { produceList, totalProduceCount } = useMemo(() => {
    const activeOrders = orders.filter(
      (o) => o.status === 'pending' || o.status === 'preparing',
    )
    const map: Record<string, { name: string; quantity: number }> = {}

    activeOrders.forEach((o) => {
      o.items.forEach((item) => {
        const key = item.name.toLowerCase().trim()
        if (!map[key]) {
          map[key] = { name: item.name, quantity: 0 }
        }
        map[key].quantity += item.quantity
      })
    })

    const list = Object.values(map).sort((a, b) => b.quantity - a.quantity)
    const total = list.reduce((sum, item) => sum + item.quantity, 0)
    return { produceList: list, totalProduceCount: total }
  }, [orders])

  return (
    <header className="h-12 min-h-12 px-3 border-b border-[#262A33] bg-[#181B22] text-[#F2F4F7] flex items-center justify-between gap-2.5 font-sans select-none shrink-0 relative z-30">
      {/* 1. GAUCHE : Sidebar toggle + Titre + Pastille En direct */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded hover:bg-[#262A33] text-[#8A93A3] hover:text-[#F2F4F7] transition-colors cursor-pointer"
          title={isSidebarCollapsed ? 'Afficher la barre latérale' : 'Masquer la barre latérale'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>

        <span className="text-xs font-bold tracking-wider uppercase text-[#F2F4F7]">
          Cuisine
        </span>

        {/* Le point "En direct" vert est la seule exception autorisée */}
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-[#8A93A3] shrink-0">
          <Circle className="size-2 fill-[#22C55E] text-[#22C55E]" />
          <span>En direct</span>
        </span>
      </div>

      {/* 2. RECHERCHE RAPIDE */}
      <div className="w-36 lg:w-44 xl:w-52 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#8A93A3]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher ticket, plat…"
            className="w-full h-8 pl-8 pr-2.5 rounded bg-[#0F1115] border border-[#262A33] text-xs text-[#F2F4F7] placeholder-[#5E6676] focus:outline-none focus:border-[#3A404D] transition-colors"
          />
        </div>
      </div>

      {/* 3. FILTRE SEGMENTÉ NEUTRE (AUCUNE COULEUR) */}
      <div className="flex items-center gap-0.5 bg-[#0F1115] p-0.5 rounded-md border border-[#262A33] shrink-0 text-xs">
        <button
          type="button"
          onClick={() => onTypeFilterChange('all')}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            typeFilter === 'all'
              ? 'bg-[#262A33] text-[#F2F4F7]'
              : 'text-[#8A93A3] hover:text-[#F2F4F7]'
          }`}
        >
          <span>Tous</span>
          <span className="font-mono text-[11px] px-1 py-0.2 rounded bg-[#181B22] text-[#8A93A3]">
            {countsByType.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTypeFilterChange('delivery')}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
            typeFilter === 'delivery'
              ? 'bg-[#262A33] text-[#F2F4F7]'
              : 'text-[#8A93A3] hover:text-[#F2F4F7]'
          }`}
          title="Livraison"
        >
          <Bike className="size-3 text-[#8A93A3]" />
          <span className="hidden 2xl:inline">Livraison</span>
          <span className="font-mono text-[11px] px-1 py-0.2 rounded bg-[#181B22] text-[#8A93A3]">
            {countsByType.delivery}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTypeFilterChange('takeaway')}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
            typeFilter === 'takeaway'
              ? 'bg-[#262A33] text-[#F2F4F7]'
              : 'text-[#8A93A3] hover:text-[#F2F4F7]'
          }`}
          title="À emporter"
        >
          <ShoppingBag className="size-3 text-[#8A93A3]" />
          <span className="hidden 2xl:inline">À emporter</span>
          <span className="font-mono text-[11px] px-1 py-0.2 rounded bg-[#181B22] text-[#8A93A3]">
            {countsByType.takeaway}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTypeFilterChange('dine_in')}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
            typeFilter === 'dine_in'
              ? 'bg-[#262A33] text-[#F2F4F7]'
              : 'text-[#8A93A3] hover:text-[#F2F4F7]'
          }`}
          title="Sur place"
        >
          <Utensils className="size-3 text-[#8A93A3]" />
          <span className="hidden 2xl:inline">Sur place</span>
          <span className="font-mono text-[11px] px-1 py-0.2 rounded bg-[#181B22] text-[#8A93A3]">
            {countsByType.dine_in}
          </span>
        </button>
      </div>

      {/* 4. TOTAL À PRODUIRE (BOUTON DÉROULANT COMPACT) */}
      <div className="relative shrink-0" ref={produceRef}>
        <button
          type="button"
          onClick={() => setShowProduceDropdown((prev) => !prev)}
          className="h-8 px-2.5 rounded bg-[#0F1115] hover:bg-[#262A33] border border-[#262A33] text-xs font-medium text-[#F2F4F7] transition-colors cursor-pointer flex items-center gap-1.5"
          title="Afficher les plats en cours de préparation"
        >
          <UtensilsCrossed className="size-3.5 text-[#8A93A3]" />
          <span>Total à produire ({totalProduceCount})</span>
          <ChevronDown
            className={`size-3 text-[#8A93A3] transition-transform ${
              showProduceDropdown ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showProduceDropdown && (
          <div className="absolute left-0 top-full mt-1.5 w-72 max-h-80 overflow-y-auto kds-grid-scroll rounded-lg border border-[#262A33] bg-[#181B22] shadow-2xl p-2.5 z-50 text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262A33] text-[#8A93A3] font-bold uppercase text-[11px]">
              <span>Plats à préparer / cuire</span>
              <span className="font-mono text-[#F59E0B] font-bold">
                {totalProduceCount} plats
              </span>
            </div>
            {produceList.length === 0 ? (
              <p className="text-xs text-[#5E6676] italic py-2 text-center">
                Aucun plat en cours
              </p>
            ) : (
              <div className="space-y-1.5">
                {produceList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 rounded bg-[#0F1115] border border-[#262A33] text-xs"
                  >
                    <span className="text-[#F2F4F7] truncate pr-2">
                      {item.name}
                    </span>
                    <span className="font-mono font-bold text-[#F59E0B] shrink-0 text-xs">
                      ×{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. ATTENTE MOYENNE + INDICATEUR DISCRET SI RETARD */}
      <div className="flex items-center gap-2.5 shrink-0 ml-auto text-xs">
        <span className="text-[#8A93A3] hidden md:inline">
          Attente moy. : <strong className="text-[#F2F4F7] font-mono">{avgWaitMinutes} min</strong>
        </span>

        {/* Indicateur retard : texte rouge avec icône, SANS fond rouge criard */}
        {lateCount > 0 && (
          <span
            className="text-[#EF4444] font-bold text-xs flex items-center gap-1 shrink-0"
            title={`${lateCount} commande(s) en retard (> 15 min)`}
          >
            <AlertTriangle className="size-3.5 stroke-[2.5]" />
            <span>{lateCount} en retard</span>
          </span>
        )}
      </div>

      {/* 6. DROITE : 3 ICÔNES SEULEMENT (HISTORIQUE, SON, PLEIN ÉCRAN) + MENU ⋯ */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Icône 1 : Historique */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="h-8 px-2 rounded bg-[#0F1115] hover:bg-[#262A33] border border-[#262A33] text-xs font-medium text-[#8A93A3] hover:text-[#F2F4F7] transition-colors cursor-pointer flex items-center gap-1"
          title="Historique des commandes (Livrées & Annulées)"
        >
          <History className="size-3.5" />
          <span className="font-mono text-[11px] px-1 py-0.2 rounded bg-[#181B22] text-[#8A93A3]">
            {historyCount}
          </span>
        </button>

        {/* Icône 2 : Son (Neutre gris) */}
        <button
          type="button"
          onClick={onToggleAudio}
          className="h-8 w-8 rounded bg-[#0F1115] hover:bg-[#262A33] border border-[#262A33] text-[#8A93A3] hover:text-[#F2F4F7] transition-colors cursor-pointer flex items-center justify-center"
          title={isAudioMuted ? 'Activer le carillon sonore' : 'Couper le son'}
        >
          {isAudioMuted ? (
            <VolumeX className="size-3.5" />
          ) : (
            <Volume2 className="size-3.5" />
          )}
        </button>

        {/* Icône 3 : Plein écran (Neutre gris) */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="h-8 w-8 rounded bg-[#0F1115] hover:bg-[#262A33] border border-[#262A33] text-[#8A93A3] hover:text-[#F2F4F7] transition-colors cursor-pointer flex items-center justify-center"
          title={isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}
        >
          {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
        </button>

        {/* Menu ⋯ pour filtres et options avancées */}
        <div className="relative" ref={moreRef}>
          <button
            type="button"
            onClick={() => setShowMoreMenu((prev) => !prev)}
            className="h-8 w-8 rounded bg-[#0F1115] hover:bg-[#262A33] border border-[#262A33] text-[#8A93A3] hover:text-[#F2F4F7] transition-colors cursor-pointer flex items-center justify-center"
            title="Options et filtres supplémentaires"
          >
            <MoreVertical className="size-3.5" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-60 rounded-lg border border-[#262A33] bg-[#181B22] p-3 shadow-2xl z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#262A33] font-bold text-[#F2F4F7]">
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="size-3.5" />
                  <span>Filtres avancés</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowMoreMenu(false)}
                  className="text-[#8A93A3] hover:text-[#F2F4F7]"
                >
                  ✕
                </button>
              </div>
              <div className="py-2.5 space-y-2">
                <div>
                  <label className="text-[11px] text-[#8A93A3] font-medium block mb-1">
                    Canal de vente
                  </label>
                  <select className="w-full bg-[#0F1115] border border-[#262A33] rounded p-1.5 text-xs text-[#F2F4F7] focus:outline-none">
                    <option value="all">Tous les canaux (Web & Caisse)</option>
                    <option value="web">Site Web Client</option>
                    <option value="pos">Comptoir Caisse</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#8A93A3] font-medium block mb-1">
                    Poste de préparation
                  </label>
                  <select className="w-full bg-[#0F1115] border border-[#262A33] rounded p-1.5 text-xs text-[#F2F4F7] focus:outline-none">
                    <option value="all">Tous les postes</option>
                    <option value="grill">Gril / Braise</option>
                    <option value="sides">Accompagnements / Boissons</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
