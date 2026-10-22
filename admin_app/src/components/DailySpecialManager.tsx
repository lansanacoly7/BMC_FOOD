import {
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Flame,
  PowerOff,
  RefreshCw,
  Search,
  Sparkles,
  Utensils,
  XCircle,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ADMIN_CATEGORIES, ADMIN_PRODUCTS } from '../data/mockProducts'
import type { Product } from '../types'

const STORAGE_KEY = 'bmc_active_special_code'

export function DailySpecialManager() {
  const [products] = useState<Product[]>(ADMIN_PRODUCTS)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Code du plat actif en Plat du Jour (initialisé avec localStorage ou le premier par défaut)
  const [activeCode, setActiveCode] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored !== null ? stored : 'tp-1'
    } catch {
      return 'tp-1'
    }
  })

  // Heure en temps réel
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-fermeture du toast après 3 secondes
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  // Plat actif actuellement
  const activeProduct = products.find((p) => p.code === activeCode) || null

  // Filtrage du catalogue
  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'all' ||
      (selectedCategory === 'tacos-panes' && p.category === 2) ||
      (selectedCategory === 'burgers' && p.category === 3) ||
      (selectedCategory === 'tacos-simples' && p.category === 4) ||
      (selectedCategory === 'poulet-finger-food' && p.category === 5)

    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCat && matchesSearch
  })

  // Synchronisation initiale au chargement avec l'API REST
  useEffect(() => {
    fetch('http://localhost:8000/api/daily-special/')
      .then((res) => res.json())
      .then((data) => {
        if (data.daily_specials && data.daily_specials.length > 0) {
          setActiveCode(data.daily_specials[0].code)
        } else if (data.daily_specials && data.daily_specials.length === 0) {
          setActiveCode(null)
        }
      })
      .catch(() => {})
  }, [])

  // Activer ou remplacer le Plat du Jour
  const handleSelectSpecial = async (product: Product) => {
    setIsUpdating(true)
    try {
      setActiveCode(product.code)
      localStorage.setItem(STORAGE_KEY, product.code)
      window.dispatchEvent(new Event('storage'))

      // Appel officiel à l'API Django REST sur le port 8000
      await fetch('http://localhost:8000/api/daily-special/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: product.code, id: product.id }),
      }).catch(() => {})

      setToast({
        type: 'success',
        message: `« ${product.name} » est maintenant le Plat du Jour en ligne !`,
      })
    } catch {
      setToast({
        type: 'error',
        message: 'Erreur lors de la mise à jour du Plat du Jour.',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Désactiver le Plat du Jour
  const handleDeactivate = async () => {
    setIsUpdating(true)
    try {
      setActiveCode(null)
      localStorage.setItem(STORAGE_KEY, '')
      window.dispatchEvent(new Event('storage'))

      // Désactivation officielle auprès de l'API Django REST sur le port 8000
      await fetch('http://localhost:8000/api/daily-special/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: null }),
      }).catch(() => {})

      setToast({
        type: 'success',
        message: 'Le Plat du Jour a été désactivé. Le site client bascule en mode Best-Sellers.',
      })
    } catch {
      setToast({
        type: 'error',
        message: 'Erreur lors de la désactivation du Plat du Jour.',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      {/* Toast Notification Flottant */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-md"
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="size-5 text-rose-400 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-semibold text-white">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* En-tête Principal de l'Admin */}
      <header className="border-b border-white/10 bg-black/80 sticky top-0 z-40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-bmc-gold via-amber-400 to-amber-600 shadow-md shadow-bmc-gold/20">
              <Flame className="size-5 text-black fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base sm:text-lg font-black tracking-tight text-white">
                  BMC FOOD Dakar
                </span>
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-bmc-gold">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">
                Gestionnaire Officiel du Plat du Jour
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-zinc-900 border border-white/10 px-3 py-1.5">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-300 font-medium">Service de nuit actif</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-zinc-900 border border-white/10 px-3 py-1.5 text-zinc-200 font-bold tabular-nums">
              <Clock className="size-3.5 text-bmc-gold" />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu Principal */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        {/* 
          1. SECTION VEDETTE : LE PLAT DU JOUR ACTUELLEMENT EN LIGNE
        */}
        <section aria-label="Plat du jour actif" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-bmc-gold" />
              <h2 className="font-display text-sm sm:text-base font-extrabold uppercase tracking-wider text-white">
                Statut Actuel sur le Site Client
              </h2>
            </div>
            {activeProduct && (
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={isUpdating}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-900/60 transition-colors cursor-pointer"
              >
                <PowerOff className="size-3.5" />
                <span>Désactiver le Plat du Jour</span>
              </button>
            )}
          </div>

          {activeProduct ? (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative isolate overflow-hidden rounded-3xl border border-bmc-gold/40 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-5 sm:p-7 text-white shadow-2xl shadow-bmc-gold/10"
            >
              {/* Halo d'ambiance doré */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 -z-10 size-64 rounded-full bg-bmc-gold/15 blur-3xl"
              />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  {/* Aperçu du visuel net avec angles arrondis */}
                  <div className="relative size-24 sm:size-28 shrink-0 overflow-hidden rounded-2xl border border-bmc-gold/40 shadow-xl bg-zinc-950">
                    <img
                      src={activeProduct.image_url}
                      alt={activeProduct.name}
                      className="size-full object-cover object-center"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/15 rounded-2xl" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-bmc-gold px-2.5 py-0.5 font-display text-[11px] font-black uppercase tracking-wider text-black shadow-sm">
                        <Flame className="size-3 fill-black text-black" />
                        ★ Plat du Jour en Ligne
                      </span>
                      <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        Visible immédiatement par les clients
                      </span>
                    </div>

                    <h3 className="font-display text-lg sm:text-2xl font-black text-white">
                      {activeProduct.name}
                    </h3>
                    <p className="line-clamp-2 text-xs sm:text-sm text-zinc-300 max-w-xl font-normal">
                      {activeProduct.description}
                    </p>
                  </div>
                </div>

                {/* Tarif et Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0 gap-3">
                  <div className="text-left sm:text-right">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Prix public
                    </span>
                    <span className="font-display text-xl sm:text-3xl font-black tabular-nums text-bmc-gold">
                      {activeProduct.price.toLocaleString('fr-FR')} F CFA
                    </span>
                  </div>

                  <a
                    href="http://localhost:5173/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-bmc-gold hover:text-bmc-gold transition-colors"
                  >
                    <Eye className="size-3.5" />
                    <span>Voir sur le site client</span>
                  </a>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/15 bg-zinc-900/40 p-8 text-center space-y-2">
              <Utensils className="mx-auto size-8 text-zinc-500" />
              <p className="text-sm font-semibold text-zinc-300">
                Aucun Plat du Jour n’est actuellement activé
              </p>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Le site client affiche automatiquement les Best-Sellers du Chef dans le carrousel vedette.
                Sélectionnez un plat ci-dessous pour l’activer en 1 clic.
              </p>
            </div>
          )}
        </section>

        {/* 
          2. CATALOGUE DES PLATS : ACTIVER OU REMPLACER EN 1 CLIC
        */}
        <section aria-label="Catalogue des plats disponibles" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-white">
                Catalogue des Plats Disponibles
              </h2>
              <p className="text-xs text-zinc-400">
                Cliquez sur « Choisir comme Plat du Jour » pour remplacer instantanément le plat vedette.
              </p>
            </div>

            {/* Barre de recherche rapide */}
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un plat..."
                className="w-full rounded-xl border border-white/10 bg-zinc-900 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-bmc-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Filtres par Catégorie */}
          <div className="flex flex-wrap items-center gap-2">
            {ADMIN_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'bg-bmc-gold text-black shadow-md shadow-bmc-gold/20'
                    : 'bg-zinc-900 border border-white/10 text-zinc-300 hover:border-white/25 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Grille des Plats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {filteredProducts.map((product) => {
              const isCurrentSpecial = product.code === activeCode

              return (
                <div
                  key={product.code}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                    isCurrentSpecial
                      ? 'border-bmc-gold/60 bg-gradient-to-b from-zinc-900 to-black ring-1 ring-bmc-gold/40 shadow-lg shadow-bmc-gold/5'
                      : 'border-white/10 bg-zinc-900/70 hover:border-white/20 hover:bg-zinc-900'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Image du plat avec badge */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="size-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
                      />
                      {isCurrentSpecial && (
                        <div className="absolute top-2 left-2 rounded-full bg-bmc-gold px-2.5 py-0.5 font-display text-[10px] font-black uppercase tracking-wider text-black shadow-md">
                          ★ Plat du Jour Actuel
                        </div>
                      )}
                    </div>

                    {/* Infos du plat */}
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-sm sm:text-base font-extrabold text-white leading-snug">
                          {product.name}
                        </h3>
                        <span className="font-display text-xs sm:text-sm font-black tabular-nums text-bmc-gold shrink-0">
                          {product.price.toLocaleString('fr-FR')} F
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs text-zinc-400 font-normal leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  {/* Bouton d'action */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-zinc-400">
                      Réf : {product.code}
                    </span>

                    {isCurrentSpecial ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400">
                        <Check className="size-3.5" />
                        <span>Actif en ligne</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectSpecial(product)}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 px-3.5 py-1.5 font-display text-xs font-black uppercase tracking-wider text-black shadow-md shadow-bmc-gold/20 hover:brightness-110 active:scale-97 transition-all cursor-pointer"
                      >
                        {isUpdating ? (
                          <RefreshCw className="size-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="size-3.5" />
                        )}
                        <span>Définir Plat du Jour</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
