import React from 'react'
import { Check } from 'lucide-react'
import type { KdsOrderItem } from '../../types/kds'

interface TicketItemLineProps {
  item: KdsOrderItem
  index: number
  isDone: boolean
  onToggleDone: (index: number) => void
}

export const TicketItemLine: React.FC<TicketItemLineProps> = ({
  item,
  index,
  isDone,
  onToggleDone,
}) => {
  return (
    <div
      onClick={() => onToggleDone(index)}
      className={`min-h-[56px] px-3 py-2 flex items-start justify-between gap-3 cursor-pointer select-none border-b border-[#262D38]/60 transition-colors ${
        isDone
          ? 'bg-[#13171E]/60 text-[#687385]'
          : 'hover:bg-[#232934] text-[#FFFFFF]'
      }`}
      role="checkbox"
      aria-checked={isDone}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onToggleDone(index)
        }
      }}
    >
      <div className="flex-1 min-w-0">
        {/* LIGNE PRINCIPALE DU PLAT : 20px semi-gras, quantité géante */}
        <div
          className={`flex items-baseline gap-2 text-[18px] xl:text-[20px] font-semibold leading-tight tracking-tight ${
            isDone ? 'line-through text-[#687385]' : 'text-[#FFFFFF]'
          }`}
        >
          <span className="font-mono font-black text-[#F5B800] text-[20px] xl:text-[22px] shrink-0">
            {item.quantity}×
          </span>
          <span className="break-words line-clamp-2">{item.name}</span>
        </div>

        {/* OPTIONS DU PLAT : 15px gris dessous */}
        {item.options && item.options.length > 0 && (
          <div
            className={`text-[13px] xl:text-[15px] pl-6 xl:pl-7 mt-0.5 leading-tight break-words line-clamp-2 ${
              isDone ? 'line-through text-[#505D72]' : 'text-[#9AA4B2]'
            }`}
          >
            {item.options.join(' · ')}
          </div>
        )}

        {/* REMARQUES CUISINE (sans oignons crus, cuisson à point) : 16px jaune vif gras */}
        {item.notes && (
          <div
            className={`text-[14px] xl:text-[16px] font-bold pl-6 xl:pl-7 mt-0.5 leading-tight break-words line-clamp-2 ${
              isDone ? 'line-through text-[#806B1F]' : 'text-[#F5B800]'
            }`}
          >
            * {item.notes}
          </div>
        )}
      </div>

      {/* TÉMOIN TACTILE D'ACCOMPLISSEMENT */}
      <div className="shrink-0 mt-1">
        <div
          className={`size-6 rounded flex items-center justify-center border transition-colors ${
            isDone
              ? 'bg-[#1FA855] border-[#1FA855] text-[#FFFFFF]'
              : 'border-[#3A4454] bg-[#0E1116] hover:border-[#F5B800]'
          }`}
        >
          {isDone && <Check className="size-4 stroke-[3]" />}
        </div>
      </div>
    </div>
  )
}
