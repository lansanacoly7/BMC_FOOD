import React from 'react'
import type { KdsOrder, KdsOrderStatus } from '../../types/kds'
import { ProduceSummary } from './ProduceSummary'
import { ReadyTray } from './ReadyTray'

interface BottomBarProps {
  orders: KdsOrder[]
  onTransition: (orderRef: string, nextStatus: KdsOrderStatus) => void
}

export const BottomBar: React.FC<BottomBarProps> = ({ orders, onTransition }) => {
  return (
    <footer
      className="border-t border-[#262D38] bg-[#1A1F27] p-2.5 flex flex-col md:flex-row items-stretch justify-between gap-3 shrink-0 select-none shadow-lg z-20"
      aria-label="Barre basse de production et remise"
    >
      {/* SECTION GAUCHE : TOTAL À PRODUIRE */}
      <ProduceSummary orders={orders} />

      {/* SECTION DROITE : PRÊTES À REMETTRE */}
      <ReadyTray orders={orders} onTransition={onTransition} />
    </footer>
  )
}
