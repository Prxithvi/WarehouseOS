// ---------------------------------------------------------------------------
// Demo data generator.
// When Supabase is NOT configured, WarehouseOS boots into DEMO MODE and seeds
// localStorage with the records below. Everything (CRUD, stock moves, charts,
// algorithms) runs against this data. The seed is deterministic so the dataset
// is stable across reloads before the user edits anything.
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20241117)
const randint = (a, b) => a + Math.floor(rand() * (b - a + 1))
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const uid = (p, i) => `${p}_${String(i).padStart(4, '0')}`

const now = Date.now()
const iso = (offsetDays) => new Date(now + offsetDays * 86400000).toISOString()
const isoDaysFrom = (days) => iso(days)

// --- Categories (8) --------------------------------------------------------
const categories = [
  { id: 'cat_electronics', name: 'Electronics', description: 'Gadgets, accessories and consumer electronics.' },
  { id: 'cat_apparel', name: 'Apparel', description: 'Clothing and fashion items.' },
  { id: 'cat_groceries', name: 'Groceries', description: 'Packaged food and beverages.' },
  { id: 'cat_home', name: 'Home & Kitchen', description: 'Household and kitchen utilities.' },
  { id: 'cat_office', name: 'Office Supplies', description: 'Stationery and office consumables.' },
  { id: 'cat_health', name: 'Health & Beauty', description: 'Personal care products.' },
  { id: 'cat_tools', name: 'Industrial Tools', description: 'Hardware and industrial equipment.' },
  { id: 'cat_sports', name: 'Sports & Outdoors', description: 'Fitness and outdoor gear.' },
]

// --- Suppliers (5) ---------------------------------------------------------
const suppliers = [
  { id: 'sup_globaltech', name: 'GlobalTech Distributors', email: 'sales@globaltech.io', phone: '+91 98200 11223', address: 'Bengaluru, KA', contact_person: 'Ravi Menon' },
  { id: 'sup_freshsource', name: 'FreshSource Foods', email: 'orders@freshsource.in', phone: '+91 98401 44556', address: 'Chennai, TN', contact_person: 'Lakshmi Iyer' },
  { id: 'sup_apexapparel', name: 'Apex Apparel Ltd', email: 'b2b@apexapparel.com', phone: '+91 98300 77889', address: 'Kolkata, WB', contact_person: 'Sourav Das' },
  { id: 'sup_nexus', name: 'Nexus Industrial', email: 'procurement@nexusind.co', phone: '+91 98600 33221', address: 'Pune, MH', contact_person: 'Pooja Kulkarni' },
  { id: 'sup_primalogix', name: 'PrimeLogix Supply Co', email: 'hello@primalogix.io', phone: '+91 98900 66554', address: 'Hyderabad, TS', contact_person: 'Imran Shaik' },
]

// --- Warehouses (3) --------------------------------------------------------
const warehouses = [
  { id: 'wh_nh', name: 'North Hub', code: 'NH-01', address: 'Bhiwandi, Mumbai MH', capacity: 10000, created_at: iso(-120) },
  { id: 'wh_cd', name: 'Central Depot', code: 'CD-02', address: 'Chakan, Pune MH', capacity: 8000, created_at: iso(-95) },
  { id: 'wh_sl', name: 'South Logistics', code: 'SL-03', address: 'Sriperumbudur, Chennai TN', capacity: 12000, created_at: iso(-70) },
]

// --- Warehouse zones -------------------------------------------------------
const zones = [
  { id: 'zn_nh_a', warehouse_id: 'wh_nh', name: 'Zone A', code: 'NH-A' },
  { id: 'zn_nh_b', warehouse_id: 'wh_nh', name: 'Zone B', code: 'NH-B' },
  { id: 'zn_cd_a', warehouse_id: 'wh_cd', name: 'Zone A', code: 'CD-A' },
  { id: 'zn_cd_b', warehouse_id: 'wh_cd', name: 'Zone B', code: 'CD-B' },
  { id: 'zn_sl_a', warehouse_id: 'wh_sl', name: 'Zone A', code: 'SL-A' },
  { id: 'zn_sl_c', warehouse_id: 'wh_sl', name: 'Zone C', code: 'SL-C' },
]

// --- Storage locations (20) ------------------------------------------------
function buildLocations() {
  const defs = [
    ['wh_nh', 'zn_nh_a', 'NH-A', 'Aisle 1', 'R1', 'S1', 'B1', 120],
    ['wh_nh', 'zn_nh_a', 'NH-A', 'Aisle 1', 'R1', 'S2', 'B2', 120],
    ['wh_nh', 'zn_nh_a', 'NH-A', 'Aisle 2', 'R2', 'S1', 'B1', 100],
    ['wh_nh', 'zn_nh_b', 'NH-B', 'Aisle 3', 'R3', 'S1', 'B1', 150],
    ['wh_nh', 'zn_nh_b', 'NH-B', 'Aisle 3', 'R3', 'S2', 'B2', 150],
    ['wh_nh', 'zn_nh_b', 'NH-B', 'Aisle 4', 'R4', 'S1', 'B1', 80],
    ['wh_nh', 'zn_nh_b', 'NH-B', 'Aisle 4', 'R4', 'S1', 'B2', 80],
    ['wh_cd', 'zn_cd_a', 'CD-A', 'Aisle 1', 'R1', 'S1', 'B1', 100],
    ['wh_cd', 'zn_cd_a', 'CD-A', 'Aisle 1', 'R1', 'S2', 'B2', 100],
    ['wh_cd', 'zn_cd_a', 'CD-A', 'Aisle 2', 'R2', 'S1', 'B1', 120],
    ['wh_cd', 'zn_cd_b', 'CD-B', 'Aisle 3', 'R3', 'S1', 'B1', 90],
    ['wh_cd', 'zn_cd_b', 'CD-B', 'Aisle 3', 'R3', 'S2', 'B2', 90],
    ['wh_cd', 'zn_cd_b', 'CD-B', 'Aisle 4', 'R4', 'S1', 'B1', 110],
    ['wh_sl', 'zn_sl_a', 'SL-A', 'Aisle 1', 'R1', 'S1', 'B1', 140],
    ['wh_sl', 'zn_sl_a', 'SL-A', 'Aisle 1', 'R1', 'S2', 'B2', 140],
    ['wh_sl', 'zn_sl_a', 'SL-A', 'Aisle 2', 'R2', 'S1', 'B1', 130],
    ['wh_sl', 'zn_sl_a', 'SL-A', 'Aisle 2', 'R2', 'S2', 'B2', 130],
    ['wh_sl', 'zn_sl_c', 'SL-C', 'Aisle 3', 'R3', 'S1', 'B1', 160],
    ['wh_sl', 'zn_sl_c', 'SL-C', 'Aisle 3', 'R3', 'S2', 'B2', 160],
    ['wh_sl', 'zn_sl_c', 'SL-C', 'Aisle 4', 'R4', 'S1', 'B1', 100],
  ]
  return defs.map((d, i) => {
    const [wh, zn, zc, aisle, rack, shelf, bin, cap] = d
    const code = `${zc}-${aisle.split(' ')[1]}-${rack}-${shelf}-${bin}`.replace(/\s+/g, '')
    return {
      id: uid('loc', i + 1),
      warehouse_id: wh,
      zone_id: zn,
      code,
      path: `${zc} > ${aisle} > ${rack} > ${shelf} > ${bin}`,
      aisle, rack, shelf, bin,
      capacity: cap,
      occupied: 0, // computed later from products
      status: 'active',
      created_at: iso(-60),
    }
  })
}
const storageLocations = buildLocations()

// --- Product catalog (30) --------------------------------------------------
const catalog = [
  ['Wireless Mouse', 'cat_electronics', 'Logix', 320, 599, 'sup_globaltech'],
  ['USB-C Cable 1m', 'cat_electronics', 'Voltz', 90, 199, 'sup_globaltech'],
  ['Bluetooth Headphones', 'cat_electronics', 'Sonic', 1450, 2499, 'sup_globaltech'],
  ['4K Monitor 27"', 'cat_electronics', 'ViewMax', 18500, 26999, 'sup_globaltech'],
  ['Mechanical Keyboard', 'cat_electronics', 'KeyLab', 3200, 5499, 'sup_globaltech'],
  ['Power Bank 10000mAh', 'cat_electronics', 'Voltz', 650, 1299, 'sup_globaltech'],
  ['Webcam HD 1080p', 'cat_electronics', 'ViewMax', 980, 1899, 'sup_globaltech'],
  ['HDMI Cable 2m', 'cat_electronics', 'Voltz', 110, 249, 'sup_globaltech'],
  ['Cotton T-Shirt', 'cat_apparel', 'Apex', 180, 399, 'sup_apexapparel'],
  ['Denim Jeans', 'cat_apparel', 'Apex', 620, 1299, 'sup_apexapparel'],
  ['Hooded Sweatshirt', 'cat_apparel', 'Apex', 540, 1099, 'sup_apexapparel'],
  ['Polo Shirt', 'cat_apparel', 'Apex', 310, 699, 'sup_apexapparel'],
  ['Winter Jacket', 'cat_apparel', 'Apex', 1280, 2499, 'sup_apexapparel'],
  ['Basmati Rice 5kg', 'cat_groceries', 'FreshSource', 380, 549, 'sup_freshsource'],
  ['Cooking Oil 1L', 'cat_groceries', 'FreshSource', 120, 189, 'sup_freshsource'],
  ['Green Tea Pack 100s', 'cat_groceries', 'FreshSource', 240, 399, 'sup_freshsource'],
  ['Whole Wheat Flour 10kg', 'cat_groceries', 'FreshSource', 290, 449, 'sup_freshsource'],
  ['Instant Coffee 200g', 'cat_groceries', 'FreshSource', 210, 349, 'sup_freshsource'],
  ['Stainless Steel Bottle 1L', 'cat_home', 'HomePure', 140, 299, 'sup_primalogix'],
  ['Non-stick Pan 24cm', 'cat_home', 'HomePure', 420, 899, 'sup_primalogix'],
  ['Ceramic Mug Set of 4', 'cat_home', 'HomePure', 260, 549, 'sup_primalogix'],
  ['LED Bulb 9W', 'cat_home', 'BrightWatt', 45, 99, 'sup_primalogix'],
  ['A4 Paper Ream 500', 'cat_office', 'PaperPro', 180, 279, 'sup_primalogix'],
  ['Ballpoint Pen Pack 10', 'cat_office', 'PaperPro', 60, 149, 'sup_primalogix'],
  ['Sticky Notes Pack', 'cat_office', 'PaperPro', 70, 159, 'sup_primalogix'],
  ['Stapler Heavy Duty', 'cat_office', 'PaperPro', 220, 449, 'sup_primalogix'],
  ['Hand Sanitizer 500ml', 'cat_health', 'PureCare', 95, 199, 'sup_primalogix'],
  ['Cordless Drill 18V', 'cat_tools', 'Nexus', 2100, 3699, 'sup_nexus'],
  ['Safety Helmet', 'cat_tools', 'Nexus', 280, 549, 'sup_nexus'],
  ['Yoga Mat 6mm', 'cat_sports', 'FitGear', 360, 799, 'sup_primalogix'],
]

function buildProducts() {
  const whIds = warehouses.map((w) => w.id)
  const locByWh = {}
  storageLocations.forEach((l) => {
    ;(locByWh[l.warehouse_id] ||= []).push(l)
  })
  const catName = (id) => categories.find((c) => c.id === id).name
  const supName = (id) => suppliers.find((s) => s.id === id).name
  const whName = (id) => warehouses.find((w) => w.id === id).name
  return catalog.map((c, i) => {
    const [name, catId, brand, purchase, selling, supId] = c
    const whId = whIds[i % 3]
    const locs = locByWh[whId]
    const loc = locs[i % locs.length]
    // Curated stock profile to guarantee low / out / overstock cases.
    const profile = i % 7
    let quantity, minStock, maxStock
    if (profile === 0) {
      quantity = 0; minStock = 20; maxStock = 200
    } else if (profile === 1) {
      quantity = randint(1, 18); minStock = 20; maxStock = 200
    } else if (profile === 2) {
      quantity = randint(220, 320); minStock = 30; maxStock = 200
    } else {
      quantity = randint(40, 180); minStock = 25; maxStock = 200
    }
    const reserved = profile === 3 ? randint(5, Math.min(20, quantity)) : randint(0, Math.min(8, quantity))
    const expiry = (catId === 'cat_groceries' || catId === 'cat_health')
      ? isoDaysFrom(randint(-5, 120))
      : null
    return {
      id: uid('prd', i + 1),
      name,
      sku: `SKU-${String(i + 1).padStart(4, '0')}`,
      barcode: `890${String(100000 + i * 137).slice(0, 9)}`,
      description: `${brand} ${name}. Reliable quality, ideal for retail and B2B distribution.`,
      category_id: catId,
      category_name: catName(catId),
      brand,
      supplier_id: supId,
      supplier_name: supName(supId),
      purchase_price: purchase,
      selling_price: selling,
      quantity,
      reserved,
      min_stock: minStock,
      max_stock: maxStock,
      warehouse_id: whId,
      warehouse_name: whName(whId),
      storage_location_id: loc.id,
      storage_location_code: loc.code,
      expiry_date: expiry,
      image_url: '',
      created_at: iso(-randint(10, 110)),
    }
  })
}
const products = buildProducts()

// Reconcile storage location occupancy from product quantities.
storageLocations.forEach((l) => {
  l.occupied = products
    .filter((p) => p.storage_location_id === l.id)
    .reduce((s, p) => s + (Number(p.quantity) || 0), 0)
})

// --- Orders (15) -----------------------------------------------------------
const orderStatuses = ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled']
const customers = ['Retailo Mart', 'QuickStore India', 'Metro Goods', 'ValueBazaar', 'ShopWell', 'DailyNeeds', 'UrbanKart', 'PrimeRetail']
function buildOrders() {
  const list = []
  for (let i = 0; i < 15; i++) {
    const itemCount = randint(1, 4)
    const items = []
    let total = 0
    for (let k = 0; k < itemCount; k++) {
      const p = pick(products)
      const qty = randint(1, 8)
      items.push({
        product_id: p.id,
        name: p.name,
        sku: p.sku,
        quantity: qty,
        price: p.selling_price,
        line_total: qty * p.selling_price,
      })
      total += qty * p.selling_price
    }
    const status = i < 6 ? orderStatuses[randint(0, 4)] : pick(orderStatuses)
    list.push({
      id: uid('ord', i + 1),
      order_number: `ORD-${String(2400 + i).padStart(5, '0')}`,
      customer_name: pick(customers),
      status,
      items,
      total,
      created_at: iso(-randint(1, 40)),
      updated_at: iso(-randint(0, 5)),
    })
  }
  return list
}
const orders = buildOrders()

// --- Inventory transactions (recent activity) ------------------------------
const txTypes = ['add', 'remove', 'update', 'reserve', 'release', 'transfer']
function buildTransactions() {
  const list = []
  for (let i = 0; i < 24; i++) {
    const p = pick(products)
    list.push({
      id: uid('txn', i + 1),
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      type: pick(txTypes),
      quantity: randint(1, 60),
      warehouse_name: p.warehouse_name,
      user: pick(['admin@warehouseos.io', 'store.keeper@warehouseos.io', 'demo@warehouseos.io']),
      note: pick(['Routine restock', 'Order fulfilment', 'Stock adjustment', 'Transfer between zones', 'Reservation for order']),
      timestamp: iso(-randint(0, 30)),
    })
  }
  return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}
const transactions = buildTransactions()

// --- Notifications ---------------------------------------------------------
function buildNotifications() {
  const low = products.filter((p) => p.quantity > 0 && p.quantity <= p.min_stock)
  const out = products.filter((p) => p.quantity <= 0)
  const list = []
  out.slice(0, 3).forEach((p) =>
    list.push({
      id: uid('ntf', list.length + 1),
      type: 'out_of_stock',
      severity: 'danger',
      title: 'Out of stock',
      message: `${p.name} (${p.sku}) is completely out of stock.`,
      read: false,
      created_at: iso(-randint(0, 2)),
    })
  )
  low.slice(0, 4).forEach((p) =>
    list.push({
      id: uid('ntf', list.length + 1),
      type: 'low_stock',
      severity: 'warning',
      title: 'Low stock',
      message: `${p.name} (${p.sku}) has only ${p.quantity} units left.`,
      read: false,
      created_at: iso(-randint(0, 3)),
    })
  )
  orders
    .filter((o) => o.status === 'Pending')
    .slice(0, 3)
    .forEach((o) =>
      list.push({
        id: uid('ntf', list.length + 1),
        type: 'order',
        severity: 'info',
        title: 'Pending order',
        message: `Order ${o.order_number} from ${o.customer_name} is awaiting processing.`,
        read: false,
        created_at: iso(-randint(0, 2)),
      })
    )
  list.push({
    id: uid('ntf', list.length + 1),
    type: 'system',
    severity: 'info',
    title: 'Demo mode active',
    message: 'Supabase is not configured. Data is stored locally in your browser.',
    read: false,
    created_at: iso(0),
  })
  return list.sort((a, b) => b.created_at.localeCompare(a.created_at))
}
const notifications = buildNotifications()

// --- Stock transfers (history) ---------------------------------------------
function buildTransfers() {
  const list = []
  const whNames = warehouses.map((w) => ({ id: w.id, name: w.name }))
  for (let i = 0; i < 8; i++) {
    const p = pick(products)
    let from = pick(whNames)
    let to = pick(whNames)
    while (to.id === from.id) to = pick(whNames)
    const qty = randint(10, 80)
    list.push({
      id: uid('trf', i + 1),
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      quantity: qty,
      from_warehouse_id: from.id,
      from_warehouse: from.name,
      to_warehouse_id: to.id,
      to_warehouse: to.name,
      status: pick(['Completed', 'In Transit', 'Pending']),
      created_at: iso(-randint(1, 20)),
    })
  }
  return list.sort((a, b) => b.created_at.localeCompare(a.created_at))
}
const transfers = buildTransfers()

export function generateDemoData() {
  return {
    categories,
    suppliers,
    warehouses,
    zones,
    storageLocations,
    products,
    orders,
    transactions,
    notifications,
    transfers,
  }
}

// Demo user (no real auth in demo mode).
export const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@warehouseos.io',
  full_name: 'Demo Operator',
  role: 'administrator',
}
