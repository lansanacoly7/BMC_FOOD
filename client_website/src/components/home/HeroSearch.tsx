import { Clock, Search } from 'lucide-react'
import { motion } from 'motion/react'
import { getDynamicGreeting } from '../../lib/greeting'

interface HeroSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

/**
 * Section Accueil et Recherche (Page 11 de la charte graphique, Point 2).
 * Intègre :
 * - Salutation dynamique selon l'heure (Bonjour / Bon appétit / Bonsoir).
 * - Barre de recherche interactive stylisée.
 * - Statut d'ouverture et livraison Dakar.
 * - Ambiance visuelle sombre avec vidéo/boucle chaude en arrière-plan et halo doré.
 */
export function HeroSearch({ searchQuery, onSearchChange }: HeroSearchProps) {
  const greeting = getDynamicGreeting()

  return (
    <section aria-label="Accueil et recherche" className="relative isolate overflow-hidden bg-bmc-black px-4 pb-8 pt-4 sm:px-6">
      {/* Boucle vidéo/animation d'ambiance en arrière-plan à faible opacité pour ne pas gêner */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 overflow-hidden opacity-20 mix-blend-screen">
        <img
          src="/images/brand/knife_slice_ambient.webp"
          alt=""
          className="size-full object-cover object-center filter blur-xs"
        />
        <div className="absolute inset-0 bg-linear-to-b from-bmc-black/80 via-bmc-black/60 to-bmc-black" />
      </div>

      {/* Halo doré ambré chaud signature BMC */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 -z-10 size-72 rounded-full bg-bmc-gold/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 bottom-0 -z-10 size-64 rounded-full bg-bmc-orange-braise/15 blur-3xl"
      />

      <div className="mx-auto max-w-lg space-y-4">
        {/* Titre et salutation dynamique (Page 11, Point 2) */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-1.5"
        >
          <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
            {greeting.salutation}{' '}
            <span className="block text-zinc-100">{greeting.subtitle}</span>
          </h1>
        </motion.div>

        {/* Barre de recherche arrondie (Page 11, Point 2) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative"
        >
          <label htmlFor="search-input" className="sr-only">
            Rechercher un tacos, un burger ou une boisson
          </label>
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-4 size-5 text-zinc-400 z-10" aria-hidden="true" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tacos, burger, boisson…"
              className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-900/95 pl-12 pr-4 text-sm text-white placeholder:text-zinc-500 shadow-inner backdrop-blur-md transition-all focus:border-bmc-gold focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-bmc-gold/30"
            />
          </div>
        </motion.div>

        {/* Statut d'ouverture et livraison (Page 11, Point 2) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex items-center gap-2 text-xs font-medium text-zinc-300"
        >
          <span
            className={`size-2 shrink-0 rounded-full ${
              greeting.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
            aria-hidden="true"
          />
          <span>
            <Clock className="mr-1 inline-block size-3.5 align-text-bottom" aria-hidden="true" />
            {greeting.statusLabel}
          </span>
        </motion.div>
      </div>
    </section>
  )
}
