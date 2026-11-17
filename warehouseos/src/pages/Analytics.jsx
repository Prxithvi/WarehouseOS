import { useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  BarChart3, IndianRupee, TrendingUp, AlertTriangle, Warehouse as WHIcon,
  ShoppingCart, Download,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { PageHeader, Card, CardHeader, Button, Select, Badge } from '../components/ui'
import { CHART_COLORS, colorAt, tooltipStyle } from '../lib/chartColors'
import { formatCurrency, formatNumber, stockStatus, inventoryValue, classNames } from '../lib/format'
import { downloadCSV } from '../lib/csv'

export function Analytics() {
  const { data } = useData()
  const [range, setRange] = useState(30)

  const cutoff = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - range)
    return d
  }, [range])

  const valuation = useMemo(() => {
    const byCat = new Map()
    data.products.forEach((p) => {
      const v = inventoryValue(p)
      byCat.set(p.category_name, (byCat.get(p.category_name) || 0) + v)
    })
    return [...byCat.entries()].map(([name, value], i) => ({ name, value, color: colorAt(i) })).sort((a, b) => b.value - a.value)
  }, [data.products])

  const movement = useMemo(() => {
    const days = Math.min(range, 14)
    const buckets = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      const start = new Date(d); start.setHours(0, 0, 0, 0)
      const end = new Date(d); end.setHours(23, 59, 59, 999)
      const tx = data.transactions.filter((t) => { const ts = new Date(t.timestamp || t.created_at); return ts >= start && ts <= end })
      buckets.push({
        name: ds,
        In: tx.filter((t) => t.type === 'add' || t.type === 'update').reduce((s, t) => s + Number(t.quantity || 0), 0),
        Out: tx.filter((t) => t.type === 'remove').reduce((s, t) => s + Number(t.quantity || 0), 0),
      })
    }
    return buckets
  }, [data.transactions, range])

  const stockIssues = useMemo(() => {
    let low = 0, out = 0, over = 0, healthy = 0
    data.products.forEach((p) => {
      const k = stockStatus(p).key
      if (k === 'low_stock') low++
      else if (k === 'out_of_stock') out++
      else if (k === 'overstock') over++
      else healthy++
    })
    return [
      { name: 'Healthy', value: healthy, color: CHART_COLORS[1] },
      { name: 'Low', value: low, color: CHART_COLORS[2] },
      { name: 'Overstock', value: over, color: CHART_COLORS[3] },
      { name: 'Out', value: out, color: CHART_COLORS[4] },
    ]
  }, [data.products])

  const whUtil = useMemo(() => data.warehouses.map((w) => {
    const locs = data.storageLocations.filter((l) => l.warehouse_id === w.id)
    const cap = locs.reduce((s, l) => s + Number(l.capacity || 0), 0)
    const occ = locs.reduce((s, l) => s + Number(l.occupied || 0), 0)
    return { name: w.code, Utilization: cap ? Math.round((occ / cap) * 100) : 0, cap, occ }
  }), [data.warehouses, data.storageLocations])

  const orderPerf = useMemo(() => {
    const inRange = data.orders.filter((o) => new Date(o.created_at) >= cutoff)
    const byStatus = new Map()
    inRange.forEach((o) => byStatus.set(o.status, (byStatus.get(o.status) || 0) + 1))
    return [...byStatus.entries()].map(([name, value]) => ({ name, value }))
  }, [data.orders, cutoff])

  const totalValue = valuation.reduce((s, v) => s + v.value, 0)

  const exportValuation = () => downloadCSV('inventory-valuation.csv', valuation.map((v) => ({ category: v.name, value: v.value })), [{ key: 'category', label: 'Category' }, { key: 'value', label: 'Inventory Value' }])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Six warehouse reports with charts and CSV export. Filter the movement and order windows below."
        icon={BarChart3}
        actions={
          <Select value={range} onChange={(e) => setRange(Number(e.target.value))} className="w-auto">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </Select>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Inventory valuation" subtitle={`Total: ${formatCurrency(totalValue)} by category`} icon={IndianRupee}
            action={<Button variant="ghost" size="sm" onClick={exportValuation}><Download className="w-4 h-4" /></Button>} />
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valuation} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip {...tooltipStyle} formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>{valuation.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Stock movement" subtitle={`Inbound vs outbound (last ${Math.min(range, 14)} days)`} icon={TrendingUp} />
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={movement}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="In" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Out" stroke={CHART_COLORS[4]} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Stock health distribution" subtitle="Low / out / overstock / healthy" icon={AlertTriangle} />
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stockIssues} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {stockIssues.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Warehouse utilization" subtitle="Occupied % by warehouse" icon={WHIcon} />
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={whUtil}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="Utilization" radius={[6, 6, 0, 0]}>
                  {whUtil.map((e, i) => <Cell key={i} fill={e.Utilization >= 90 ? CHART_COLORS[4] : e.Utilization >= 70 ? CHART_COLORS[2] : CHART_COLORS[1]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Order performance" subtitle={`${formatNumber(orderPerf.reduce((s, o) => s + o.value, 0))} orders in selected window`} icon={ShoppingCart} />
          <div className="p-4 h-72">
            {orderPerf.length === 0 ? (
              <p className="text-sm text-os-muted text-center pt-20">No orders in this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderPerf}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>{orderPerf.map((e, i) => <Cell key={i} fill={colorAt(i)} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Top categories by value" subtitle="Share of total inventory value" icon={IndianRupee} />
          <div className="p-4 space-y-2">
            {valuation.slice(0, 6).map((v) => (
              <div key={v.name} className="flex items-center gap-3">
                <span className="text-sm text-os-text w-32 truncate">{v.name}</span>
                <div className="flex-1 h-2 rounded-full bg-os-bg overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${totalValue ? (v.value / totalValue) * 100 : 0}%`, background: v.color }} />
                </div>
                <span className="text-xs text-os-muted tabular-nums w-24 text-right">{formatCurrency(v.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
