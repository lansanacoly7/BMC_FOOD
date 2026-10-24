import React, { useState, useEffect, useMemo } from 'react'
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Edit3,
  Sparkles,
  Flame,
  TrendingDown,
  X,
  Check,
} from 'lucide-react'
import { BMC_CATALOG } from '../data/catalog'
import type { Promotion, DiscountType } from '../types/promotions'

const STORAGE_KEY = 'bmc_admin_promotions'

const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'promo-1',
    productId: 1,
    productName: 'Tacos viande pané',
    productCode: 'tp-1',
    categoryName: 'Tacos panés',
    productImage: '/images/products/tacos-viande-pane.webp',
    originalPrice: 3500,
    discountType: 'percentage',
    discountValue: 20,
    promoPrice: 2800,
    badgeLabel: '-20% DUO',
    description: 'Offre exclusive du midi : 20% de remise immédiate.',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'promo-2',
    productId: 5,
    productName: 'Burger BMC Complet',
    productCode: 'bg-1',
    categoryName: 'Burgers',
    productImage: '/images/products/burger-bmc-complet.webp',
    originalPrice: 4500,
    discountType: 'fixed',
    discountValue: 1000,
    promoPrice: 3500,
    badgeLabel: 'OFFRE FLASH',
    description: '1 000 F CFA de réduction spéciale ce soir.',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'promo-3',
    productId: 10,
    productName: 'Box 6 Tenders Croustillants',
    productCode: 'ff-1',
    categoryName: 'Poulet & Finger Food',
    productImage: '/images/products/tenders-box.webp',
    originalPrice: 3500,
    discountType: 'custom_price',
    discountValue: 3000,
    promoPrice: 3000,
    badgeLabel: 'PRIX DÉCOUVERTE',
    description: 'Prix spécial dégustation toute la semaine.',
    isActive: false,
    createdAt: new Date().toISOString(),
  },
]

export const PromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      // Ignorer
    }
    return INITIAL_PROMOTIONS
  })

  // Synchronisation avec le stockage local
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(promotions))
    } catch {
      // Ignorer
    }
  }, [promotions])

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)

  // Champs du formulaire modal
  const [selectedProductId, setSelectedProductId] = useState<number>(BMC_CATALOG[0].id)
  const [discountType, setDiscountType] = useState<DiscountType>('percentage')
  const [discountValue, setDiscountValue] = useState<number>(15)
  const [badgeLabel, setBadgeLabel] = useState<string>('-15%')
  const [description, setDescription] = useState<string>('')
  const [isActiveForm, setIsActiveForm] = useState<boolean>(true)

  const selectedCatalogItem = useMemo(() => {
    return BMC_CATALOG.find((p) => p.id === selectedProductId) || BMC_CATALOG[0]
  }, [selectedProductId])

  // Calcul dynamique du prix remisé
  const calculatedPromoPrice = useMemo(() => {
    const orig = selectedCatalogItem.price
    if (discountType === 'percentage') {
      const discount = Math.round((orig * discountValue) / 100)
      return Math.max(0, orig - discount)
    }
    if (discountType === 'fixed') {
      return Math.max(0, orig - discountValue)
    }
    if (discountType === 'custom_price') {
      return Math.max(0, discountValue)
    }
    return orig
  }, [selectedCatalogItem, discountType, discountValue])

  const calculatedSavings = selectedCatalogItem.price - calculatedPromoPrice

  // Ouvrir modal en création
  const handleOpenCreateModal = () => {
    setEditingPromo(null)
    setSelectedProductId(BMC_CATALOG[0].id)
    setDiscountType('percentage')
    setDiscountValue(15)
    setBadgeLabel('-15%')
    setDescription('')
    setIsActiveForm(true)
    setIsModalOpen(true)
  }

  // Ouvrir modal en édition
  const handleOpenEditModal = (promo: Promotion) => {
    setEditingPromo(promo)
    setSelectedProductId(promo.productId)
    setDiscountType(promo.discountType)
    setDiscountValue(promo.discountValue)
    setBadgeLabel(promo.badgeLabel)
    setDescription(promo.description || '')
    setIsActiveForm(promo.isActive)
    setIsModalOpen(true)
  }

  // Sauvegarder la promotion
  const handleSavePromotion = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingPromo) {
      // Modification
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === editingPromo.id
            ? {
                ...p,
                productId: selectedCatalogItem.id,
                productName: selectedCatalogItem.name,
                productCode: selectedCatalogItem.code,
                categoryName: selectedCatalogItem.category,
                productImage: selectedCatalogItem.image_url,
                originalPrice: selectedCatalogItem.price,
                discountType,
                discountValue,
                promoPrice: calculatedPromoPrice,
                badgeLabel: badgeLabel.trim() || `-${discountValue}%`,
                description,
                isActive: isActiveForm,
              }
            : p
        )
      )
    } else {
      // Nouvelle promo
      const newPromo: Promotion = {
        id: `promo-${Date.now()}`,
        productId: selectedCatalogItem.id,
        productName: selectedCatalogItem.name,
        productCode: selectedCatalogItem.code,
        categoryName: selectedCatalogItem.category,
        productImage: selectedCatalogItem.image_url,
        originalPrice: selectedCatalogItem.price,
        discountType,
        discountValue,
        promoPrice: calculatedPromoPrice,
        badgeLabel: badgeLabel.trim() || `-${discountValue}%`,
        description,
        isActive: isActiveForm,
        createdAt: new Date().toISOString(),
      }
      setPromotions((prev) => [newPromo, ...prev])
    }
    setIsModalOpen(false)
  }

  // Activer/Désactiver une promotion en un clic
  const handleToggleActive = (id: string) => {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    )
  }

  // Supprimer une promotion
  const handleDelete = (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette promotion ?')) {
      setPromotions((prev) => prev.filter((p) => p.id !== id))
    }
  }

  // Filtrage des promotions
  const filteredPromotions = useMemo(() => {
    return promotions.filter((p) => {
      const matchSearch =
        p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.badgeLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(searchQuery.toLowerCase())

      if (filterStatus === 'active') return matchSearch && p.isActive
      if (filterStatus === 'inactive') return matchSearch && !p.isActive
      return matchSearch
    })
  }, [promotions, searchQuery, filterStatus])

  // KPIs
  const activeCount = promotions.filter((p) => p.isActive).length
  const totalSavingsAvg = promotions.length
    ? Math.round(
        promotions.reduce((acc, p) => acc + (p.originalPrice - p.promoPrice), 0) /
          promotions.length
      )
    : 0

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ backgroundColor: '#0B0D10' }}>
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#232830]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#F5B301]/15 text-[#F5B301]">
              <Tag size={22} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Plats en Promotion & Offres Spéciales
            </h1>
          </div>
          <p className="text-xs text-[#9AA3AF] mt-1 ml-10">
            Configurez les remises, réductions en pourcentage et offres flash visibles par les clients sur le site BMC Food.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-[#0B0D10] bg-[#F5B301] hover:bg-[#ffc633] transition-all shadow-lg shadow-[#F5B301]/20 cursor-pointer"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Nouvelle Promotion</span>
        </button>
      </div>

      {/* 2. STATS & INDICATEURS CLÉS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#232830] bg-[#14171C] p-4.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF]">
              Promotions Actives
            </p>
            <p className="text-2xl font-black text-[#F5B301] mt-1 font-mono">
              {activeCount} <span className="text-xs text-[#9AA3AF] font-normal">/ {promotions.length}</span>
            </p>
          </div>
          <div className="size-11 rounded-xl bg-[#F5B301]/10 flex items-center justify-center text-[#F5B301]">
            <Flame size={20} />
          </div>
        </div>

        <div className="rounded-2xl border border-[#232830] bg-[#14171C] p-4.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF]">
              Économie Moyenne
            </p>
            <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">
              {totalSavingsAvg.toLocaleString('fr-FR')} <span className="text-xs text-[#9AA3AF]">F CFA</span>
            </p>
          </div>
          <div className="size-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <TrendingDown size={20} />
          </div>
        </div>

        <div className="rounded-2xl border border-[#232830] bg-[#14171C] p-4.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF]">
              Plats au Catalogue
            </p>
            <p className="text-2xl font-black text-white mt-1 font-mono">
              {BMC_CATALOG.length}
            </p>
          </div>
          <div className="size-11 rounded-xl bg-white/5 flex items-center justify-center text-[#9AA3AF]">
            <Sparkles size={20} />
          </div>
        </div>

        <div className="rounded-2xl border border-[#232830] bg-[#14171C] p-4.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF]">
              Statut Affichage Client
            </p>
            <p className="text-sm font-black text-emerald-400 mt-2 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              Bandeau En Ligne
            </p>
          </div>
          <div className="size-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* 3. BARRE DE RECHERCHE ET FILTRES */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#14171C] border border-[#232830] p-3 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une promotion, un plat..."
            className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-[#0B0D10] border border-[#232830] text-sm text-white placeholder-[#687282] focus:border-[#F5B301] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto p-1 bg-[#0B0D10] rounded-xl border border-[#232830]">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-[#F5B301] text-[#0B0D10]'
                : 'text-[#9AA3AF] hover:text-white'
            }`}
          >
            Toutes ({promotions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === 'active'
                ? 'bg-emerald-500 text-[#0B0D10]'
                : 'text-[#9AA3AF] hover:text-white'
            }`}
          >
            Actives ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === 'inactive'
                ? 'bg-[#232830] text-white'
                : 'text-[#9AA3AF] hover:text-white'
            }`}
          >
            En pause ({promotions.length - activeCount})
          </button>
        </div>
      </div>

      {/* 4. GRILLE DES CARTES DE PROMOTION */}
      {filteredPromotions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#232830] bg-[#14171C]/50 p-12 text-center">
          <Tag size={40} className="mx-auto text-[#687282] mb-3" />
          <h3 className="text-base font-bold text-white">Aucune promotion trouvée</h3>
          <p className="text-xs text-[#9AA3AF] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Aucune promotion ne correspond à vos filtres de recherche.'
              : 'Cliquez sur « Nouvelle Promotion » pour mettre en avant un plat avec une remise.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPromotions.map((promo) => {
            const savings = promo.originalPrice - promo.promoPrice
            const discountPercent = Math.round((savings / promo.originalPrice) * 100)

            return (
              <div
                key={promo.id}
                className={`relative rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                  promo.isActive
                    ? 'border-[#F5B301]/40 bg-[#14171C] shadow-xl shadow-black/40'
                    : 'border-[#232830] bg-[#14171C]/60 opacity-80'
                }`}
              >
                {/* Ruban ou Badge Promotionnel */}
                <div className="p-4.5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#F5B301] text-[#0B0D10] shadow-md shadow-[#F5B301]/20">
                        <Flame size={12} />
                        {promo.badgeLabel}
                      </span>
                      <span className="text-[11px] font-semibold text-[#9AA3AF]">
                        {promo.categoryName}
                      </span>
                    </div>

                    {/* Interrupteur Actif / Inactif */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(promo.id)}
                      title={promo.isActive ? 'Mettre en pause' : 'Activer'}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        promo.isActive ? 'bg-emerald-500' : 'bg-[#232830]'
                      }`}
                      role="switch"
                      aria-checked={promo.isActive}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          promo.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Visuel et Nom */}
                  <div className="flex items-center gap-3.5 mt-4">
                    <img
                      src={promo.productImage}
                      alt={promo.productName}
                      className="size-16 rounded-xl object-cover border border-[#232830] shrink-0"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = '/images/brand/logo.png'
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-base font-black text-white truncate">
                        {promo.productName}
                      </h3>
                      {promo.description && (
                        <p className="text-xs text-[#9AA3AF] line-clamp-1 mt-0.5">
                          {promo.description}
                        </p>
                      )}
                      <p className="text-[11px] font-mono text-[#687282] mt-0.5">
                        Code: {promo.productCode}
                      </p>
                    </div>
                  </div>

                  {/* Zone de Prix & Remise */}
                  <div className="mt-4 p-3 rounded-xl bg-[#0B0D10] border border-[#232830] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA3AF]">
                        Prix de vente
                      </p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-xl font-black text-[#F5B301] font-mono">
                          {promo.promoPrice.toLocaleString('fr-FR')} F
                        </span>
                        <span className="text-xs text-[#687282] line-through font-mono">
                          {promo.originalPrice.toLocaleString('fr-FR')} F
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                        -{savings.toLocaleString('fr-FR')} F CFA (-{discountPercent}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="px-4.5 py-3 border-t border-[#232830] bg-[#0E1116] flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold flex items-center gap-1.5 ${
                      promo.isActive ? 'text-emerald-400' : 'text-[#687282]'
                    }`}
                  >
                    <span
                      className={`size-2 rounded-full ${
                        promo.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-[#687282]'
                      }`}
                    />
                    {promo.isActive ? 'Active sur le site' : 'En pause'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(promo)}
                      className="p-1.5 rounded-lg text-[#9AA3AF] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                      title="Modifier la promotion"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(promo.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 5. MODAL DE CRÉATION / MODIFICATION DE PROMOTION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[#232830] bg-[#14171C] p-6 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 size-8 flex items-center justify-center rounded-full bg-white/5 text-[#9AA3AF] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-[#F5B301]/15 text-[#F5B301]">
                <Tag size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">
                  {editingPromo ? 'Modifier la Promotion' : 'Définir une Promotion'}
                </h2>
                <p className="text-xs text-[#9AA3AF]">
                  Sélectionnez le plat et ajustez le montant ou le pourcentage de remise.
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePromotion} className="space-y-4">
              {/* Choix du Plat */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF] mb-1.5">
                  1. Choisir le plat au catalogue
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="w-full h-11 px-3 rounded-xl bg-[#0B0D10] border border-[#232830] text-sm text-white focus:border-[#F5B301] focus:outline-none transition-colors"
                >
                  {BMC_CATALOG.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — {item.category} ({item.price.toLocaleString('fr-FR')} F CFA)
                    </option>
                  ))}
                </select>
              </div>

              {/* Aperçu plat sélectionné */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0B0D10] border border-[#232830]">
                <img
                  src={selectedCatalogItem.image_url}
                  alt={selectedCatalogItem.name}
                  className="size-12 rounded-lg object-cover border border-[#232830]"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = '/images/brand/logo.png'
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">
                    {selectedCatalogItem.name}
                  </p>
                  <p className="text-xs text-[#F5B301] font-mono">
                    Prix standard : {selectedCatalogItem.price.toLocaleString('fr-FR')} F CFA
                  </p>
                </div>
              </div>

              {/* Type de réduction */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF] mb-1.5">
                  2. Type de remise
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('percentage')
                      setDiscountValue(20)
                      setBadgeLabel('-20%')
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      discountType === 'percentage'
                        ? 'border-[#F5B301] bg-[#F5B301]/15 text-[#F5B301]'
                        : 'border-[#232830] bg-[#0B0D10] text-[#9AA3AF]'
                    }`}
                  >
                    Pourcentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('fixed')
                      setDiscountValue(500)
                      setBadgeLabel('-500 F')
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      discountType === 'fixed'
                        ? 'border-[#F5B301] bg-[#F5B301]/15 text-[#F5B301]'
                        : 'border-[#232830] bg-[#0B0D10] text-[#9AA3AF]'
                    }`}
                  >
                    Montant fixe (F)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('custom_price')
                      setDiscountValue(selectedCatalogItem.price - 500)
                      setBadgeLabel('PRIX CHOC')
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      discountType === 'custom_price'
                        ? 'border-[#F5B301] bg-[#F5B301]/15 text-[#F5B301]'
                        : 'border-[#232830] bg-[#0B0D10] text-[#9AA3AF]'
                    }`}
                  >
                    Prix net fixé
                  </button>
                </div>
              </div>

              {/* Valeur de la réduction */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF] mb-1">
                    {discountType === 'percentage'
                      ? 'Pourcentage (%)'
                      : discountType === 'fixed'
                      ? 'Montant de remise (F CFA)'
                      : 'Nouveau prix final (F CFA)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={discountType === 'percentage' ? 95 : selectedCatalogItem.price - 100}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    required
                    className="w-full h-11 px-3.5 rounded-xl bg-[#0B0D10] border border-[#232830] text-sm font-mono text-white focus:border-[#F5B301] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF] mb-1">
                    Badge affiché
                  </label>
                  <input
                    type="text"
                    value={badgeLabel}
                    onChange={(e) => setBadgeLabel(e.target.value)}
                    placeholder="Ex: -20%, FLASH"
                    required
                    className="w-full h-11 px-3.5 rounded-xl bg-[#0B0D10] border border-[#232830] text-sm text-white focus:border-[#F5B301] focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Raccourcis de badges */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {['-15%', '-20%', '-25%', 'OFFRE FLASH', 'MENU DUO', 'SPÉCIAL MIDI'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setBadgeLabel(chip)}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[#232830] bg-[#0B0D10] text-[#9AA3AF] hover:text-[#F5B301] hover:border-[#F5B301]/40 transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Description facultative */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF] mb-1">
                  Description / Sous-titre (facultatif)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Valable ce midi pour toute commande en ligne"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#0B0D10] border border-[#232830] text-xs text-white focus:border-[#F5B301] focus:outline-none"
                />
              </div>

              {/* Résumé du résultat en direct */}
              <div className="p-3.5 rounded-xl border border-[#F5B301]/30 bg-[#F5B301]/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#F5B301]">
                    Nouveau prix client
                  </p>
                  <p className="text-xl font-black text-white font-mono mt-0.5">
                    {calculatedPromoPrice.toLocaleString('fr-FR')} F CFA
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Économie offerte
                  </p>
                  <p className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                    -{calculatedSavings.toLocaleString('fr-FR')} F CFA
                  </p>
                </div>
              </div>

              {/* Case Activer immédiatement */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isActiveForm}
                  onChange={(e) => setIsActiveForm(e.target.checked)}
                  className="size-4 rounded accent-[#F5B301]"
                />
                <span className="text-xs font-bold text-white">
                  Activer immédiatement cette promotion sur le site
                </span>
              </label>

              {/* Boutons d'action */}
              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-[#232830] bg-[#0B0D10] text-xs font-bold text-[#9AA3AF] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-[#F5B301] hover:bg-[#ffc633] text-xs font-black uppercase tracking-wider text-[#0B0D10] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-[#F5B301]/25"
                >
                  <Check size={16} strokeWidth={3} />
                  <span>{editingPromo ? 'Enregistrer les modifications' : 'Créer la promotion'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
