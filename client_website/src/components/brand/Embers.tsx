import type { CSSProperties } from 'react'

/*
 * Braises qui montent, comme au-dessus d'un grill : or BMC, orange braise et orange flamme
 * (l'orange flamme est réservé aux illustrations et visuels, charte page 6 : c'est le cas ici).
 * Positions tirées une fois pour toutes avec un générateur déterministe : aucun tirage au rendu,
 * le dessin est identique à chaque affichage. Animation 100 % CSS (transform et opacité seulement),
 * coupée si le système demande de réduire les animations.
 */

const EMBER_COLORS = ['#FCB800', '#CF4A08', '#F97316', '#FCB800'] as const

interface Ember {
  left: number
  size: number
  duration: number
  delay: number
  drift: number
  opacity: number
  color: string
}

/** Générateur pseudo-aléatoire reproductible (mulberry32). */
function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createEmbers(count: number, seed: number): Ember[] {
  const random = seeded(seed)
  return Array.from({ length: count }, (_, index) => ({
    left: random() * 100,
    size: 2 + random() * 3.5,
    duration: 5 + random() * 6,
    delay: -random() * 10,
    drift: (random() - 0.5) * 90,
    opacity: 0.45 + random() * 0.5,
    color: EMBER_COLORS[index % EMBER_COLORS.length],
  }))
}

const EMBER_SETS = {
  intro: createEmbers(26, 20261021),
  hero: createEmbers(18, 20261110),
} as const

interface EmbersProps {
  variant: keyof typeof EMBER_SETS
  /** Hauteur de montée en pixels. */
  rise?: number
  className?: string
}

export function Embers({ variant, rise = 640, className }: EmbersProps) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`}>
      {EMBER_SETS[variant].map((ember, index) => (
        <span
          key={index}
          className="bmc-ember"
          style={
            {
              left: `${ember.left}%`,
              width: ember.size,
              height: ember.size,
              backgroundColor: ember.color,
              boxShadow: `0 0 ${ember.size * 3}px ${ember.color}`,
              animationDuration: `${ember.duration}s`,
              animationDelay: `${ember.delay}s`,
              '--ember-drift': `${ember.drift}px`,
              '--ember-rise': `${rise}px`,
              '--ember-opacity': ember.opacity,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
