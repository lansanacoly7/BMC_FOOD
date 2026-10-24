import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  /** Ligne secondaire sous le libellé (ex. le tarif). */
  hint?: string
}

interface SelectProps {
  id?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  /** Texte affiché tant qu'aucune valeur n'est choisie. */
  placeholder?: string
  'aria-label'?: string
}

/**
 * Liste déroulante aux couleurs du site (remplace le menu natif du navigateur) : champ identique aux autres
 * champs, liste arrondie qui défile, option choisie marquée d'une coche. Clavier : flèches, Début/Fin,
 * Entrée, Échap ; un appui en dehors la ferme.
 */
export function Select({ id, value, onChange, options, placeholder = 'Choisir', 'aria-label': ariaLabel }: SelectProps) {
  const generatedId = useId()
  const baseId = id ?? generatedId
  const listId = `${baseId}-list`
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Garde l'option active visible dans la liste
  useEffect(() => {
    if (!open) return
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const openList = () => {
    const index = options.findIndex((option) => option.value === value)
    setActive(index >= 0 ? index : 0)
    setOpen(true)
  }

  const choose = (index: number) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    setOpen(false)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!open) openList()
        else setActive((index) => Math.min(options.length - 1, index + 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!open) openList()
        else setActive((index) => Math.max(0, index - 1))
        break
      case 'Home':
        if (open) {
          event.preventDefault()
          setActive(0)
        }
        break
      case 'End':
        if (open) {
          event.preventDefault()
          setActive(options.length - 1)
        }
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (open) choose(active)
        else openList()
        break
      case 'Escape':
        if (open) {
          event.preventDefault()
          event.stopPropagation()
          setOpen(false)
        }
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={baseId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-activedescendant={open ? `${baseId}-option-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`flex h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border bg-zinc-950 px-3.5 text-left text-sm outline-none transition-colors ${
          open ? 'border-bmc-gold' : 'border-white/15 hover:border-white/30 focus-visible:border-bmc-gold'
        }`}
      >
        <span className={`min-w-0 truncate ${selected ? 'text-white' : 'text-zinc-500'}`}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={`size-4 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={baseId}
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-zinc-900 p-1.5 shadow-lg"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            return (
              <li
                key={option.value}
                id={`${baseId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                  index === active ? 'bg-white/10' : ''
                } ${isSelected ? 'text-bmc-gold' : 'text-zinc-200'}`}
              >
                <span className="min-w-0">
                  <span className="block truncate">{option.label}</span>
                  {option.hint && <span className="block truncate text-xs text-zinc-400">{option.hint}</span>}
                </span>
                {isSelected && <Check className="size-4 shrink-0" aria-hidden="true" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
