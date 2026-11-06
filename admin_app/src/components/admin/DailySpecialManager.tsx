import {
  AlertCircle,
  Check,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Utensils,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { createMenuItem, fetchDailySpecials, toggleDailySpecial } from '../../services/api'
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
  const [activeCodes, setActiveCodes] = useState<string[]>(['tp-1'])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isUpdating, setIsUpdating] = useState<number | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Modal nouvel article
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('3500')
  const [newCategory, setNewCategory] = useState('Tacos panés')
  const [newDescription, setNewDescription] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('/images/products/tacos-viande-pane.webp')
  const [newIsDailySpecial, setNewIsDailySpecial] = useState(false)
  const [isSubmittingNew, setIsSubmittingNew] = useState(false)

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
        if (response && response.success) {
          const codes = (response.daily_specials || []).map((s) => s.code)
          setActiveCodes(codes)
          // Mettre à jour l'état is_daily_special dans products
          setProducts((prev) =>
            prev.map((p) => ({
              ...p,
              is_daily_special: codes.includes(p.code),
            })),
          )
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  // Basculer un plat en plat du jour (peut être activé ou désactivé)
  const handleToggleSpecial = async (product: Product) => {
    setIsUpdating(product.id)
    const isCurrentlyActive = activeCodes.includes(product.code)
    try {
      await toggleDailySpecial(product.id)
      const nextCodes = isCurrentlyActive
        ? activeCodes.filter((c) => c !== product.code)
        : [...activeCodes, product.code]

      setActiveCodes(nextCodes)
      setProducts((prev) =>
        prev.map((p) =>
          p.code === product.code ? { ...p, is_daily_special: !isCurrentlyActive } : p,
        ),
      )

      showNotification(
        isCurrentlyActive
          ? `« ${product.name} » a été retiré des Plats du Jour.`
          : `« ${product.name} » est maintenant Plat du Jour !`,
      )
    } catch (err: unknown) {
      showNotification(
        err instanceof Error ? err.message : 'Erreur lors de la mise à jour',
        'error',
      )
    } finally {
      setIsUpdating(null)
    }
  }

  // Créer un nouveau plat
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    setIsSubmittingNew(true)
    try {
      const res = await createMenuItem({
        name: newName.trim(),
        price: parseInt(newPrice, 10) || 3000,
        category: newCategory,
        description: newDescription.trim(),
        image_url: newImageUrl,
        is_available: true,
        is_daily_special: newIsDailySpecial,
      })

      const createdItem: Product = {
        id: res.item?.id || Date.now(),
        code: res.item?.code || `plat-${Date.now()}`,
        name: res.item?.name || newName,
        category: res.item?.category || 1,
        category_name: res.item?.category_name || newCategory,
        description: res.item?.description || newDescription,
        price: res.item?.price || parseInt(newPrice, 10),
        image_url: res.item?.image_url || newImageUrl,
        is_available: true,
        is_daily_special: newIsDailySpecial,
        popular: false,
      }

      setProducts((prev) => [createdItem, ...prev])
      if (newIsDailySpecial) {
        setActiveCodes((prev) => [...prev, createdItem.code])
      }

      showNotification(`Nouveau plat « ${createdItem.name} » ajouté avec succès !`)
      setIsAddModalOpen(false)
      setNewName('')
      setNewDescription('')
    } catch (err: unknown) {
      showNotification(
        err instanceof Error ? err.message : "Erreur lors de l'ajout du plat",
        'error',
      )
    } finally {
      setIsSubmittingNew(false)
    }
  }

  const activeProducts = products.filter((p) => activeCodes.includes(p.code))

  const filteredProducts = products.filter((p) => {
    const matchCat =
      selectedCategory === 'all' ||
      (selectedCategory === 'tacos' && (p.category === 1 || p.category_name?.toLowerCase().includes('tacos'))) ||
      (selectedCategory === 'burgers' && (p.category === 2 || p.category_name?.toLowerCase().includes('burger'))) ||
      (selectedCategory === 'boissons' && (p.category === 5 || p.category_name?.toLowerCase().includes('boisson')))

    const q = searchQuery.toLowerCase().trim()
    const matchSearch =
      q === '' ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)

    return matchCat && matchSearch
  })

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-left p-6">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 rounded-xl px-4 py-3 shadow-2xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 backdrop-blur-md ${
              notification.type === 'success'
                ? 'bg-zinc-900/95 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/95 border-red-500/40 text-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className="size-4 text-emerald-400" />
            ) : (
              <AlertCircle className="size-4 text-red-400" />
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. SECTION VEDETTE : Plats du Jour Actuellement En Ligne */}
      <section aria-labelledby="current-special-title" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 id="current-special-title" className="text-lg font-semibold text-white">
              Plats du Jour en Ligne ({activeProducts.length})
            </h2>
            <p className="text-xs text-[#8A93A0]">
              Vous pouvez activer plusieurs plats du jour simultanément, ou n'en mettre aucun.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#F5B301] hover:bg-[#ffc32b] text-black px-3.5 py-2 text-xs font-bold cursor-pointer transition-colors shadow-sm"
            >
              <Plus className="size-4 text-black" />
              <span>Nouveau plat</span>
            </button>

            <a
              href="http://localhost:5173/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A313C] bg-[#12151A] px-3 py-2 text-xs font-semibold text-[#C4CAD3] hover:text-white transition-colors"
            >
              <Eye className="size-3.5" />
              <span>Aperçu client</span>
            </a>
          </div>
        </div>

        {activeProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProducts.map((p) => (
              <div
                key={p.code}
                className="flex items-center gap-4 rounded-xl border border-[#2A313C] bg-[#12151A] p-4 text-white"
              >
                <img
                  src={p.image_url || '/images/products/tacos-viande-pane.webp'}
                  alt={p.name}
                  className="size-16 rounded-lg object-cover shrink-0 bg-black border border-white/5"
                  onError={(e) => {
                    e.currentTarget.src = '/images/products/tacos-viande-pane.webp'
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white truncate">{p.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium">
                      Actif
                    </span>
                  </div>
                  <p className="text-xs text-[#8A93A0] truncate">{p.category_name} · {p.price.toLocaleString('fr-FR')} F</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleToggleSpecial(p)}
                  disabled={isUpdating === p.id}
                  className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#2A313C] bg-[#12151A] p-6 text-center space-y-1">
            <Utensils className="mx-auto size-6 text-[#5F6875]" />
            <p className="text-xs font-medium text-[#C4CAD3]">Aucun plat du jour activé</p>
            <p className="text-[11px] text-[#5F6875]">Activez un ou plusieurs plats dans le catalogue ci-dessous.</p>
          </div>
        )}
      </section>

      {/* 2. CATALOGUE : Choisir et changer en 1 clic */}
      <section aria-label="Catalogue des spécialités" className="space-y-4 pt-4 border-t border-[#1F242B]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">
              Catalogue des spécialités
            </h3>
            <p className="text-xs text-[#8A93A0]">
              Cliquez pour définir ou retirer un plat du jour.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#5F6875]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un plat..."
              className="w-full rounded-lg border border-[#2A313C] bg-[#12151A] pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#5F6875] focus:border-[#F5B301] focus:outline-none"
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
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#1A1E24] text-white border border-[#2A313C]'
                  : 'text-[#8A93A0] hover:text-white hover:bg-[#15191E]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grille */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredProducts.map((product) => {
            const isSpecial = activeCodes.includes(product.code)

            return (
              <div
                key={product.code}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                  isSpecial
                    ? 'border-[#F5B301]/40 bg-[#15191F]'
                    : 'border-[#1F242B] bg-[#12151A] hover:border-[#2A313C]'
                }`}
              >
                <div className="space-y-3">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                    <img
                      src={product.image_url || '/images/products/tacos-viande-pane.webp'}
                      alt={product.name}
                      onError={(e) => {
                        e.currentTarget.src = '/images/products/tacos-viande-pane.webp'
                      }}
                      className="size-full object-cover object-center"
                    />
                    {isSpecial && (
                      <div className="absolute top-2 left-2 rounded px-2 py-0.5 text-[10px] font-semibold bg-[#F5B301] text-black">
                        Plat du jour actif
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-white">
                        {product.name}
                      </h4>
                      <span className="text-xs font-semibold tabular-nums text-[#F5B301] shrink-0">
                        {product.price.toLocaleString('fr-FR')} F
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-[#8A93A0]">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1F242B] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#5F6875]">{product.code}</span>

                  <button
                    type="button"
                    onClick={() => void handleToggleSpecial(product)}
                    disabled={isUpdating === product.id}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                      isSpecial
                        ? 'bg-[#1A1E24] text-red-400 hover:bg-red-500/10 border border-red-500/30'
                        : 'bg-[#F5B301] hover:bg-[#ffc32b] text-black shadow-sm'
                    }`}
                  >
                    {isUpdating === product.id ? (
                      <RefreshCw className="size-3.5 animate-spin text-black" />
                    ) : isSpecial ? (
                      <span>Retirer du Plat du Jour</span>
                    ) : (
                      <span>Définir Plat du Jour</span>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* MODAL : Ajouter un nouveau plat */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-[#2A313C] bg-[#12151A] p-6 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between mb-4 border-b border-[#1F242B] pb-3">
                <h3 className="text-base font-semibold text-white">Ajouter un nouveau plat</h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-[#8A93A0] hover:text-white cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#C4CAD3] mb-1">
                    Nom du plat *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Tacos Suprême Fromager"
                    className="w-full rounded-lg border border-[#2A313C] bg-[#0F1216] px-3 py-2 text-xs text-white placeholder-[#5F6875] focus:border-[#F5B301] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#C4CAD3] mb-1">
                      Prix (F CFA) *
                    </label>
                    <input
                      type="number"
                      required
                      min={500}
                      step={100}
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full rounded-lg border border-[#2A313C] bg-[#0F1216] px-3 py-2 text-xs text-white focus:border-[#F5B301] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#C4CAD3] mb-1">
                      Catégorie
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full rounded-lg border border-[#2A313C] bg-[#0F1216] px-3 py-2 text-xs text-white focus:border-[#F5B301] focus:outline-none"
                    >
                      <option value="Tacos panés">Tacos panés</option>
                      <option value="Burgers">Burgers</option>
                      <option value="Tacos simples">Tacos simples</option>
                      <option value="Boissons">Boissons</option>
                      <option value="Spécialités">Spécialités</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#C4CAD3] mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Ingrédients, recette..."
                    className="w-full rounded-lg border border-[#2A313C] bg-[#0F1216] px-3 py-2 text-xs text-white placeholder-[#5F6875] focus:border-[#F5B301] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#C4CAD3] mb-1">
                    Photo du plat
                  </label>
                  <select
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full rounded-lg border border-[#2A313C] bg-[#0F1216] px-3 py-2 text-xs text-white focus:border-[#F5B301] focus:outline-none"
                  >
                    <option value="/images/products/tacos-viande-pane.webp">Tacos Viande Pané</option>
                    <option value="/images/products/tacos-poulet-pane.webp">Tacos Poulet Pané</option>
                    <option value="/images/products/tacos-mixte-pane.webp">Tacos Mixte Pané</option>
                    <option value="/images/products/burger-bmc-complet.webp">Burger BMC Complet</option>
                    <option value="/images/products/burger-poulet-crispy.webp">Burger Poulet Crispy</option>
                    <option value="/images/products/canette-bissap-bmc.webp">Canette Bissap BMC</option>
                    <option value="/images/products/canette-mangue-bmc.webp">Canette BMC Mangue</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="is_daily_special_check"
                    checked={newIsDailySpecial}
                    onChange={(e) => setNewIsDailySpecial(e.target.checked)}
                    className="rounded border-[#2A313C] bg-[#0F1216] text-[#F5B301] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="is_daily_special_check" className="text-xs text-[#C4CAD3] cursor-pointer">
                    Définir immédiatement comme Plat du Jour
                  </label>
                </div>

                <div className="flex gap-2 pt-3 border-t border-[#1F242B]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 rounded-lg bg-[#1A1E24] py-2 text-xs font-medium text-[#C4CAD3] hover:text-white cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNew}
                    className="flex-1 rounded-lg bg-[#F5B301] py-2 text-xs font-semibold text-black hover:bg-[#ffc32b] cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingNew ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
