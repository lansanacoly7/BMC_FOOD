import React, { useState, useEffect } from 'react'
import { Eye, Plus, Search, Tag, X } from 'lucide-react'
import { createMenuItem, fetchPromotions, savePromotions } from '../services/api'

interface PromoItem {
  id: number
  code: string
  name: string
  category: string
  price: number
  image_url: string
  description: string
  discountPercent?: number
  isPromo: boolean
}

const INITIAL_CATALOG: PromoItem[] = [
  {
    id: 1,
    code: 'tp-1',
    name: 'Tacos viande pané',
    category: 'Tacos panés',
    price: 3500,
    discountPercent: 20,
    isPromo: true,
    image_url: '/images/products/tacos-viande-pane.webp',
    description: 'Viande hachée assaisonnée, frites fraîches, sauce fromagère maison et panure croustillante.',
  },
  {
    id: 2,
    code: 'tp-2',
    name: 'Tacos poulet pané',
    category: 'Tacos panés',
    price: 3500,
    isPromo: false,
    image_url: '/images/products/tacos-poulet-pane.webp',
    description: 'Morceaux de filet de poulet mariné, frites fraîches, sauce blanche gourmet et gratiné doré.',
  },
  {
    id: 3,
    code: 'tp-3',
    name: 'Tacos mixte pané',
    category: 'Tacos panés',
    price: 4000,
    isPromo: false,
    image_url: '/images/products/tacos-mixte-pane.webp',
    description: 'Duo savoureux viande hachée & poulet mariné, sauce fromagère maison et panure croustillante.',
  },
  {
    id: 4,
    code: 'tp-4',
    name: 'Tacos cordon bleu pané',
    category: 'Tacos panés',
    price: 4000,
    isPromo: false,
    image_url: '/images/products/tacos-cordon-bleu-pane.webp',
    description: 'Cordon bleu croustillant émincé, jambon de dinde fumé, fromage fondant et frites.',
  },
  {
    id: 5,
    code: 'bg-1',
    name: 'Burger BMC Complet',
    category: 'Burgers',
    price: 2500,
    discountPercent: 15,
    isPromo: true,
    image_url: '/images/products/burger-bmc-complet.webp',
    description: 'Steak pur bœuf braisé minute, cheddar fondant, œuf à cheval, oignons et sauce secrète.',
  },
  {
    id: 6,
    code: 'bg-2',
    name: 'Burger Cheese Simple',
    category: 'Burgers',
    price: 2000,
    isPromo: false,
    image_url: '/images/products/burger-cheese-simple.webp',
    description: 'Steak bœuf juteux, cheddar fondant, cornichons croquants, ketchup et moutarde douce.',
  },
  {
    id: 7,
    code: 'bg-3',
    name: 'Burger Poulet Crispy',
    category: 'Burgers',
    price: 2500,
    isPromo: false,
    image_url: '/images/products/burger-poulet-crispy.webp',
    description: 'Filet de poulet pané ultra croustillant, cheddar, salade fraîche et sauce burger relevée.',
  },
  {
    id: 14,
    code: 'pl-1',
    name: 'Tenders de Poulet (x5)',
    category: 'Poulet',
    price: 3000,
    isPromo: false,
    image_url: '/images/products/tenders-poulet.webp',
    description: '5 aiguillettes de poulet panées croustillantes servies avec sauce maison au choix.',
  },
  {
    id: 16,
    code: 'bv-1',
    name: 'Canette Bissap Royal (33cl)',
    category: 'Boissons',
    price: 1000,
    isPromo: false,
    image_url: '/images/products/canette-bissap-bmc.webp',
    description: 'Infusion fraîche de fleurs d’hibiscus, menthe poivrée et vanille naturelle.',
  },
]

const formatPrice = (v: number) => `${v.toLocaleString('fr-FR')} F CFA`
const calcDiscounted = (price: number, percent: number) =>
  Math.round((price * (100 - percent)) / 100 / 50) * 50

export const PromotionsPage: React.FC = () => {
  const [products, setProducts] = useState<PromoItem[]>(INITIAL_CATALOG)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [editingProduct, setEditingProduct] = useState<PromoItem | null>(null)
  const [selectedPercent, setSelectedPercent] = useState<number>(20)
  const [notification, setNotification] = useState<string | null>(null)

  // Modal nouveau plat
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('3500')
  const [newCategory, setNewCategory] = useState('Tacos panés')
  const [newDescription, setNewDescription] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('/images/products/tacos-viande-pane.webp')
  const [newDiscountPercent, setNewDiscountPercent] = useState<number>(20)
  const [newSetPromo, setNewSetPromo] = useState<boolean>(true)
  const [isSubmittingNew, setIsSubmittingNew] = useState(false)

  // Charger depuis le backend
  useEffect(() => {
    let isMounted = true
    void fetchPromotions()
      .then((res) => {
        if (!isMounted) return
        if (res && res.success && Array.isArray(res.promotions) && res.promotions.length > 0) {
          const promoMap = new Map<string, number>()
          res.promotions.forEach((p: any) => {
            if (p.isPromo || p.active) {
              promoMap.set(p.code, p.discountPercent || 20)
            }
          })

          setProducts((prev) =>
            prev.map((item) => {
              if (promoMap.has(item.code)) {
                return { ...item, isPromo: true, discountPercent: promoMap.get(item.code) }
              }
              return item
            }),
          )
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  // Sauvegarder dans le backend
  const persistPromotions = async (updatedProducts: PromoItem[]) => {
    try {
      const promoList = updatedProducts.filter((p) => p.isPromo)
      await savePromotions(promoList)
    } catch {
      // Ignorer erreur silencieuse
    }
  }

  // Ouvrir le dialogue de configuration de promotion
  const handleOpenPromoModal = (product: PromoItem) => {
    setEditingProduct(product)
    setSelectedPercent(product.discountPercent || 20)
  }

  // Appliquer la promotion
  const handleApplyPromo = () => {
    if (!editingProduct) return
    const updated = products.map((p) =>
      p.id === editingProduct.id
        ? { ...p, isPromo: true, discountPercent: selectedPercent }
        : p,
    )
    setProducts(updated)
    void persistPromotions(updated)
    showNotification(`Promotion appliquée sur « ${editingProduct.name} » (-${selectedPercent}%)`)
    setEditingProduct(null)
  }

  // Retirer la promotion
  const handleRemovePromo = (product: PromoItem) => {
    const updated = products.map((p) => (p.id === product.id ? { ...p, isPromo: false } : p))
    setProducts(updated)
    void persistPromotions(updated)
    showNotification(`Promotion retirée pour « ${product.name} »`)
    if (editingProduct?.id === product.id) {
      setEditingProduct(null)
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
      })

      const newItem: PromoItem = {
        id: res.item?.id || Date.now(),
        code: res.item?.code || `plat-${Date.now()}`,
        name: res.item?.name || newName,
        category: res.item?.category_name || newCategory,
        price: res.item?.price || parseInt(newPrice, 10),
        image_url: res.item?.image_url || newImageUrl,
        description: res.item?.description || newDescription,
        isPromo: newSetPromo,
        discountPercent: newSetPromo ? newDiscountPercent : undefined,
      }

      const updated = [newItem, ...products]
      setProducts(updated)
      void persistPromotions(updated)
      showNotification(`Plat « ${newItem.name} » ajouté${newSetPromo ? ' avec promotion' : ''} !`)
      setIsAddModalOpen(false)
      setNewName('')
      setNewDescription('')
    } catch {
      showNotification("Erreur lors de l'ajout du plat")
    } finally {
      setIsSubmittingNew(false)
    }
  }

  // Promotions actives en ligne
  const activePromos = products.filter((p) => p.isPromo)

  // Filtrage du catalogue
  const filteredProducts = products.filter((p) => {
    const matchCat =
      selectedCategory === 'all' ||
      (selectedCategory === 'tacos' && p.category.toLowerCase().includes('tacos')) ||
      (selectedCategory === 'burgers' && p.category.toLowerCase().includes('burger')) ||
      (selectedCategory === 'poulet' && p.category.toLowerCase().includes('poulet')) ||
      (selectedCategory === 'boissons' && p.category.toLowerCase().includes('boisson'))

    const q = searchQuery.toLowerCase().trim()
    const matchSearch =
      q === '' ||
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)

    return matchCat && matchSearch
  })

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 text-left overflow-y-auto">
      {notification && (
        <div className="fixed top-5 right-5 z-50 rounded-xl px-4 py-2.5 bg-[#14171C] border border-[#F5B301]/40 text-xs text-white shadow-xl">
          {notification}
        </div>
      )}

      {/* 1. SECTION VEDETTE : Promotions Actuellement en Ligne */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Promotions Actuellement en Ligne ({activePromos.length})
            </h2>
            <p className="text-xs text-[#8A93A0]">
              Ces plats apparaissent automatiquement avec leur tarif réduit sur le site client.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1A1E24] hover:bg-[#222730] border border-[#2A313C] px-3.5 py-2 text-xs font-semibold text-white cursor-pointer transition-colors"
            >
              <Plus className="size-4 text-[#F5B301]" />
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

        {activePromos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePromos.map((item) => {
              const promoPrice = calcDiscounted(item.price, item.discountPercent || 20)
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-xl border border-[#2A313C] bg-[#12151A] p-4 text-white"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="size-16 rounded-lg object-cover shrink-0 bg-black border border-white/5"
                    onError={(e) => {
                      e.currentTarget.src = '/images/products/tacos-viande-pane.webp'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">{item.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F5B301]/20 text-[#F5B301] font-semibold">
                        -{item.discountPercent}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-[#F5B301]">{promoPrice.toLocaleString('fr-FR')} F</span>
                      <span className="text-[11px] text-[#5F6875] line-through">{item.price.toLocaleString('fr-FR')} F</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePromo(item)}
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    Retirer
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#2A313C] bg-[#12151A] p-6 text-center space-y-1">
            <Tag className="mx-auto size-6 text-[#5F6875]" />
            <p className="text-xs font-medium text-[#C4CAD3]">Aucune promotion active</p>
            <p className="text-[11px] text-[#5F6875]">Activez une promotion dans la liste ci-dessous.</p>
          </div>
        )}
      </section>

      {/* 2. CATALOGUE DES PRODUITS : Activer une promotion */}
      <section className="space-y-4 pt-4 border-t border-[#1F242B]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">Catalogue des Spécialités</h3>
            <p className="text-xs text-[#8A93A0]">
              Cliquez sur « Mettre en promotion » pour définir la remise.
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

        {/* Filtres de catégorie */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'tacos', label: 'Tacos panés' },
            { id: 'burgers', label: 'Burgers' },
            { id: 'poulet', label: 'Poulet' },
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

        {/* Grille de cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredProducts.map((product) => {
            const hasPromo = product.isPromo
            const promoPrice = hasPromo
              ? calcDiscounted(product.price, product.discountPercent || 20)
              : null

            return (
              <div
                key={product.id}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                  hasPromo
                    ? 'border-[#F5B301]/40 bg-[#15191F]'
                    : 'border-[#1F242B] bg-[#12151A] hover:border-[#2A313C]'
                }`}
              >
                <div className="space-y-3">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      onError={(e) => {
                        e.currentTarget.src = '/images/products/tacos-viande-pane.webp'
                      }}
                      className="size-full object-cover object-center"
                    />
                    {hasPromo && (
                      <div className="absolute top-2 left-2 rounded px-2 py-0.5 text-[10px] font-semibold bg-[#F5B301] text-black">
                        -{product.discountPercent}% en ligne
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-white">{product.name}</h4>
                      <div className="text-right">
                        {promoPrice !== null ? (
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-[#F5B301]">
                              {promoPrice.toLocaleString('fr-FR')} F
                            </span>
                            <span className="text-[10px] text-[#5F6875] line-through">
                              {product.price.toLocaleString('fr-FR')} F
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-[#8A93A0]">
                            {product.price.toLocaleString('fr-FR')} F
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="line-clamp-2 text-xs text-[#8A93A0]">{product.description}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1F242B] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#5F6875]">{product.code}</span>

                  {hasPromo ? (
                    <button
                      type="button"
                      onClick={() => handleRemovePromo(product)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#1A1E24] hover:bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 cursor-pointer transition-colors"
                    >
                      <span>Retirer promo</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenPromoModal(product)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1E24] hover:bg-[#252B35] border border-[#2A313C] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer transition-colors"
                    >
                      <Tag className="size-3.5 text-[#F5B301]" />
                      <span>Mettre en promo</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* MODAL : Configuration de la promotion */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-[#2A313C] bg-[#12151A] p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-[#1F242B] pb-3">
              <h3 className="text-base font-semibold text-white">Appliquer une promotion</h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-[#8A93A0] hover:text-white cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-white">{editingProduct.name}</p>
              <p className="text-xs text-[#8A93A0]">Prix initial : {formatPrice(editingProduct.price)}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#C4CAD3] mb-2">
                Pourcentage de réduction
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20, 25].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setSelectedPercent(pct)}
                    className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      selectedPercent === pct
                        ? 'bg-[#F5B301] text-black font-bold'
                        : 'bg-[#1A1E24] border border-[#2A313C] text-[#C4CAD3] hover:text-white'
                    }`}
                  >
                    -{pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-[#0F1216] border border-[#1F242B] p-3 text-xs flex justify-between items-center">
              <span className="text-[#8A93A0]">Nouveau prix affiché</span>
              <span className="font-bold text-[#F5B301] text-sm">
                {calcDiscounted(editingProduct.price, selectedPercent).toLocaleString('fr-FR')} F CFA
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="flex-1 rounded-lg bg-[#1A1E24] py-2 text-xs font-medium text-[#C4CAD3] hover:text-white cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleApplyPromo}
                className="flex-1 rounded-lg bg-[#F5B301] hover:bg-[#ffc32b] py-2 text-xs font-semibold text-black cursor-pointer transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : Ajouter un nouveau plat */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#2A313C] bg-[#12151A] p-6 shadow-2xl text-left">
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
                    <option value="Poulet">Poulet</option>
                    <option value="Boissons">Boissons</option>
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
                  Photo
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
                  <option value="/images/products/tenders-poulet.webp">Tenders Poulet</option>
                  <option value="/images/products/canette-bissap-bmc.webp">Canette Bissap</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="set_promo_check"
                  checked={newSetPromo}
                  onChange={(e) => setNewSetPromo(e.target.checked)}
                  className="rounded border-[#2A313C] bg-[#0F1216] text-[#F5B301] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="set_promo_check" className="text-xs text-[#C4CAD3] cursor-pointer">
                  Mettre en promotion
                </label>
                {newSetPromo && (
                  <select
                    value={newDiscountPercent}
                    onChange={(e) => setNewDiscountPercent(Number(e.target.value))}
                    className="ml-auto rounded border border-[#2A313C] bg-[#0F1216] px-2 py-0.5 text-xs text-[#F5B301] font-semibold"
                  >
                    <option value={10}>-10%</option>
                    <option value={15}>-15%</option>
                    <option value={20}>-20%</option>
                    <option value={25}>-25%</option>
                  </select>
                )}
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
          </div>
        </div>
      )}
    </div>
  )
}
