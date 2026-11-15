import React, { useEffect, useState } from 'react'
import { CheckCircle2, RotateCcw } from 'lucide-react'
import type { UndoableAction } from '../../hooks/useOrders'

interface ToastProps {
  undoAction: UndoableAction | null
  onUndo: (orderRef: string) => void
}

export const Toast: React.FC<ToastProps> = ({ undoAction, onUndo }) => {
  const [progress, setProgress] = useState<number>(100)

  useEffect(() => {
    if (!undoAction) {
      setProgress(100)
      return
    }

    const duration = 5000 // 5 secondes
    const start = undoAction.timestamp
    const end = start + duration

    const updateProgress = () => {
      const now = Date.now()
      const remaining = Math.max(0, end - now)
      const pct = (remaining / duration) * 100
      setProgress(pct)

      if (remaining > 0) {
        requestAnimationFrame(updateProgress)
      }
    }

    const frameId = requestAnimationFrame(updateProgress)
    return () => cancelAnimationFrame(frameId)
  }, [undoAction])

  if (!undoAction) return null

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'pending':
        return 'À préparer'
      case 'preparing':
        return 'En cuisson'
      case 'ready':
        return 'Prêt'
      case 'delivering':
        return 'En livraison'
      case 'delivered':
        return 'Remis'
      case 'cancelled':
        return 'Annulée'
      default:
        return s
    }
  }

  const displayRef = undoAction.orderRef.replace(/^#?BMC-?/, '#')

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed right-3 top-[74px] z-50 flex h-11 select-none items-center gap-3 overflow-hidden rounded-lg border border-line bg-surface pl-3 pr-1.5 text-ink shadow-2xl"
    >
      <CheckCircle2 className="size-4 shrink-0 text-bmc-gold" />
      <span className="whitespace-nowrap text-[13px] font-semibold tabular-nums">
        {displayRef} · {getStatusLabel(undoAction.targetStatus)}
      </span>
      <button
        type="button"
        onClick={() => onUndo(undoAction.orderRef)}
        className="flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md bg-bmc-gold px-2.5 font-display text-[13px] font-bold text-bmc-charcoal transition-colors hover:bg-[#E5A700]"
      >
        <RotateCcw className="size-3.5" />
        Annuler
      </button>

      {/* Temps restant pour annuler */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-canvas">
        <div className="h-full bg-bmc-gold" style={{ width: `${progress}%` }} />
      </div>
    </aside>
  )
}
