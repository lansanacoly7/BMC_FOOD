import { Eye, Plus, SearchX, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createMenuItem, fetchDailySpecials, toggleDailySpecial } from '../../services/api'
import type { Product } from '../../types'
import { NewDishModal, type NewDishValues } from './NewDishModal'
import {
  Badge,
  Button,
  Card,
  DishCell,
  EmptyBlock,
  Notice,
  PageBody,
  SearchInput,
  Segmented,
  Stat,
  StatGrid,
  Table,
  Td,
  Th,
  Toolbar,
  Tr,
  type NoticeState,
  type SegmentOption,
} from '../ui/primitives'
import { buttonClass } from '../ui/styles'

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
    code: 'bv-2',
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

const CATEGORY_OPTIONS: SegmentOption<string>[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'tacos', label: 'Tacos panés' },
  { id: 'burgers', label: 'Burgers' },
  { id: 'boissons', label: 'Boissons' },
]

const DISH_CATEGORIES = ['Tacos panés', 'Burgers', 'Tacos simples', 'Boissons', 'Spécialités']

const DISH_PHOTOS = [
  { url: '/images/products/tacos-viande-pane.webp', label: 'Tacos viande pané' },
  { url: '/images/products/tacos-poulet-pane.webp', label: 'Tacos poulet pané' },
  { url: '/images/products/tacos-mixte-pane.webp', label: 'Tacos mixte pané' },
  { url: '/images/products/burger-bmc-complet.webp', label: 'Burger BMC complet' },
  { url: '/images/products/burger-poulet-crispy.webp', label: 'Burger poulet crispy' },
  { url: '/images/products/canette-bissap-bmc.webp', label: 'Canette bissap BMC' },
  { url: '/images/products/canette-mangue-bmc.webp', label: 'Canette BMC mangue' },
]

export function DailySpecialManager() {
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS)
  const [activeCodes, setActiveCodes] = useState<string[]>(['tp-1'])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isUpdating, setIsUpdating] = useState<number | null>(null)
  const [notification, setNotification] = useState<NoticeState | null>(null)

  // Fenêtre « Ajouter un plat »
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newIsDailySpecial, setNewIsDailySpecial] = useState(false)
  const [isSubmittingNew, setIsSubmittingNew] = useState(false)

  const showNotification = (message: string, type: NoticeState['type'] = 'success') => {
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
        is_daily_special: newIsDailySpecial,
      })

      const createdItem: Product = {
        id: res.item?.id || Date.now(),
        code: res.item?.code || `plat-${Date.now()}`,
        name: res.item?.name || values.name,
        category: res.item?.category || 1,
        category_name: res.item?.category_name || values.category,
        description: res.item?.description || values.description,
        price: res.item?.price || parseInt(values.price, 10),
        image_url: res.item?.image_url || values.imageUrl,
        is_available: true,
        is_daily_special: newIsDailySpecial,
        popular: false,
      }

      setProducts((prev) => [createdItem, ...prev])
      if (newIsDailySpecial) {
        setActiveCodes((prev) => [...prev, createdItem.code])
      }

      showNotification(`Plat « ${createdItem.name} » ajouté.`)
      setIsAddModalOpen(false)
    } catch (err: unknown) {
      showNotification(
        err instanceof Error ? err.message : "Le plat n'a pas pu être ajouté. Réessayez.",
        'error',
      )
    } finally {
      setIsSubmittingNew(false)
    }
  }

  const activeProducts = products.filter((p) => activeCodes.includes(p.code))

  // Plats du jour en tête de liste
  const filteredProducts = products
    .filter((p) => {
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
    .sort((a, b) => Number(activeCodes.includes(b.code)) - Number(activeCodes.includes(a.code)))

  return (
    <PageBody>
      <Notice notice={notification} />

      <StatGrid>
        <Stat
          label="Plats du jour en ligne"
          value={activeProducts.length}
          hint={activeProducts.length > 0 ? activeProducts[0].name : 'Aucun plat mis en avant'}
        />
        <Stat label="Plats au catalogue" value={products.length} hint="Tous les plats listés ci-dessous" />
        <div className="col-span-2 flex flex-col justify-center gap-2 sm:flex-row sm:items-center lg:justify-end">
          <a href="http://localhost:5173/" target="_blank" rel="noreferrer" className={buttonClass('secondary', 'md')}>
            <Eye className="size-4" />
            Voir le site client
          </a>
          <Button variant="primary" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
            Ajouter un plat
          </Button>
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
                  <Th className="text-right">Prix</Th>
                  <Th>Statut</Th>
                  <Th className="text-right">
                    <span className="sr-only">Action</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isSpecial = activeCodes.includes(product.code)
                  return (
                    <Tr key={product.code}>
                      <Td className="max-w-80">
                        <DishCell name={product.name} imageUrl={product.image_url} meta={product.description} />
                      </Td>
                      <Td className="hidden whitespace-nowrap text-ink-soft md:table-cell">
                        {product.category_name}
                      </Td>
                      <Td className="whitespace-nowrap text-right font-display font-semibold tabular-nums">
                        {product.price.toLocaleString('fr-FR')} F
                      </Td>
                      <Td>
                        {isSpecial ? (
                          <Badge tone="gold" icon={Sparkles}>
                            Plat du jour
                          </Badge>
                        ) : (
                          <Badge>Carte</Badge>
                        )}
                      </Td>
                      <Td className="text-right">
                        <Button
                          size="sm"
                          variant={isSpecial ? 'danger' : 'secondary'}
                          isLoading={isUpdating === product.id}
                          onClick={() => void handleToggleSpecial(product)}
                        >
                          {isSpecial ? 'Retirer' : 'Mettre en avant'}
                        </Button>
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

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
              id="set-daily-special"
              checked={newIsDailySpecial}
              onChange={(e) => setNewIsDailySpecial(e.target.checked)}
              className="size-4 cursor-pointer accent-bmc-orange-braise"
            />
            <label htmlFor="set-daily-special" className="cursor-pointer text-sm">
              Mettre en avant comme plat du jour
            </label>
          </div>
        </NewDishModal>
      )}
    </PageBody>
  )
}
