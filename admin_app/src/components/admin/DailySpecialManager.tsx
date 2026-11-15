import { Eye, Plus, SearchX, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { isBackendUnreachable } from '../../api/client'
import { createMenuItem, fetchDailySpecials, fetchMenu, toggleDailySpecial } from '../../services/api'
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

const DEFAULT_DISH_CATEGORIES = [
  'Tacos panés',
  'Tacos jambon pané',
  'Tacos Royal pané',
  'Tacos Hot Dog pané',
  'Tacos XL pané',
  'Tacos simples',
  'Burgers',
  'Boissons',
  'Sauces',
]

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
  const [products, setProducts] = useState<Product[]>([])
  const [activeCodes, setActiveCodes] = useState<string[]>([])
  const [dishCategories, setDishCategories] = useState<string[]>(DEFAULT_DISH_CATEGORIES)
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

  // Chargement du catalogue complet et du Plat du Jour actif depuis Django
  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    void Promise.all([
      fetchMenu(controller.signal),
      fetchDailySpecials(controller.signal),
    ])
      .then(([menuRes, specialsRes]) => {
        if (!isMounted) return

        const codes = specialsRes?.success && !specialsRes.is_fallback
          ? (specialsRes.daily_specials || []).map((s) => s.code)
          : []

        if (menuRes?.success && Array.isArray(menuRes.items)) {
          const mapped: Product[] = menuRes.items.map((item) => ({
            id: item.id,
            code: item.code,
            name: item.name,
            category: item.category ?? 1,
            category_name: item.category_name ?? 'Carte',
            description: item.description ?? '',
            price: item.price,
            image_url: item.image_url || '/images/products/tacos-viande-pane.webp',
            is_available: item.is_available,
            is_daily_special: codes.includes(item.code) || Boolean(item.is_daily_special),
            popular: Boolean(item.popular),
          }))
          setProducts(mapped)
          setActiveCodes(
            codes.length > 0
              ? codes
              : mapped.filter((p) => p.is_daily_special).map((p) => p.code),
          )
          const categoryNames = (menuRes.categories ?? [])
            .map((c) => c.name)
            .filter(Boolean)
          if (categoryNames.length > 0) {
            setDishCategories(categoryNames)
          }
        }
      })
      .catch((err) => {
        if (!isMounted || controller.signal.aborted) return
        if (import.meta.env.DEV && isBackendUnreachable(err)) {
          setProducts(FALLBACK_PRODUCTS)
          setActiveCodes(FALLBACK_PRODUCTS.filter((p) => p.is_daily_special).map((p) => p.code))
        } else {
          showNotification(
            err instanceof Error ? err.message : 'Impossible de charger la carte depuis le serveur.',
            'error',
          )
        }
      })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  // Basculer un plat en plat du jour (Règle D5 : un seul plat du jour actif côté serveur)
  const handleToggleSpecial = async (product: Product) => {
    setIsUpdating(product.id)
    const isCurrentlyActive = activeCodes.includes(product.code)
    const desiredState = !isCurrentlyActive
    try {
      const res = await toggleDailySpecial(product.id, desiredState)
      const isNowActive = Boolean(res?.item?.is_daily_special ?? desiredState)
      const nextCodes = isNowActive ? [product.code] : []

      setActiveCodes(nextCodes)
      setProducts((prev) =>
        prev.map((p) => ({
          ...p,
          is_daily_special: isNowActive ? p.code === product.code : false,
        })),
      )

      showNotification(
        isNowActive
          ? `« ${product.name} » est maintenant le Plat du Jour sur le site client !`
          : `« ${product.name} » a été retiré des Plats du Jour.`,
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
        is_daily_special: Boolean(res.item?.is_daily_special ?? newIsDailySpecial),
        popular: false,
      }

      if (createdItem.is_daily_special) {
        // Garantit la règle D5 côté UI si le backend active ce nouveau plat
        setActiveCodes([createdItem.code])
        setProducts((prev) => [
          createdItem,
          ...prev.map((p) => ({ ...p, is_daily_special: false })),
        ])
      } else {
        setProducts((prev) => [createdItem, ...prev])
      }

      showNotification(`Plat « ${createdItem.name} » ajouté au catalogue client.`)
      setIsAddModalOpen(false)
      setNewIsDailySpecial(false)
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

  const categoryOptions = useMemo<SegmentOption<string>[]>(
    () => [
      { id: 'all', label: 'Toutes' },
      { id: 'tacos', label: 'Tacos' },
      { id: 'burgers', label: 'Burgers' },
      { id: 'boissons', label: 'Boissons' },
    ],
    [],
  )

  // Plats du jour en tête de liste
  const filteredProducts = products
    .filter((p) => {
      const catName = (p.category_name || '').toLowerCase()
      const matchCat =
        selectedCategory === 'all' ||
        (selectedCategory === 'tacos' && catName.includes('tacos')) ||
        (selectedCategory === 'burgers' && catName.includes('burger')) ||
        (selectedCategory === 'boissons' && catName.includes('boisson'))

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
            options={categoryOptions}
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
          categories={dishCategories}
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
