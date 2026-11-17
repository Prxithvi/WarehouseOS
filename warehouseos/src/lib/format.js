// Formatting helpers shared across the app.

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const NUM = new Intl.NumberFormat('en-IN')

export function formatCurrency(n) {
  const v = Number(n) || 0
  return INR.format(v)
}

export function formatNumber(n) {
  return NUM.format(Number(n) || 0)
}

export function formatCompact(n) {
  const v = Number(n) || 0
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(v)
}

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function daysUntil(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const ms = d.getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

// Stock status derivation shared by inventory, dashboard and analytics.
export function stockStatus(p) {
  const q = Number(p.quantity) || 0
  const min = Number(p.min_stock) || 0
  const max = Number(p.max_stock) || 0
  if (q <= 0) return { key: 'out_of_stock', label: 'Out of stock', tone: 'danger' }
  if (q <= min) return { key: 'low_stock', label: 'Low stock', tone: 'warning' }
  if (max > 0 && q >= max) return { key: 'overstock', label: 'Overstock', tone: 'warning' }
  return { key: 'in_stock', label: 'In stock', tone: 'success' }
}

export function inventoryValue(p) {
  return (Number(p.quantity) || 0) * (Number(p.purchase_price) || 0)
}

export function classNames(...xs) {
  return xs.filter(Boolean).join(' ')
}
