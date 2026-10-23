import {
  Bus,
  Camera,
  CreditCard,
  EyeOff,
  Gift,
  Grid2x2,
  type LucideIcon,
  Settings,
  ShoppingBasket,
  Smartphone,
  UserRound,
  Vault,
} from 'lucide-react'

interface Shortcut {
  label: string
  icon: LucideIcon
  /** Fond pastel et couleur de l'icône, comme sur l'accueil de l'application. */
  tone: string
}

const SHORTCUTS: Shortcut[] = [
  { label: 'Transfert', icon: UserRound, tone: 'bg-indigo-100 text-indigo-800' },
  { label: 'Paiements', icon: ShoppingBasket, tone: 'bg-amber-100 text-amber-700' },
  { label: 'Crédit', icon: Smartphone, tone: 'bg-sky-100 text-sky-500' },
  { label: 'Coffre', icon: Vault, tone: 'bg-pink-100 text-fuchsia-700' },
  { label: 'Cadeaux', icon: Gift, tone: 'bg-green-100 text-green-600' },
  { label: 'Carte', icon: CreditCard, tone: 'bg-violet-100 text-violet-700' },
  { label: 'Transport', icon: Bus, tone: 'bg-orange-100 text-orange-600' },
  { label: 'Plus', icon: Grid2x2, tone: 'bg-zinc-200 text-zinc-600' },
]

const QR_SIZE = 25

/** Vrai si le module (x, y) appartient à l'un des trois carrés de repérage d'un QR code. */
function isFinder(x: number, y: number) {
  for (const [ox, oy] of [[0, 0], [QR_SIZE - 7, 0], [0, QR_SIZE - 7]]) {
    const dx = x - ox
    const dy = y - oy
    if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) {
      const ring = Math.min(dx, dy, 6 - dx, 6 - dy)
      return ring !== 1
    }
  }
  return null
}

/** Modules d'un QR code décoratif (non scannable), tirés d'un générateur pseudo-aléatoire fixe. */
const QR_MODULES = (() => {
  let seed = 7
  const cells: [number, number][] = []
  for (let y = 0; y < QR_SIZE; y++) {
    for (let x = 0; x < QR_SIZE; x++) {
      seed = (seed * 1103515245 + 12345) % 2147483648
      const finder = isFinder(x, y)
      const separator = (x < 8 && y < 8) || (x >= QR_SIZE - 8 && y < 8) || (x < 8 && y >= QR_SIZE - 8)
      if (finder === true || (finder === null && !separator && seed % 100 < 48)) cells.push([x, y])
    }
  }
  return cells
})()

function DecorativeQr() {
  return (
    <svg viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`} className="size-[6.25rem]" shapeRendering="crispEdges">
      {QR_MODULES.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#18181B" />
      ))}
    </svg>
  )
}

/** Motif en losanges de la carte bleue de l'application. */
const CARD_PATTERN =
  'repeating-linear-gradient(45deg, rgb(255 255 255 / 0.13) 0 3px, transparent 3px 22px), repeating-linear-gradient(-45deg, rgb(255 255 255 / 0.13) 0 3px, transparent 3px 22px)'

/**
 * Accueil de l'application Wave reproduit en arrière-plan de l'écran de paiement simulé (démo).
 * Décoratif uniquement : rien n'y est cliquable et le solde est masqué (aucune fausse donnée financière).
 */
export function WaveHomeBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-white select-none">
      {/* En-tête indigo : réglages et solde. */}
      <div className="h-64 bg-wave-indigo px-4 pt-[max(3.25rem,calc(env(safe-area-inset-top)+2.25rem))] text-white">
        <Settings className="size-7" strokeWidth={2.5} />
        <p className="mt-3 flex items-center justify-center gap-2 font-display text-[2.6rem] leading-none font-extrabold tracking-tight">
          ●●●<span className="text-2xl">F</span>
          <EyeOff className="ml-1 size-6" strokeWidth={2.5} />
        </p>
      </div>

      {/* Carte bleue « Scanner » à cheval sur l'en-tête et le panneau blanc. */}
      <div
        className="absolute left-1/2 top-[9.4rem] z-10 h-[9.5rem] w-[70%] max-w-[22rem] -translate-x-1/2 rounded-2xl bg-wave"
        style={{ backgroundImage: CARD_PATTERN }}
      >
        <div className="absolute left-1/2 top-2 flex -translate-x-1/2 flex-col items-center rounded-xl bg-white px-2.5 pb-1.5 pt-2.5">
          <DecorativeQr />
          <span className="mt-1 flex items-center gap-1 text-[0.8rem] font-bold text-bmc-charcoal">
            <Camera className="size-3.5" fill="currentColor" stroke="white" />
            Scanner
          </span>
        </div>
        <img
          src="/images/payments/wave-penguin.webp"
          alt=""
          width={40}
          height={48}
          className="absolute -right-0 bottom-1 h-12 w-auto"
        />
      </div>

      {/* Panneau blanc arrondi et raccourcis. */}
      <div className="absolute inset-x-0 top-[15.7rem] rounded-t-[1.75rem] bg-white px-3 pt-24">
        <ul className="grid grid-cols-4 gap-y-4 text-center">
          {SHORTCUTS.map(({ label, icon: Icon, tone }) => (
            <li key={label} className="flex flex-col items-center gap-1.5">
              <span className={`grid size-[3.4rem] place-items-center rounded-full ${tone}`}>
                <Icon className="size-7" />
              </span>
              <span className="text-[0.82rem] font-semibold text-bmc-charcoal">{label}</span>
            </li>
          ))}
        </ul>
        <div className="mx-1 mt-5 h-2 bg-zinc-100" />
      </div>
    </div>
  )
}
