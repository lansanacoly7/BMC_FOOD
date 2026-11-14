import React, { useState, useEffect } from 'react'
import { Eye, Plus, SearchX, Tag } from 'lucide-react'
import { createMenuItem, fetchPromotions, savePromotions } from '../services/api'
import { NewDishModal, type NewDishValues } from '../components/admin/NewDishModal'
import {
  Badge,
  Button,
  Card,
  DishCell,
  EmptyBlock,
  Modal,
  Notice,
  PageBody,
  SearchInput,
  Segmented,
  SelectInput,
  Stat,
  StatGrid,
  Table,
  Td,
  Th,
  Toolbar,
  Tr,
  type NoticeState,
  type SegmentOption,
} from '../components/ui/primitives'
import { buttonClass } from '../components/ui/styles'

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
    code: 'bv-2',
    name: 'Canette Bissap Royal (33cl)',
    category: 'Boissons',
    price: 1000,
    isPromo: false,
    image_url: '/images/products/canette-bissap-bmc.webp',
    description: 'Infusion fraîche de fleurs d’hibiscus, menthe poivrée et vanille naturelle.',
  },
]

const formatPrice = (v: number) => `${v.toLocaleString('fr-FR')} F`
const calcDiscounted = (price: number, percent: number) =>
  Math.round((price * (100 - percent)) / 100 / 50) * 50

const DISCOUNTS = [10, 15, 20, 25]

const CATEGORY_OPTIONS: SegmentOption<string>[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'tacos', label: 'Tacos panés' },
  { id: 'burgers', label: 'Burgers' },
  { id: 'poulet', label: 'Poulet' },
  { id: 'boissons', label: 'Boissons' },
]

const DISH_CATEGORIES = ['Tacos panés', 'Burgers', 'Poulet', 'Boissons']

const DISH_PHOTOS = [
  { url: '/images/products/tacos-viande-pane.webp', label: 'Tacos viande pané' },
  { url: '/images/products/tacos-poulet-pane.webp', label: 'Tacos poulet pané' },
  { url: '/images/products/tacos-mixte-pane.webp', label: 'Tacos mixte pané' },
  { url: '/images/products/burger-bmc-complet.webp', label: 'Burger BMC complet' },
  { url: '/images/products/burger-poulet-crispy.webp', label: 'Burger poulet crispy' },
  { url: '/images/products/tenders-poulet.webp', label: 'Tenders de poulet' },
  { url: '/images/products/canette-bissap-bmc.webp', label: 'Canette bissap' },
]

export const PromotionsPage: React.FC = () => {
  const [products, setProducts] = useState<PromoItem[]>(INITIAL_CATALOG)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [editingProduct, setEditingProduct] = useState<PromoItem | null>(null)
  const [selectedPercent, setSelectedPercent] = useState<number>(20)
  const [notification, setNotification] = useState<NoticeState | null>(null)

  // Fenêtre « Ajouter un plat »
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
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

  const showNotification = (message: string, type: NoticeState['type'] = 'success') => {
    setNotification({ message, type })
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
  const handleCreateProduct = async (values: NewDishValues) => {
    if (!values.name.trim()) return

    setIsSubmittingNew(true)
    try {
      const res = await createMenuItem({
        name: values.name.trim(),
        price: parseInt(values.price, 10) || 3000,
        category: values.category,
        description: values.description.trim(),
        image_url: values.imageUrl,
        is_available: true,
      })

      const newItem: PromoItem = {
        id: res.item?.id || Date.now(),
        code: res.item?.code || `plat-${Date.now()}`,
        name: res.item?.name || values.name,
        category: res.item?.category_name || values.category,
        price: res.item?.price || parseInt(values.price, 10),
        image_url: res.item?.image_url || values.imageUrl,
        description: res.item?.description || values.description,
        isPromo: newSetPromo,
        discountPercent: newSetPromo ? newDiscountPercent : undefined,
      }

      const updated = [newItem, ...products]
      setProducts(updated)
      void persistPromotions(updated)
      showNotification(`Plat « ${newItem.name} » ajouté${newSetPromo ? ' avec promotion' : ''}.`)
      setIsAddModalOpen(false)
    } catch {
      showNotification("Le plat n'a pas pu être ajouté. Réessayez.", 'error')
    } finally {
      setIsSubmittingNew(false)
    }
  }

  // Promotions actives en ligne
  const activePromos = products.filter((p) => p.isPromo)
  const averageDiscount =
    activePromos.length > 0
      ? Math.round(activePromos.reduce((sum, p) => sum + (p.discountPercent || 20), 0) / activePromos.length)
      : 0

  // Filtrage du catalogue, plats en promotion en tête
  const filteredProducts = products
    .filter((p) => {
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
    .sort((a, b) => Number(b.isPromo) - Number(a.isPromo))

  return (
    <PageBody>
      <Notice notice={notification} />

      <StatGrid>
        <Stat label="Promotions en ligne" value={activePromos.length} hint="Visibles sur le site client" />
        <Stat
          label="Remise moyenne"
          value={activePromos.length > 0 ? `-${averageDiscount} %` : '—'}
          hint="Sur les plats en promotion"
        />
        <Stat label="Plats au catalogue" value={products.length} hint="Tous les plats listés ci-dessous" />
        <div className="flex flex-col justify-center gap-2">
          <Button variant="primary" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
            Ajouter un plat
          </Button>
          <a href="http://localhost:5173/" target="_blank" rel="noreferrer" className={buttonClass('secondary', 'md')}>
            <Eye className="size-4" />
            Voir le site client
          </a>
        </div>
      </StatGrid>

      <Card className="overflow-hidden">
        <Toolbar>
          <Segmented
            label="Filtrer par catégorie"
            options={CATEGORY_OPTIONS}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un plat…"
            aria-label="Rechercher un plat"
            wrapperClassName="ml-auto w-full sm:w-64"
          />
        </Toolbar>

        {filteredProducts.length === 0 ? (
          <EmptyBlock icon={SearchX} title="Aucun plat trouvé" description="Essayez un autre nom ou une autre catégorie." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Plat</Th>
                  <Th className="hidden md:table-cell">Catégorie</Th>
                  <Th className="text-right">Prix de carte</Th>
                  <Th className="text-right">Prix affiché</Th>
                  <Th>Statut</Th>
                  <Th className="text-right">
                    <span className="sr-only">Action</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <Tr key={product.id}>
                    <Td className="max-w-72">
                      <DishCell name={product.name} imageUrl={product.image_url} meta={product.code} />
                    </Td>
                    <Td className="hidden whitespace-nowrap text-ink-soft md:table-cell">{product.category}</Td>
                    <Td
                      className={`whitespace-nowrap text-right tabular-nums ${
                        product.isPromo ? 'text-ink-faint line-through' : ''
                      }`}
                    >
                      {formatPrice(product.price)}
                    </Td>
                    <Td className="whitespace-nowrap text-right font-display font-semibold tabular-nums">
                      {product.isPromo
                        ? formatPrice(calcDiscounted(product.price, product.discountPercent || 20))
                        : formatPrice(product.price)}
                    </Td>
                    <Td>
                      {product.isPromo ? (
                        <Badge tone="gold">-{product.discountPercent} % en ligne</Badge>
                      ) : (
                        <Badge>Prix normal</Badge>
                      )}
                    </Td>
                    <Td className="text-right">
                      {product.isPromo ? (
                        <Button size="sm" variant="danger" onClick={() => handleRemovePromo(product)}>
                          Retirer
                        </Button>
                      ) : (
                        <Button size="sm" icon={Tag} onClick={() => handleOpenPromoModal(product)}>
                          Mettre en promo
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      {editingProduct && (
        <Modal
          title="Appliquer une promotion"
          description={`${editingProduct.name} · ${formatPrice(editingProduct.price)}`}
          onClose={() => setEditingProduct(null)}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setEditingProduct(null)}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleApplyPromo}>
                Publier la promotion
              </Button>
            </>
          }
        >
          <p className="mb-2 text-[13px] font-medium">Réduction</p>
          <div className="grid grid-cols-4 gap-2">
            {DISCOUNTS.map((pct) => (
              <button
                key={pct}
                type="button"
                aria-pressed={selectedPercent === pct}
                onClick={() => setSelectedPercent(pct)}
                className={`h-10 cursor-pointer rounded-lg font-display text-sm font-semibold transition-colors ${
                  selectedPercent === pct
                    ? 'bg-bmc-gold text-bmc-charcoal'
                    : 'border border-line text-ink hover:bg-raised'
                }`}
              >
                -{pct} %
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-baseline justify-between rounded-lg bg-raised px-3 py-2.5">
            <span className="text-sm text-ink-soft">Prix affiché</span>
            <span className="font-display text-xl font-bold tabular-nums">
              {calcDiscounted(editingProduct.price, selectedPercent).toLocaleString('fr-FR')} F CFA
            </span>
          </div>
        </Modal>
      )}

      {isAddModalOpen && (
        <NewDishModal
          categories={DISH_CATEGORIES}
          photos={DISH_PHOTOS}
          isSubmitting={isSubmittingNew}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={(values) => void handleCreateProduct(values)}
        >
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="set-promo"
              checked={newSetPromo}
              onChange={(e) => setNewSetPromo(e.target.checked)}
              className="size-4 cursor-pointer accent-bmc-orange-braise"
            />
            <label htmlFor="set-promo" className="cursor-pointer text-sm">
              Mettre en promotion
            </label>
            {newSetPromo && (
              <SelectInput
                aria-label="Réduction"
                value={newDiscountPercent}
                onChange={(e) => setNewDiscountPercent(Number(e.target.value))}
                className="ml-auto !h-9 !w-24"
              >
                {DISCOUNTS.map((pct) => (
                  <option key={pct} value={pct}>
                    -{pct} %
                  </option>
                ))}
              </SelectInput>
            )}
          </div>
        </NewDishModal>
      )}
    </PageBody>
  )
}
