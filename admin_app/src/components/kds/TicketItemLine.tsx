import React from 'react'
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
      className={`px-3 py-2 cursor-pointer select-none border-b border-[#262D38]/50 transition-colors ${
        isDone
          ? 'bg-[#13171E]/50 text-[#687385]'
          : 'hover:bg-[#232934] text-[#FFFFFF]'
      }`}
      role="button"
      aria-pressed={isDone}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onToggleDone(index)
        }
      }}
      title="Cliquer pour barrer / valider ce plat"
    >
      {/* LIGNE PRINCIPALE DU PLAT : 17px semi-gras, une ligne si possible, max 2 */}
      <div
        className={`flex items-baseline gap-1.5 text-[17px] font-semibold leading-snug tracking-tight ${
          isDone ? 'line-through text-[#687385]' : 'text-[#FFFFFF]'
        }`}
      >
        <span className="font-mono font-bold text-[#E6E8EC] shrink-0">
          {item.quantity}×
        </span>
        <span className="line-clamp-2 break-words leading-tight">
          {item.name}
        </span>
      </div>

      {/* OPTIONS DU PLAT : 13px gris */}
      {item.options && item.options.length > 0 && (
        <div
          className={`text-[13px] pl-5 mt-0.5 leading-tight line-clamp-2 break-words ${
            isDone ? 'line-through text-[#505D72]' : 'text-[#9AA4B2]'
          }`}
        >
          {item.options.join(' · ')}
        </div>
      )}

      {/* REMARQUE CUISINE : 14px ambre gras */}
      {item.notes && (
        <div
          className={`text-[14px] font-bold pl-5 mt-0.5 leading-tight line-clamp-2 break-words ${
            isDone ? 'line-through text-[#806B1F]' : 'text-[#F59E0B]'
          }`}
        >
          * {item.notes}
        </div>
      )}
    </div>
  )
}
