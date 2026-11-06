import React, { useEffect, useState } from 'react'
import { RotateCcw, CheckCircle2, X } from 'lucide-react'
import type { UndoableAction } from '../../hooks/useOrders'

interface ToastProps {
  undoAction: UndoableAction | null
  onUndo: (orderRef: string) => void
  onDismiss: () => void
}

export const Toast: React.FC<ToastProps> = ({ undoAction, onUndo, onDismiss }) => {
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
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col overflow-hidden rounded-lg shadow-2xl border border-[#262A33] bg-[#171A21] w-full max-w-sm select-none"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between p-3 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-7 rounded bg-[#E8A33D]/15 border border-[#E8A33D]/30 flex items-center justify-center shrink-0 text-[#E8A33D]">
            <CheckCircle2 className="size-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#E6E8EC] truncate">
              {displayRef} → {getStatusLabel(undoAction.targetStatus)}
            </div>
            <div className="text-[11px] text-[#8B93A1]">
              Annulation possible (5s)
            </div>
          </div>
        </div>

        {/* Bouton d'annulation 5s (contraste élevé AA) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onUndo(undoAction.orderRef)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#E8A33D] hover:bg-[#D69330] text-[#0F1115] text-xs font-bold uppercase tracking-tight transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <RotateCcw className="size-3 stroke-[2.5]" />
            <span>Annuler</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-[#8B93A1] hover:text-[#E6E8EC] rounded hover:bg-[#262A33] transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Barre de défilement 5s */}
      <div className="w-full h-1 bg-[#12141A]">
        <div
          className="h-full bg-[#E8A33D] transition-all ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </aside>
  )
}
