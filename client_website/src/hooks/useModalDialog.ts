import { type RefObject, useEffect, useEffectEvent } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Comportement commun des fenêtres modales : page figée, focus placé dans la fenêtre et piégé (Tab / Maj+Tab),
 * fermeture par Échap, focus rendu à l'élément d'origine à la fermeture. Même comportement que le CartDrawer.
 */
export function useModalDialog(isOpen: boolean, onClose: () => void, dialogRef: RefObject<HTMLElement | null>) {
  const handleEscape = useEffectEvent(onClose)

  useEffect(() => {
    if (!isOpen) return

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleEscape()
        return
      }
      const dialog = dialogRef.current
      if (event.key !== 'Tab' || !dialog) return

      const focusables = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [isOpen, dialogRef])
}
