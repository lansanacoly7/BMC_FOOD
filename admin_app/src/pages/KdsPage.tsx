import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ColumnDefinition, KdsOrder, KdsOrderStatus } from '../types/kds'
import { KanbanColumn } from '../components/kds/KanbanColumn'

interface KdsPageProps {
  orders: KdsOrder[]
  nowMs: number
  searchQuery: string
  onTransition: (orderRef: string, nextStatus: KdsOrderStatus) => void
  onCancel: (orderRef: string) => void
  onViewDetails: (order: KdsOrder) => void
  onPrintTicket: (order: KdsOrder) => void
}

export const KDS_COLUMNS: ColumnDefinition[] = [
  {
    id: 'pending',
    title: 'À PRÉPARER',
    subtitle: 'Nouvelles commandes',
    badgeColor: '#F5B301',
    borderColor: '#232830',
    actionLabel: 'Lancer la cuisson',
    actionClass: '',
    nextStatus: 'preparing',
    emptyMessage: 'Aucune commande en attente',
  },
  {
    id: 'preparing',
    title: 'EN CUISINE',
    subtitle: 'Au gril et braisage',
    badgeColor: '#F5B301',
    borderColor: '#232830',
    actionLabel: 'Marquer prêt',
    actionClass: '',
    nextStatus: 'ready',
    emptyMessage: 'Aucune commande au gril',
  },
  {
    id: 'ready',
    title: 'PRÊT À RÉCUPÉRER',
    subtitle: 'Attente départ / comptoir',
    badgeColor: '#F5B301',
    borderColor: '#232830',
    actionLabel: 'Remettre au livreur',
    actionClass: '',
    nextStatus: 'delivering',
    emptyMessage: 'Toutes les commandes sont remises',
  },
  {
    id: 'delivering',
    title: 'EN LIVRAISON',
    subtitle: 'Livreurs sur la route',
    badgeColor: '#F5B301',
    borderColor: '#232830',
    actionLabel: 'Confirmer livraison',
    actionClass: '',
    nextStatus: 'delivered',
    emptyMessage: 'Aucun livreur sur la route',
  },
]

export const KdsPage: React.FC<KdsPageProps> = ({
  orders,
  nowMs,
  searchQuery,
  onTransition,
  onCancel,
  onViewDetails,
  onPrintTicket,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [activeColumnIndex, setActiveColumnIndex] = useState<number>(0)

  // Filtrage par recherche (#réf, nom, téléphone, articles)
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders
    const q = searchQuery.toLowerCase()
    return orders.filter((o) => {
      const matchRef = o.orderRef.toLowerCase().includes(q)
      const matchName = o.customerName.toLowerCase().includes(q)
      const matchPhone = o.phone.toLowerCase().includes(q)
      const matchAddress = o.address.toLowerCase().includes(q)
      const matchItems = o.items.some((i) => i.name.toLowerCase().includes(q))
      return matchRef || matchName || matchPhone || matchAddress || matchItems
    })
  }, [orders, searchQuery])

  // Regroupement par statut
  const ordersByStatus = useMemo(() => {
    const map: Record<KdsOrderStatus, KdsOrder[]> = {
      pending: [],
      preparing: [],
      ready: [],
      delivering: [],
      delivered: [],
      cancelled: [],
    }

    filteredOrders.forEach((o) => {
      if (map[o.status]) {
        map[o.status].push(o)
      }
    })

    // Tri FIFO : les plus anciennes en premier
    Object.keys(map).forEach((k) => {
      map[k as KdsOrderStatus].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    })

    return map
  }, [filteredOrders])

  // Prise en charge de la molette pour le défilement horizontal (Shift + molette ou molette directe)
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return
      // Si défilement vertical, converti en défilement horizontal
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        el.scrollBy({ left: e.deltaY * 1.5, behavior: 'auto' })
      }
    }

    const handleScroll = () => {
      if (!el) return
      const scrollLeft = el.scrollLeft
      const colWidth = el.scrollWidth / KDS_COLUMNS.length
      const index = Math.round(scrollLeft / colWidth)
      setActiveColumnIndex(Math.max(0, Math.min(KDS_COLUMNS.length - 1, index)))
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    el.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      el.removeEventListener('wheel', handleWheel)
      el.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToColumn = (index: number) => {
    const el = scrollContainerRef.current
    if (!el) return
    const colWidth = el.scrollWidth / KDS_COLUMNS.length
    el.scrollTo({ left: index * colWidth, behavior: 'smooth' })
    setActiveColumnIndex(index)
  }

  const scrollLeft = () => {
    scrollToColumn(Math.max(0, activeColumnIndex - 1))
  }

  const scrollRight = () => {
    scrollToColumn(Math.min(KDS_COLUMNS.length - 1, activeColumnIndex + 1))
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden p-4 pb-2">
      {/* CONTENEUR KANBAN AVEC SCROLL-SNAP HORIZONTAL ET HAUTEUR 100% */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-stretch gap-4 overflow-x-auto min-h-0 kds-kanban-scroll pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {KDS_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            definition={col}
            orders={ordersByStatus[col.id] || []}
            nowMs={nowMs}
            onTransition={onTransition}
            onCancel={onCancel}
            onViewDetails={onViewDetails}
            onPrintTicket={onPrintTicket}
          />
        ))}
      </div>

      {/* SLIDE BAR DE NAVIGATION EN BAS DU TABLEAU */}
      <footer
        className="h-9 min-h-[36px] flex items-center justify-between px-3 pt-1 border-t select-none shrink-0"
        style={{
          borderColor: '#232830',
          backgroundColor: '#0B0D10',
        }}
        aria-label="Navigation du Kanban"
      >
        {/* Flèche gauche */}
        <button
          type="button"
          onClick={scrollLeft}
          disabled={activeColumnIndex === 0}
          className="p-1 rounded-lg border text-slate-300 hover:text-white hover:border-[#F5B301] disabled:opacity-30 disabled:hover:border-[#232830] transition-colors"
          style={{
            backgroundColor: '#14171C',
            borderColor: '#232830',
          }}
          title="Faire défiler vers la gauche"
        >
          <ChevronLeft size={16} />
        </button>

        {/* 4 Indicateurs de position de colonne */}
        <div className="flex items-center gap-2">
          {KDS_COLUMNS.map((col, idx) => {
            const isActive = activeColumnIndex === idx
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => scrollToColumn(idx)}
                className="transition-all rounded-full"
                style={{
                  height: '8px',
                  width: isActive ? '24px' : '8px',
                  backgroundColor: isActive ? '#F5B301' : '#3A414C',
                }}
                title={`Aller à : ${col.title}`}
                aria-label={`Colonne ${idx + 1} : ${col.title}`}
              />
            )
          })}
        </div>

        {/* Flèche droite */}
        <button
          type="button"
          onClick={scrollRight}
          disabled={activeColumnIndex === KDS_COLUMNS.length - 1}
          className="p-1 rounded-lg border text-slate-300 hover:text-white hover:border-[#F5B301] disabled:opacity-30 disabled:hover:border-[#232830] transition-colors"
          style={{
            backgroundColor: '#14171C',
            borderColor: '#232830',
          }}
          title="Faire défiler vers la droite"
        >
          <ChevronRight size={16} />
        </button>
      </footer>
    </div>
  )
}
