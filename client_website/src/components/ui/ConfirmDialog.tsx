import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  /** Action destructive : le bouton de confirmation passe en rouge. */
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Petite fenêtre de confirmation, centrée, fermable avec Échap ou en touchant le fond. */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    cancelRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onCancel])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/70"
            aria-hidden="true"
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 text-left"
          >
            <h2 id={titleId} className="font-display text-lg font-bold text-white">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{description}</p>
            <div className="mt-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                className="inline-flex h-12 cursor-pointer items-center justify-center rounded-lg border border-white/20 px-4 text-sm font-semibold text-white transition-colors hover:border-white/40"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`inline-flex h-12 cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors ${
                  destructive
                    ? 'bg-red-700 text-white hover:bg-red-800'
                    : 'bg-bmc-gold text-black hover:bg-amber-400'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
