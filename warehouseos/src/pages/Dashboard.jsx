import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Package, Boxes, AlertTriangle, XCircle, IndianRupee, ClipboardList,
  TrendingUp, AlertCircle, Clock, Warehouse as WHIcon, ChevronRight,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { StatCard } from '../components/StatCard'
import { Card, CardHeader, Badge, Button, EmptyState } from '../components/ui'
import { PageHeader } from '../components/ui'
import { CHART_COLORS, colorAt, tooltipStyle } from '../lib/chartColors'
import { formatCurrency, formatNumber, inventoryValue, stockStatus, daysUntil, classNames } from '../lib/format'

export function Dashboard() {
  const { data } = useData()
  const { products, orders, transactions, warehouses, storageLocations } = data

  const m = useMemo(() => {
    const totalUnits = products.reduce((s, p) => s + (Number(p.quantity) || 0), 0)
    const totalValue = products.reduce((s, p) => s + inventoryValue(p), 0)
    let low = 0, out = 0, over = 0
    products.forEach((p) => {
      const st = stockStatus(p)
      if (st.key === 'low_stock') low++
      else if (st.key === 'out_of_stock') out++
      else if (st.key === 'overstock') over++
    })
    const pending = orders.filter((o) => o.status === 'Pending').length
    return { totalProducts: products.length, totalUnits, totalValue, low, out, over, pending }
  }, [products, orders])

  // Inventory overview (status distribution)
  const statusData = useMemo(() => [
    { name: 'In stock', value: products.filter((p) => stockStatus(p).key === 'in_stock').length, color: CHART_COLORS[1] },
    { name: 'Low stock', value: m.low, color: CHART_COLORS[2] },
    { name: 'Overstock', value: m.over, color: CHART_COLORS[4] },
    { name: 'Out of stock', value: m.out, color: CHART_COLORS[4] },
  ], [products, m])

  // Category distribution
  const categoryData = useMemo(() => {
    const map = new Map()
    products.forEach((p) => map.set(p.category_name, (map.get(p.category_name) || 0) + 1))
    return [...map.entries()].map(([name, value], i) => ({ name, value, color: colorAt(i) }))
  }, [products])

  // Stock movement (last 7 days, by transaction type)
  const movementData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      const dayStart = new Date(d)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(d)
      dayEnd.setHours(23, 59, 59, 999)
      const dayTx = transactions.filter((t) => {
        const ts = new Date(t.timestamp || t.created_at)
        return ts >= dayStart && ts <= dayEnd
      })
      const inbound = dayTx.filter((t) => t.type === 'add' || t.type === 'update').reduce((s, t) => s + Number(t.quantity || 0), 0)
      const outbound = dayTx.filter((t) => t.type === 'remove').reduce((s, t) => s + Number(t.quantity || 0), 0)
      days.push({ name: key, Inbound: inbound, Outbound: outbound })
    }
    return days
  }, [transactions])

  // Warehouse utilization
  const whUtil = useMemo(() => {
    return warehouses.map((w) => {
      const locs = storageLocations.filter((l) => l.warehouse_id === w.id)
      const cap = locs.reduce((s, l) => s + (Number(l.capacity) || 0), 0)
      const occ = locs.reduce((s, l) => s + (Number(l.occupied) || 0), 0)
      return { name: w.code, Utilization: cap ? Math.round((occ / cap) * 100) : 0, Capacity: cap, Occupied: occ }
    })
  }, [warehouses, storageLocations])

  // Top selling products (by quantity sold in orders)
  const topProducts = useMemo(() => {
    const map = new Map()
    orders.forEach((o) => {
      o.items?.forEach((it) => {
        map.set(it.name, (map.get(it.name) || 0) + (Number(it.quantity) || 0))
      })
    })
    return [...map.entries()].map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5)
  }, [orders])

  // Alerts
  const lowStockItems = products.filter((p) => stockStatus(p).key === 'low_stock').slice(0, 5)
  const overstockItems = products.filter((p) => stockStatus(p).key === 'overstock').slice(0, 5)
  const pendingOrders = orders.filter((o) => o.status === 'Pending').slice(0, 5)
  const expiring = products
    .filter((p) => p.expiry_date && daysUntil(p.expiry_date) != null && daysUntil(p.expiry_date) >= 0 && daysUntil(p.expiry_date) <= 14)
    .slice(0, 5)
  const nearFullLocations = storageLocations
    .map((l) => ({ ...l, util: l.capacity ? Math.round((l.occupied / l.capacity) * 100) : 0 }))
    .filter((l) => l.util >= 85)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Real-time overview of inventory health, orders and warehouse capacity."
        icon={Boxes}
        actions={
          <Link to="/analytics"><Button variant="secondary" size="sm">View analytics</Button></Link>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Package} label="Products" value={m.totalProducts} tone="accent" />
        <StatCard icon={Boxes} label="Inventory units" value={m.totalUnits} tone="info" />
        <StatCard icon={AlertTriangle} label="Low stock" value={m.low} tone="warning" />
        <StatCard icon={XCircle} label="Out of stock" value={m.out} tone="danger" />
        <StatCard icon={IndianRupee} label="Inventory value" value={formatCurrency(m.totalValue)} tone="success" />
        <StatCard icon={ClipboardList} label="Pending orders" value={m.pending} tone="accent" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Stock movement" subtitle="Inbound vs outbound units (last 7 days)" icon={TrendingUp} />
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movementData}>
                <defs>
                  <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS[1]} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS[4]} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CHART_COLORS[4]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="Inbound" stroke={CHART_COLORS[1]} fill="url(#gIn)" strokeWidth={2} />
                <Area type="monotone" dataKey="Outbound" stroke={CHART_COLORS[4]} fill="url(#gOut)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Category distribution" subtitle="Products per category" icon={Package} />
          <div className="p-4 h-72">
            {categoryData.length === 0 ? (
              <EmptyState title="No products" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Warehouse utilization" subtitle="Occupied vs capacity by warehouse" icon={WHIcon} />
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={whUtil}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="Utilization" radius={[6, 6, 0, 0]}>
                  {whUtil.map((e, i) => (
                    <Cell key={i} fill={e.Utilization >= 90 ? CHART_COLORS[4] : e.Utilization >= 70 ? CHART_COLORS[2] : CHART_COLORS[1]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Top selling products" subtitle="By units ordered" icon={TrendingUp} />
          <div className="p-4 h-72">
            {topProducts.length === 0 ? (
              <EmptyState title="No sales yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="qty" fill={CHART_COLORS[0]} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AlertCard title="Low stock" icon={AlertTriangle} tone="warning" items={lowStockItems} empty="No low-stock items 🎉">
          {(p) => (
            <AlertRow key={p.id} title={p.name} subtitle={`${p.sku} · ${p.quantity}/${p.min_stock} units`} to="/inventory" />
          )}
        </AlertCard>

        <AlertCard title="Overstock" icon={TrendingUp} tone="info" items={overstockItems} empty="No overstock items">
          {(p) => (
            <AlertRow key={p.id} title={p.name} subtitle={`${p.sku} · ${p.quantity}/${p.max_stock} units`} to="/optimizer" />
          )}
        </AlertCard>

        <AlertCard title="Pending orders" icon={Clock} tone="accent" items={pendingOrders} empty="No pending orders">
          {(o) => (
            <AlertRow key={o.id} title={o.order_number} subtitle={`${o.customer_name} · ${formatCurrency(o.total)}`} to="/orders" />
          )}
        </AlertCard>

        <AlertCard title="Expiring soon" icon={Clock} tone="danger" items={expiring} empty="No items expiring soon">
          {(p) => (
            <AlertRow key={p.id} title={p.name} subtitle={`${p.sku} · ${daysUntil(p.expiry_date)} days left`} to="/inventory" />
          )}
        </AlertCard>

        <AlertCard title="Near-full locations" icon={WHIcon} tone="warning" items={nearFullLocations} empty="All locations healthy">
          {(l) => (
            <AlertRow key={l.id} title={l.code} subtitle={`${l.path} · ${l.util}% full`} to="/storage-locations" />
          )}
        </AlertCard>

        <Card>
          <CardHeader title="Inventory status" subtitle="Distribution overview" icon={AlertCircle} />
          <div className="p-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}

function AlertCard({ title, icon: Icon, tone, items, empty, children }) {
  return (
    <Card>
      <CardHeader
        title={title}
        icon={Icon}
        action={items.length > 0 ? <Badge tone={tone}>{items.length}</Badge> : null}
      />
      <div className="p-2">
        {items.length === 0 ? (
          <p className="text-sm text-os-muted text-center py-6">{empty}</p>
        ) : (
          <ul className="divide-y divide-os-border/60">{items.map(children)}</ul>
        )}
      </div>
    </Card>
  )
}

function AlertRow({ title, subtitle, to }) {
  return (
    <li>
      <Link to={to} className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-os-bg rounded-lg transition-colors">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-os-text truncate">{title}</span>
          <span className="block text-xs text-os-muted truncate">{subtitle}</span>
        </span>
        <ChevronRight className="w-4 h-4 text-os-muted shrink-0" />
      </Link>
    </li>
  )
}

