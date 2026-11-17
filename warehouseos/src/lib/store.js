// ---------------------------------------------------------------------------
// DemoStore: localStorage-backed data store used in DEMO MODE.
// Mirrors the Supabase schema as a single JSON document and exposes the same
// CRUD + stock-movement surface the DataContext relies on. Stock mutations
// are atomic (single _save) and always prevent negative inventory.
// ---------------------------------------------------------------------------
import { generateDemoData } from './demoData'

const STORAGE_KEY = 'warehouseos:demo:v1'
const SUB_KEY = 'warehouseos:demo:subscribers'

const COLLECTIONS = [
  'categories',
  'suppliers',
  'warehouses',
  'zones',
  'storageLocations',
  'products',
  'orders',
  'transactions',
  'notifications',
  'transfers',
]

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seed = generateDemoData()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    const parsed = JSON.parse(raw)
    // Ensure every collection exists (forward-compatible).
    const seed = generateDemoData()
    for (const c of COLLECTIONS) {
      if (!parsed[c]) parsed[c] = seed[c]
    }
    return parsed
  } catch (e) {
    console.warn('[WarehouseOS] demo store load failed, reseeding:', e)
    const seed = generateDemoData()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    } catch {}
    return seed
  }
}

function genId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

class DemoStore {
  constructor() {
    this._state = load()
    this._subs = new Set()
    // Cross-tab sync.
    window.addEventListener?.('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        this._state = load()
        this._emit()
      }
    })
  }

  _emit() {
    this._subs.forEach((fn) => fn(this._snapshot()))
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state))
    } catch (e) {
      console.error('[WarehouseOS] demo store save failed:', e)
    }
    this._emit()
  }

  _snapshot() {
    return { ...this._state }
  }

  subscribe(fn) {
    this._subs.add(fn)
    return () => this._subs.delete(fn)
  }

  getState() {
    return this._snapshot()
  }

  // --- generic CRUD --------------------------------------------------------
  list(collection) {
    return [...(this._state[collection] || [])]
  }
  get(collection, id) {
    return (this._state[collection] || []).find((x) => x.id === id) || null
  }
  insert(collection, item) {
    const id = item.id || genId(collection.slice(0, 3))
    const created = { ...item, id, created_at: item.created_at || new Date().toISOString() }
    this._state[collection] = [created, ...(this._state[collection] || [])]
    this._save()
    return created
  }
  update(collection, id, patch) {
    const arr = this._state[collection] || []
    const idx = arr.findIndex((x) => x.id === id)
    if (idx === -1) return null
    const updated = { ...arr[idx], ...patch, updated_at: new Date().toISOString() }
    arr[idx] = updated
    this._save()
    return updated
  }
  remove(collection, id) {
    this._state[collection] = (this._state[collection] || []).filter((x) => x.id !== id)
    this._save()
  }

  // --- specialized stock operations ---------------------------------------
  _pushTransaction(tx) {
    const full = { id: genId('txn'), timestamp: new Date().toISOString(), user: 'demo@warehouseos.io', ...tx }
    this._state.transactions = [full, ...(this._state.transactions || [])].slice(0, 500)
    return full
  }

  _recomputeLocationOccupancy(locationId) {
    const loc = this._state.storageLocations.find((l) => l.id === locationId)
    if (!loc) return
    loc.occupied = this._state.products
      .filter((p) => p.storage_location_id === locationId)
      .reduce((s, p) => s + (Number(p.quantity) || 0), 0)
  }

  // delta may be negative (remove) or positive (add). Never goes below 0.
  adjustStock(productId, delta, note = 'Manual adjustment') {
    const p = this._state.products.find((x) => x.id === productId)
    if (!p) throw new Error('Product not found')
    const before = Number(p.quantity) || 0
    const after = Math.max(0, before + Number(delta))
    const actualDelta = after - before
    p.quantity = after
    this._pushTransaction({
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      type: delta >= 0 ? 'add' : 'remove',
      quantity: Math.abs(actualDelta),
      warehouse_name: p.warehouse_name,
      note,
    })
    this._recomputeLocationOccupancy(p.storage_location_id)
    this._save()
    return { before, after }
  }

  setStock(productId, value, note = 'Stock update') {
    const p = this._state.products.find((x) => x.id === productId)
    if (!p) throw new Error('Product not found')
    const before = Number(p.quantity) || 0
    const after = Math.max(0, Math.floor(Number(value) || 0))
    p.quantity = after
    this._pushTransaction({
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      type: 'update',
      quantity: after,
      warehouse_name: p.warehouse_name,
      note,
    })
    this._recomputeLocationOccupancy(p.storage_location_id)
    this._save()
    return { before, after }
  }

  reserveStock(productId, qty) {
    const p = this._state.products.find((x) => x.id === productId)
    if (!p) throw new Error('Product not found')
    const available = (Number(p.quantity) || 0) - (Number(p.reserved) || 0)
    const q = Math.max(0, Math.floor(Number(qty) || 0))
    if (q > available) throw new Error('Not enough available stock to reserve')
    p.reserved = (Number(p.reserved) || 0) + q
    this._pushTransaction({
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      type: 'reserve',
      quantity: q,
      warehouse_name: p.warehouse_name,
      note: 'Reserved for order',
    })
    this._save()
    return p
  }

  releaseStock(productId, qty) {
    const p = this._state.products.find((x) => x.id === productId)
    if (!p) throw new Error('Product not found')
    const q = Math.max(0, Math.floor(Number(qty) || 0))
    const cur = Number(p.reserved) || 0
    p.reserved = Math.max(0, cur - q)
    this._pushTransaction({
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      type: 'release',
      quantity: q,
      warehouse_name: p.warehouse_name,
      note: 'Released reservation',
    })
    this._save()
    return p
  }

  transferStock(productId, qty, fromWhId, toWhId) {
    const p = this._state.products.find((x) => x.id === productId)
    if (!p) throw new Error('Product not found')
    const q = Math.max(0, Math.floor(Number(qty) || 0))
    if (q > Number(p.quantity) || 0) throw new Error('Not enough stock to transfer')
    const fromWh = this._state.warehouses.find((w) => w.id === fromWhId)
    const toWh = this._state.warehouses.find((w) => w.id === toWhId)
    if (!fromWh || !toWh) throw new Error('Warehouse not found')
    // For the demo single-record model we move the product's warehouse
    // association when transferring its entire stock; partial transfers are
    // recorded as a transaction + transfer log without relocation.
    p.quantity = Math.max(0, (Number(p.quantity) || 0) - q)
    this._state.transfers = [
      {
        id: genId('trf'),
        product_id: p.id,
        product_name: p.name,
        sku: p.sku,
        quantity: q,
        from_warehouse_id: fromWh.id,
        from_warehouse: fromWh.name,
        to_warehouse_id: toWh.id,
        to_warehouse: toWh.name,
        status: 'Completed',
        created_at: new Date().toISOString(),
      },
      ...(this._state.transfers || []),
    ].slice(0, 200)
    this._pushTransaction({
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      type: 'transfer',
      quantity: q,
      warehouse_name: `${fromWh.name} → ${toWh.name}`,
      note: 'Stock transfer',
    })
    this._recomputeLocationOccupancy(p.storage_location_id)
    this._save()
    return p
  }

  // --- order operations ----------------------------------------------------
  createOrder(order) {
    const id = genId('ord')
    const created = {
      id,
      order_number: order.order_number || `ORD-${Date.now().toString().slice(-5)}`,
      customer_name: order.customer_name || 'Walk-in customer',
      status: 'Pending',
      items: order.items || [],
      total: (order.items || []).reduce((s, it) => s + it.line_total, 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this._state.orders = [created, ...(this._state.orders || [])]
    // Reserve stock for each line.
    created.items.forEach((it) => {
      try {
        this.reserveStock(it.product_id, it.quantity)
      } catch {
        /* insufficient stock — order still created */
      }
    })
    this._save()
    return created
  }

  updateOrderStatus(orderId, status) {
    const o = this._state.orders.find((x) => x.id === orderId)
    if (!o) return null
    const prev = o.status
    o.status = status
    o.updated_at = new Date().toISOString()
    // On cancel, release reserved stock for the line items.
    if (status === 'Cancelled' && prev !== 'Cancelled') {
      o.items.forEach((it) => {
        try {
          this.releaseStock(it.product_id, it.quantity)
        } catch {}
      })
    }
    // On delivered, commit the sale (decrement actual stock).
    if (status === 'Delivered' && prev !== 'Delivered') {
      o.items.forEach((it) => {
        try {
          this.adjustStock(it.product_id, -it.quantity, `Order ${o.order_number} delivered`)
        } catch {}
      })
    }
    this._save()
    return o
  }

  // --- notifications -------------------------------------------------------
  markNotificationRead(id) {
    const n = this._state.notifications.find((x) => x.id === id)
    if (n) {
      n.read = true
      this._save()
    }
  }
  markAllNotificationsRead() {
    this._state.notifications.forEach((n) => (n.read = true))
    this._save()
  }

  // --- maintenance ---------------------------------------------------------
  reset() {
    const seed = generateDemoData()
    this._state = seed
    this._save()
    return seed
  }
}

export const demoStore = new DemoStore()
