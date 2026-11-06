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
      className={`px-3 py-2 cursor-pointer select-none border-b border-[#262A33]/50 transition-colors ${
        isDone
          ? 'bg-[#13151A]/40 text-[#5E6676]'
          : 'hover:bg-[#1F232C] text-[#F2F4F7]'
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
      title="Cliquer pour rayer / valider ce plat"
    >
      {/* LIGNE PRINCIPALE DU PLAT : 17px semi-gras */}
      <div
        className={`flex items-baseline gap-1.5 text-[17px] font-semibold leading-snug tracking-tight ${
          isDone ? 'line-through text-[#5E6676]' : 'text-[#F2F4F7]'
        }`}
      >
        <span className="font-mono font-bold text-[#8A93A3] shrink-0">
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
            isDone ? 'line-through text-[#454B58]' : 'text-[#8A93A3]'
          }`}
        >
          {item.options.join(' · ')}
        </div>
      )}

      {/* REMARQUE CUISINE : Texte blanc, en gras, avec petite icône accent devant, sans fond coloré */}
      {item.notes && (
        <div
          className={`text-[14px] font-bold pl-5 mt-0.5 leading-tight line-clamp-2 break-words flex items-start gap-1 ${
            isDone ? 'line-through text-[#5E6676]' : 'text-[#F2F4F7]'
          }`}
        >
          <span className="text-[#F59E0B] font-black shrink-0 select-none">◆</span>
          <span>{item.notes}</span>
        </div>
      )}
    </div>
  )
}
