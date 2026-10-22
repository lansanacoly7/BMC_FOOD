import {
  AlertCircle,
  Check,
  Eye,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Utensils,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { fetchDailySpecials, toggleDailySpecial } from '../../services/api'
import type { Product } from '../../types'

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 1,
    code: 'tp-1',
    name: 'Tacos viande pané',
    category: 1,
    category_name: 'Tacos panés',
    description: 'Viande hachée assaisonnée, frites fraîches, sauce fromagère maison et panure croustillante.',
    price: 3500,
    image_url: '/images/products/tacos-viande-pane.webp',
    is_available: true,
    is_daily_special: true,
    popular: true,
  },
  {
    id: 2,
    code: 'tp-2',
    name: 'Tacos poulet pané',
    category: 1,
    category_name: 'Tacos panés',
    description: 'Morceaux de filet de poulet mariné, frites fraîches, sauce blanche gourmet et gratiné doré.',
    price: 3500,
    image_url: '/images/products/tacos-poulet-pane.webp',
    is_available: true,
    is_daily_special: false,
    popular: true,
  },
  {
    id: 3,
    code: 'tp-3',
    name: 'Tacos mixte pané',
    category: 1,
    category_name: 'Tacos panés',
    description: 'Duo savoureux viande hachée & poulet mariné, sauce fromagère maison et panure croustillante.',
    price: 4000,
    image_url: '/images/products/tacos-mixte-pane.webp',
    is_available: true,
    is_daily_special: false,
    popular: true,
  },
  {
    id: 5,
    code: 'bg-1',
    name: 'Burger BMC Complet',
    category: 2,
    category_name: 'Burgers',
    description: 'Steak pur bœuf braisé minute, cheddar fondant, œuf à cheval, bacon de bœuf et sauce secrète.',
    price: 4500,
    image_url: '/images/products/burger-bmc-complet.webp',
    is_available: true,
    is_daily_special: false,
    popular: true,
  },
  {
    id: 6,
    code: 'bg-2',
    name: 'Burger Poulet Crispy',
    category: 2,
    category_name: 'Burgers',
    description: 'Filet de poulet ultra pané croustillant, pickles croquants, cheddar et sauce mayonnaise relevée.',
    price: 4000,
    image_url: '/images/products/burger-poulet-crispy.webp',
    is_available: true,
    is_daily_special: false,
    popular: false,
  },
  {
    id: 14,
    code: 'bv-1',
    name: 'Canette Bissap BMC',
    category: 5,
    category_name: 'Boissons',
    description: 'Infusion signature d’hibiscus karkadé, menthe fraîche et sucre de canne en canette givrée.',
    price: 1000,
    image_url: '/images/products/canette-bissap-bmc.webp',
    is_available: true,
    is_daily_special: false,
    popular: true,
  },
  {
    id: 15,
    code: 'bv-2',
    name: 'Canette BMC Mangue',
    category: 5,
    category_name: 'Boissons',
    description: 'Nectar doré de mangues du Sénégal, pointe de gingembre frais tonifiant et fraîcheur intense.',
    price: 1200,
    image_url: '/images/products/canette-mangue-bmc.webp',
    is_available: true,
    is_daily_special: false,
    popular: true,
  },
]

export function DailySpecialManager() {
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS)
  const [activeCode, setActiveCode] = useState<string>('tp-1')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isUpdating, setIsUpdating] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  // Chargement depuis l'API Django
  useEffect(() => {
    let isMounted = true
    void fetchDailySpecials()
      .then((response) => {
        if (!isMounted) return
        if (response && response.success && response.daily_specials.length > 0) {
          setActiveCode(response.daily_specials[0].code)
        }
      })
      .catch(() => {
        // Conserve le plat actif local par défaut
      })
    return () => {
      isMounted = false
    }
  }, [])

  const activeProduct = products.find((p) => p.code === activeCode) ?? products[0]

  const handleSelectSpecial = async (product: Product) => {
    setIsUpdating(true)
    try {
      await toggleDailySpecial(product.id).catch(() => null)
      setActiveCode(product.code)
      setProducts((prev) =>
        prev.map((p) => ({
          ...p,
          is_daily_special: p.code === product.code,
        })),
      )
      showNotification(`« ${product.name} » est maintenant le Plat du Jour vedette !`)
    } catch (err: unknown) {
      showNotification(
        err instanceof Error ? err.message : 'Erreur lors de la mise à jour',
        'error',
      )
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchCat =
      selectedCategory === 'all' ||
      (selectedCategory === 'tacos' && p.category === 1) ||
      (selectedCategory === 'burgers' && p.category === 2) ||
      (selectedCategory === 'boissons' && p.category === 5)

    const q = searchQuery.toLowerCase().trim()
    const matchSearch =
      q === '' ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)

    return matchCat && matchSearch
  })

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-left">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 rounded-2xl px-4 py-3 shadow-2xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 backdrop-blur-md ${
              notification.type === 'success'
                ? 'bg-zinc-900/95 border-bmc-gold/40 text-bmc-gold'
                : 'bg-red-950/95 border-red-500/40 text-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className="size-4 text-bmc-gold" />
            ) : (
              <AlertCircle className="size-4 text-red-400" />
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. SECTION VEDETTE : Plat du Jour Actuellement En Ligne */}
      <section aria-labelledby="current-special-title" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="current-special-title" className="font-display text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              <Star className="size-5 text-bmc-gold fill-bmc-gold" />
              <span>Plat du Jour Actuellement en Ligne</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Ce plat est mis en avant sur le bandeau vedette du site client pour tous les visiteurs.
            </p>
          </div>
        </div>

        {activeProduct ? (
          <div className="relative overflow-hidden rounded-3xl border border-bmc-gold/40 bg-gradient-to-r from-zinc-900 via-black to-zinc-900 p-5 sm:p-6 shadow-xl shadow-bmc-gold/5">
            <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
              <div className="relative aspect-video sm:aspect-square w-full sm:w-44 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
                <img
                  src={activeProduct.image_url}
                  alt={activeProduct.name}
                  className="size-full object-cover object-center"
                />
                <span className="absolute top-2 left-2 rounded-md bg-bmc-gold px-2 py-0.5 font-display text-[9px] font-black uppercase tracking-wider text-black">
                  ★ EN LIGNE
                </span>
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                  {activeProduct.category_name} · Réf {activeProduct.code}
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-black text-white">
                  {activeProduct.name}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 max-w-xl leading-relaxed">
                  {activeProduct.description}
                </p>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0 gap-3">
                <div className="text-left sm:text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Tarif public
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
                  <span>Aperçu client</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-zinc-900/40 p-8 text-center space-y-2">
            <Utensils className="mx-auto size-8 text-zinc-500" />
            <p className="text-sm font-semibold text-zinc-300">Aucun Plat du Jour activé</p>
          </div>
        )}
      </section>

      {/* 2. CATALOGUE : Choisir et changer en 1 clic */}
      <section aria-label="Catalogue des spécialités" className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-extrabold text-white">
              Catalogue des Spécialités BMC Food
            </h3>
            <p className="text-xs text-zinc-400">
              Cliquez sur « Définir Plat du Jour » pour remplacer instantanément le plat vedette en caisse.
            </p>
          </div>

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

        {/* Filtres par catégorie */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'tacos', label: 'Tacos panés' },
            { id: 'burgers', label: 'Burgers' },
            { id: 'boissons', label: 'Boissons' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-bmc-gold text-black shadow-md shadow-bmc-gold/20'
                  : 'bg-zinc-900 border border-white/10 text-zinc-300 hover:border-white/25 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grille */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredProducts.map((product) => {
            const isCurrentSpecial = product.code === activeCode

            return (
              <div
                key={product.code}
                className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                  isCurrentSpecial
                    ? 'border-bmc-gold/60 bg-gradient-to-b from-zinc-900 to-black ring-1 ring-bmc-gold/40 shadow-lg'
                    : 'border-white/10 bg-zinc-900/70 hover:border-white/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="size-full object-cover object-center"
                    />
                    {isCurrentSpecial && (
                      <div className="absolute top-2 left-2 rounded-full bg-bmc-gold px-2.5 py-0.5 font-display text-[10px] font-black uppercase text-black">
                        ★ Actif
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display text-sm sm:text-base font-extrabold text-white leading-snug">
                        {product.name}
                      </h4>
                      <span className="font-display text-xs sm:text-sm font-black tabular-nums text-bmc-gold shrink-0">
                        {product.price.toLocaleString('fr-FR')} F
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-zinc-400 font-normal leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-zinc-400">Réf : {product.code}</span>

                  {isCurrentSpecial ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400">
                      <Check className="size-3.5" />
                      <span>Actif en ligne</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleSelectSpecial(product)}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 px-3.5 py-1.5 font-display text-xs font-black uppercase tracking-wider text-black shadow-md shadow-bmc-gold/20 hover:brightness-110 active:scale-97 transition-all cursor-pointer disabled:opacity-50"
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
    </div>
  )
}
