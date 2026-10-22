/**
 * Mini-serveur local Mock API Django REST pour BMC Food
 * Conforme au contrat d'API officiel de dispatching_faction_frontend.md :
 * - Port : 8000 (http://localhost:8000/api/)
 * - Permet la synchronisation directe entre admin_app (port 5175) et client_website (port 5173)
 * - Remplaçable instantanément par le vrai backend Django dès que vos camarades le livrent.
 */

const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 8000
const CACHE_FILE = path.join(__dirname, '.active_special.json')

// Produits disponibles pour le Plat du Jour
const PRODUCTS = [
  {
    id: 1,
    code: 'tp-1',
    name: 'Tacos viande pané (Signature)',
    category: 1,
    category_name: 'Tacos panés',
    description: 'Viande hachée assaisonnée, frites croustillantes, sauce fromagère maison et panure dorée croustillante.',
    price: 3500,
    image_url: '/images/products/tacos_knife_crispy.gif',
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
    image_url: '/images/products/tacos_fried_oil.gif',
    is_available: true,
    is_daily_special: false,
    popular: true,
  },
  {
    id: 3,
    code: 'tp-3',
    name: 'Tacos mixte pané (Duo Viande & Poulet)',
    category: 1,
    category_name: 'Tacos panés',
    description: 'Duo savoureux viande hachée & poulet mariné, sauce fromagère maison et panure croustillante.',
    price: 4000,
    image_url: '/images/products/tacos_knife_slice.gif',
    is_available: true,
    is_daily_special: false,
    popular: true,
  },
  {
    id: 4,
    code: 'tp-4',
    name: 'Tacos cordon bleu pané',
    category: 1,
    category_name: 'Tacos panés',
    description: 'Cordon bleu croustillant émincé, jambon de dinde fumé, fromage fondant et frites fraîches.',
    price: 4000,
    image_url: '/images/products/tacos_cut_turkey.gif',
    is_available: true,
    is_daily_special: false,
    popular: false,
  },
  {
    id: 5,
    code: 'bg-1',
    name: 'Burger double cheese gourmet',
    category: 2,
    category_name: 'Burgers',
    description: 'Double steak pur bœuf saisi à la flamme, cheddar affiné fondu, oignons caramélisés et sauce secrète.',
    price: 3800,
    image_url: '/images/products/burger-double-cheese.webp',
    is_available: true,
    is_daily_special: false,
    popular: true,
  },
  {
    id: 6,
    code: 'bg-2',
    name: 'Burger crispy bacon',
    category: 2,
    category_name: 'Burgers',
    description: 'Steak de bœuf grillé, tranches de bacon de bœuf croustillant, cheddar et sauce fumée.',
    price: 4200,
    image_url: '/images/products/burger-crispy-bacon.webp',
    is_available: true,
    is_daily_special: false,
    popular: true,
  },
]

// Lecture de l'état persistant
let activeCode = 'tp-1'
try {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    activeCode = parsed.activeCode ?? 'tp-1'
  }
} catch {
  activeCode = 'tp-1'
}

function saveState(code) {
  activeCode = code
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ activeCode: code }, null, 2))
  } catch {}
}

const server = http.createServer((req, res) => {
  // En-têtes CORS universels pour localhost:5173 et localhost:5175
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost:8000'}`)
  const pathname = url.pathname.replace(/\/+$/, '')

  // 1. GET /api/daily-special/ (Site Client & Admin)
  if (pathname === '/api/daily-special' && req.method === 'GET') {
    const activeProduct = activeCode ? PRODUCTS.find((p) => p.code === activeCode) : null
    const specials = activeProduct ? [{ ...activeProduct, is_daily_special: true }] : []
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        success: true,
        count: specials.length,
        daily_specials: specials,
      })
    )
    return
  }

  // 2. POST /api/daily-special/ (Mise à jour depuis l'Admin)
  if (pathname === '/api/daily-special' && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}')
        const newCode = payload.code ?? payload.active_code ?? null
        saveState(newCode)
        const updated = newCode ? PRODUCTS.find((p) => p.code === newCode) || null : null
        console.log(`[Mock API 8000] Plat du Jour mis à jour : ${newCode || '(Désactivé)'}`)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            success: true,
            message: newCode
              ? `Plat du jour activé : ${newCode}`
              : 'Plat du jour désactivé (Mode Best-Sellers)',
            active_code: newCode,
            item: updated,
          })
        )
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: false, error: 'JSON invalide' }))
      }
    })
    return
  }

  // 3. PATCH /api/daily-special/:id/toggle/ (Toggle standard DRF)
  if (pathname.startsWith('/api/daily-special/') && pathname.endsWith('/toggle') && req.method === 'PATCH') {
    const parts = pathname.split('/')
    const id = parseInt(parts[parts.length - 2], 10)
    const product = PRODUCTS.find((p) => p.id === id)
    if (product) {
      if (activeCode === product.code) {
        saveState(null)
      } else {
        saveState(product.code)
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          success: true,
          message: 'Statut du Plat du Jour basculé avec succès',
          item: { ...product, is_daily_special: activeCode === product.code },
        })
      )
      return
    }
  }

  // 4. GET /api/menu/ (Catalogue général de repli)
  if (pathname === '/api/menu' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        success: true,
        total_items: PRODUCTS.length,
        categories: [
          { id: 1, name: 'Tacos panés', slug: 'tacos-panes', is_active: true, display_order: 1 },
          { id: 2, name: 'Burgers', slug: 'burgers', is_active: true, display_order: 2 },
        ],
        items: PRODUCTS,
      })
    )
    return
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ success: false, error: 'Endpoint non trouvé' }))
})

server.listen(PORT, () => {
  console.log(`\n======================================================`)
  console.log(`🚀 Mock API BMC Food active sur http://localhost:${PORT}/api/`)
  console.log(`   - GET  /api/daily-special/ (Site client :5173)`)
  console.log(`   - POST /api/daily-special/ (Admin app    :5175)`)
  console.log(`   - Plat du jour initial : ${activeCode || '(Aucun)'}`)
  console.log(`======================================================\n`)
})
