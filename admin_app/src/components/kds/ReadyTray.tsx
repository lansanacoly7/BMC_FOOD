import React from 'react'
import { Bike, ShoppingBag, Utensils, CheckCircle2 } from 'lucide-react'
import type { KdsOrder, KdsOrderStatus, OrderType } from '../../types/kds'

interface ReadyTrayProps {
  orders: KdsOrder[]
  onTransition: (orderRef: string, nextStatus: KdsOrderStatus) => void
}

const TYPE_CONFIG: Record<
  OrderType,
  { label: string; icon: React.FC<{ className?: string }> }
> = {
  delivery: { label: 'Livraison', icon: Bike },
  takeaway: { label: 'Emporter', icon: ShoppingBag },
  dine_in: { label: 'Sur place', icon: Utensils },
}

export const ReadyTray: React.FC<ReadyTrayProps> = ({ orders, onTransition }) => {
  // Commandes prêtes à être remises (ready + delivering)
  const readyOrders = orders.filter(
    (o) => o.status === 'ready' || o.status === 'delivering',
  )

  return (
    <div className="flex-1 min-w-0 pl-3 flex flex-col justify-center">
      <div className="flex items-center gap-1.5 mb-1">
        <CheckCircle2 className="size-3.5 text-[#1FA855]" />
        <span className="text-[11px] font-black uppercase tracking-wider text-[#9AA4B2]">
          Prêtes à remettre
        </span>
        <span className="font-mono text-xs font-bold text-[#1FA855]">
          ({readyOrders.length})
        </span>
      </div>

      {readyOrders.length === 0 ? (
        <div className="text-[11px] text-[#687385] italic">
          Aucune commande en attente de remise
        </div>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto kds-grid-scroll py-0.5">
          {readyOrders.map((order) => {
            const displayRef = order.orderRef.replace(/^#?BMC-?/, '')
            const isDelivery = order.orderType === 'delivery'
            const typeCfg = TYPE_CONFIG[order.orderType] || TYPE_CONFIG.delivery
            const TypeIcon = typeCfg.icon
            const actionText = isDelivery ? 'Remis au livreur' : 'Remis au client'

            return (
              <button
                key={order.id}
                type="button"
                onClick={() => onTransition(order.orderRef, 'delivered')}
                className="h-11 px-3 rounded-md bg-[#1FA855] hover:bg-[#188B46] text-[#FFFFFF] border border-[#1FA855]/60 flex items-center gap-2 shrink-0 cursor-pointer shadow transition-all active:scale-95 group text-left"
                title={`Cliquer pour marquer : ${actionText}`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-black tracking-tight">
                      #{displayRef}
                    </span>
                    <span className="text-[10px] uppercase font-bold opacity-80 flex items-center gap-0.5">
                      <TypeIcon className="size-2.5" />
                      <span>{typeCfg.label}</span>
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold truncate max-w-[120px] opacity-90 leading-none">
                    {order.customerName}
                  </span>
                </div>

                <div className="pl-1 border-l border-white/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 whitespace-nowrap">
                  <span>{isDelivery ? 'Livreur' : 'Client'}</span>
                  <span>→</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
