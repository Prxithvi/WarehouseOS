import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase, BACKEND_MODE } from '../lib/supabase'
import { demoStore } from '../lib/store'

const DataContext = createContext(null)

const EMPTY = {
  warehouses: [],
  zones: [],
  storageLocations: [],
  categories: [],
  suppliers: [],
  products: [],
  orders: [],
  transactions: [],
  notifications: [],
  transfers: [],
}

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------
const TABLE = {
  categories: 'categories',
  suppliers: 'suppliers',
  warehouses: 'warehouses',
  zones: 'warehouse_zones',
  storageLocations: 'storage_locations',
  products: 'products',
  orders: 'orders',
  transactions: 'inventory_transactions',
  transfers: 'stock_transfers',
  notifications: 'notifications',
}

async function fetchAllSupabase() {
  const [
    categories, suppliers, warehouses, zones, storageLocations,
    products, orders, transactions, transfers, notifications,
  ] = await Promise.all([
    supabase.from(TABLE.categories).select('*').order('created_at', { ascending: false }),
    supabase.from(TABLE.suppliers).select('*').order('created_at', { ascending: false }),
    supabase.from(TABLE.warehouses).select('*').order('created_at', { ascending: false }),
    supabase.from(TABLE.zones).select('*'),
    supabase.from(TABLE.storageLocations).select('*').order('code', { ascending: true }),
    supabase.from(TABLE.products).select('*').order('created_at', { ascending: false }),
    supabase.from(TABLE.orders).select('*, items:order_items(*)').order('created_at', { ascending: false }),
    supabase.from(TABLE.transactions).select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from(TABLE.transfers).select('*').order('created_at', { ascending: false }),
    supabase.from(TABLE.notifications).select('*').order('created_at', { ascending: false }),
  ])
  const anyError = [categories, suppliers, warehouses, zones, storageLocations, products, orders, transactions, transfers, notifications].find((r) => r.error)
  if (anyError) throw anyError.error

  // Enrich products with human-readable names from related tables.
  const catMap = new Map((categories.data || []).map((c) => [c.id, c.name]))
  const supMap = new Map((suppliers.data || []).map((s) => [s.id, s.name]))
  const whMap = new Map((warehouses.data || []).map((w) => [w.id, w.name]))
  const locMap = new Map((storageLocations.data || []).map((l) => [l.id, l.code]))
  const enrichedProducts = (products.data || []).map((p) => ({
    ...p,
    category_name: p.category_name || catMap.get(p.category_id) || '—',
    supplier_name: p.supplier_name || supMap.get(p.supplier_id) || '—',
    warehouse_name: p.warehouse_name || whMap.get(p.warehouse_id) || '—',
    storage_location_code: p.storage_location_code || locMap.get(p.storage_location_id) || '—',
    quantity: p.quantity ?? p.on_hand ?? 0,
  }))

  return {
    categories: categories.data || [],
    suppliers: suppliers.data || [],
    warehouses: warehouses.data || [],
    zones: zones.data || [],
    storageLocations: storageLocations.data || [],
    products: enrichedProducts,
    orders: (orders.data || []).map((o) => ({
      ...o,
      items: o.items || [],
      total: o.total || (o.items || []).reduce((s, it) => s + (it.line_total || it.quantity * it.price), 0),
    })),
    transactions: transactions.data || [],
    transfers: transfers.data || [],
    notifications: notifications.data || [],
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function DataProvider({ children }) {
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const unsubRef = useRef(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      if (BACKEND_MODE === 'supabase') {
        const snapshot = await fetchAllSupabase()
        setData(snapshot)
      } else {
        setData(demoStore.getState())
      }
    } catch (e) {
      console.error('[WarehouseOS] data load failed:', e)
      setError(e.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (BACKEND_MODE === 'demo') {
      // Live updates whenever the demo store changes.
      unsubRef.current = demoStore.subscribe((s) => setData(s))
      setData(demoStore.getState())
      setLoading(false)
      return () => unsubRef.current && unsubRef.current()
    }
    refresh()
  }, [refresh])

  // --- generic CRUD (demo delegates to store; supabase hits the table) ----
  const create = useCallback(async (collection, item) => {
    if (BACKEND_MODE === 'demo') return demoStore.insert(collection, item)
    const table = TABLE[collection]
    const { data: row, error } = await supabase.from(table).insert(item).select().single()
    if (error) throw error
    await refresh()
    return row
  }, [refresh])

  const update = useCallback(async (collection, id, patch) => {
    if (BACKEND_MODE === 'demo') return demoStore.update(collection, id, patch)
    const table = TABLE[collection]
    const { data: row, error } = await supabase.from(table).update(patch).eq('id', id).select().single()
    if (error) throw error
    await refresh()
    return row
  }, [refresh])

  const remove = useCallback(async (collection, id) => {
    if (BACKEND_MODE === 'demo') return demoStore.remove(collection, id)
    const table = TABLE[collection]
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
    await refresh()
  }, [refresh])

  // --- stock operations ---------------------------------------------------
  const adjustStock = useCallback(async (productId, delta, note) => {
    if (BACKEND_MODE === 'demo') return demoStore.adjustStock(productId, delta, note)
    const p = data.products.find((x) => x.id === productId)
    if (!p) throw new Error('Product not found')
    const after = Math.max(0, (Number(p.quantity) || 0) + Number(delta))
    const { error: e1 } = await supabase.from(TABLE.products).update({ quantity: after }).eq('id', productId)
    if (e1) throw e1
    await supabase.from(TABLE.transactions).insert({
      product_id: productId, product_name: p.name, sku: p.sku,
      type: delta >= 0 ? 'add' : 'remove', quantity: Math.abs(delta),
      warehouse_name: p.warehouse_name, note: note || 'Manual adjustment',
    })
    await refresh()
    return { before: p.quantity, after }
  }, [data.products, refresh])

  const setStock = useCallback(async (productId, value, note) => {
    if (BACKEND_MODE === 'demo') return demoStore.setStock(productId, value, note)
    const p = data.products.find((x) => x.id === productId)
    if (!p) throw new Error('Product not found')
    const after = Math.max(0, Math.floor(Number(value) || 0))
    const { error: e1 } = await supabase.from(TABLE.products).update({ quantity: after }).eq('id', productId)
    if (e1) throw e1
    await supabase.from(TABLE.transactions).insert({
      product_id: productId, product_name: p.name, sku: p.sku,
      type: 'update', quantity: after, warehouse_name: p.warehouse_name, note: note || 'Stock update',
    })
    await refresh()
    return { before: p.quantity, after }
  }, [data.products, refresh])

  const reserveStock = useCallback(async (productId, qty) => {
    if (BACKEND_MODE === 'demo') return demoStore.reserveStock(productId, qty)
    const p = data.products.find((x) => x.id === productId)
    if (!p) throw new Error('Product not found')
    const available = (Number(p.quantity) || 0) - (Number(p.reserved) || 0)
    if (qty > available) throw new Error('Not enough available stock to reserve')
    const newReserved = (Number(p.reserved) || 0) + Number(qty)
    const { error } = await supabase.from(TABLE.products).update({ reserved: newReserved }).eq('id', productId)
    if (error) throw error
    await supabase.from(TABLE.transactions).insert({
      product_id: productId, product_name: p.name, sku: p.sku,
      type: 'reserve', quantity: qty, warehouse_name: p.warehouse_name, note: 'Reserved for order',
    })
    await refresh()
  }, [data.products, refresh])

  const releaseStock = useCallback(async (productId, qty) => {
    if (BACKEND_MODE === 'demo') return demoStore.releaseStock(productId, qty)
    const p = data.products.find((x) => x.id === productId)
    if (!p) throw new Error('Product not found')
    const newReserved = Math.max(0, (Number(p.reserved) || 0) - Number(qty))
    const { error } = await supabase.from(TABLE.products).update({ reserved: newReserved }).eq('id', productId)
    if (error) throw error
    await supabase.from(TABLE.transactions).insert({
      product_id: productId, product_name: p.name, sku: p.sku,
      type: 'release', quantity: qty, warehouse_name: p.warehouse_name, note: 'Released reservation',
    })
    await refresh()
  }, [data.products, refresh])

  const transferStock = useCallback(async (productId, qty, fromWhId, toWhId) => {
    if (BACKEND_MODE === 'demo') return demoStore.transferStock(productId, qty, fromWhId, toWhId)
    const p = data.products.find((x) => x.id === productId)
    if (!p) throw new Error('Product not found')
    if (qty > Number(p.quantity)) throw new Error('Not enough stock to transfer')
    const after = Math.max(0, Number(p.quantity) - Number(qty))
    await supabase.from(TABLE.products).update({ quantity: after }).eq('id', productId)
    const fromWh = data.warehouses.find((w) => w.id === fromWhId)
    const toWh = data.warehouses.find((w) => w.id === toWhId)
    await supabase.from(TABLE.transfers).insert({
      product_id: productId, product_name: p.name, sku: p.sku, quantity: qty,
      from_warehouse_id: fromWhId, from_warehouse: fromWh?.name, to_warehouse_id: toWhId, to_warehouse: toWh?.name, status: 'Completed',
    })
    await refresh()
  }, [data.products, data.warehouses, refresh])

  // --- orders -------------------------------------------------------------
  const createOrder = useCallback(async (order) => {
    if (BACKEND_MODE === 'demo') return demoStore.createOrder(order)
    const total = (order.items || []).reduce((s, it) => s + (it.line_total || it.quantity * it.price), 0)
    const { data: row, error } = await supabase.from(TABLE.orders).insert({
      order_number: order.order_number || `ORD-${Date.now().toString().slice(-5)}`,
      customer_name: order.customer_name || 'Walk-in customer',
      status: 'Pending', total,
    }).select().single()
    if (error) throw error
    const items = (order.items || []).map((it) => ({
      order_id: row.id, product_id: it.product_id, name: it.name, sku: it.sku,
      quantity: it.quantity, price: it.price, line_total: it.line_total || it.quantity * it.price,
    }))
    await supabase.from('order_items').insert(items)
    // reserve stock
    for (const it of order.items || []) {
      try { await reserveStock(it.product_id, it.quantity) } catch {}
    }
    await refresh()
    return row
  }, [reserveStock, refresh])

  const updateOrderStatus = useCallback(async (orderId, status) => {
    if (BACKEND_MODE === 'demo') return demoStore.updateOrderStatus(orderId, status)
    const o = data.orders.find((x) => x.id === orderId)
    const { error } = await supabase.from(TABLE.orders).update({ status, updated_at: new Date().toISOString() }).eq('id', orderId)
    if (error) throw error
    if (status === 'Cancelled' && o && o.status !== 'Cancelled') {
      for (const it of o.items || []) { try { await releaseStock(it.product_id, it.quantity) } catch {} }
    }
    if (status === 'Delivered' && o && o.status !== 'Delivered') {
      for (const it of o.items || []) { try { await adjustStock(it.product_id, -it.quantity, `Order ${o.order_number} delivered`) } catch {} }
    }
    await refresh()
  }, [data.orders, releaseStock, adjustStock, refresh])

  // --- notifications ------------------------------------------------------
  const markNotificationRead = useCallback(async (id) => {
    if (BACKEND_MODE === 'demo') return demoStore.markNotificationRead(id)
    await supabase.from(TABLE.notifications).update({ read: true }).eq('id', id)
    await refresh()
  }, [refresh])

  const markAllNotificationsRead = useCallback(async () => {
    if (BACKEND_MODE === 'demo') return demoStore.markAllNotificationsRead()
    const ids = data.notifications.filter((n) => !n.read).map((n) => n.id)
    if (ids.length) await supabase.from(TABLE.notifications).update({ read: true }).in('id', ids)
    await refresh()
  }, [data.notifications, refresh])

  const resetDemo = useCallback(() => {
    if (BACKEND_MODE !== 'demo') return
    demoStore.reset()
    setData(demoStore.getState())
  }, [])

  const api = {
    mode: BACKEND_MODE,
    loading, error, refresh,
    create, update, remove,
    adjustStock, setStock, reserveStock, releaseStock, transferStock,
    createOrder, updateOrderStatus,
    markNotificationRead, markAllNotificationsRead,
    resetDemo,
  }

  return <DataContext.Provider value={{ data, ...api }}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
