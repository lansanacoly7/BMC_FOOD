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
        return 'En cuisine'
      case 'ready':
        return 'Prêt'
      case 'delivering':
        return 'En livraison'
      case 'delivered':
        return 'Livré'
      default:
        return s
    }
  }

  return (
    <aside
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col overflow-hidden rounded-xl shadow-2xl border w-full max-w-md animate-in fade-in slide-in-from-bottom-5 duration-200 select-none"
      style={{
        backgroundColor: '#14171C',
        borderColor: '#F5B301',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.8), 0 0 15px rgba(245, 179, 1, 0.2)',
      }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between p-3.5 gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: 'rgba(245, 179, 1, 0.12)',
              borderColor: 'rgba(245, 179, 1, 0.35)',
              color: '#F5B301',
            }}
          >
            <CheckCircle2 size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-black" style={{ color: '#F2F4F7' }}>
              {undoAction.orderRef} mis à jour
            </div>
            <div className="text-xs font-medium" style={{ color: '#9AA3AF' }}>
              Passé à «&nbsp;{getStatusLabel(undoAction.targetStatus)}&nbsp;»
            </div>
          </div>
        </div>

        {/* Bouton d'annulation 5s */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onUndo(undoAction.orderRef)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all transform active:scale-95 shadow-sm"
            style={{
              backgroundColor: '#F5B301',
              color: '#0B0D10',
            }}
          >
            <RotateCcw size={14} strokeWidth={3} />
            <span>Annuler</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-md"
            title="Fermer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Barre de défilement 5s */}
      <div className="w-full h-1" style={{ backgroundColor: '#232830' }}>
        <div
          className="h-full transition-all ease-linear"
          style={{
            width: `${progress}%`,
            backgroundColor: '#F5B301',
          }}
        />
      </div>
    </aside>

  )
}
