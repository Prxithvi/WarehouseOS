import { useState, useMemo } from 'react'
import { Sparkles, TrendingUp, AlertTriangle, XCircle, ArrowRight, HeartPulse, Boxes } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useData } from '../context/DataContext'
import { PageHeader, Card, CardHeader, Badge, Button, EmptyState } from '../components/ui'
import { DataTable } from '../components/DataTable'
import { CHART_COLORS, tooltipStyle } from '../lib/chartColors'
import { abcClassification, reorderRecommendations, inventoryHealthScore, redistributionSuggestions, productValue } from '../lib/optimizer'
import { formatCurrency, classNames } from '../lib/format'

export function SmartOptimizer() {
  const { data } = useData()
  const [tab, setTab] = useState('out')

  const abc = useMemo(() => abcClassification(data.products), [data.products])
  const rec = useMemo(() => reorderRecommendations(data.products), [data.products])
  const health = useMemo(() => inventoryHealthScore(data.products), [data.products])
  const redist = useMemo(() => redistributionSuggestions(data.products), [data.products])

  const abcSummary = useMemo(() => {
    const g = { A: { count: 0, value: 0 }, B: { count: 0, value: 0 }, C: { count: 0, value: 0 } }
    abc.forEach((p) => { g[p.class].count++; g[p.class].value += p.value })
    return ['A', 'B', 'C'].map((cls) => ({ class: cls, ...g[cls], tone: cls === 'A' ? 'danger' : cls === 'B' ? 'warning' : 'muted' }))
  }, [abc])

  const abcChart = abcSummary.map((s, i) => ({ name: `Class ${s.class}`, Products: s.count, value: s.value, color: [CHART_COLORS[4], CHART_COLORS[2], CHART_COLORS[1]][i] }))

  const tabData = { out: rec.out, low: rec.low, over: rec.over }
  const tabTone = { out: 'danger', low: 'warning', over: 'info' }

  const recColumns = [
    { key: 'name', header: 'Product', sortable: true, render: (p) => <div><div className="font-medium">{p.name}</div><div className="text-xs text-os-muted font-mono">{p.sku}</div></div> },
    { key: 'current', header: 'Current', align: 'right', sortable: true },
    { key: 'recommended', header: 'Recommended', align: 'right', render: (p) => <span className="text-os-muted">{p.recommended}</span> },
    { key: 'reorderQty', header: 'Reorder', align: 'right', sortable: true, render: (p) => <Badge tone={p.reorderQty > 0 ? 'accent' : 'muted'}>{p.reorderQty}</Badge> },
    { key: 'estCost', header: 'Est. cost', align: 'right', sortable: true, render: (p) => formatCurrency(p.estCost) },
    { key: 'reason', header: 'Reason', render: (p) => <span className="text-xs text-os-muted">{p.reason}</span> },
  ]

  const totalReorderCost = rec.all.filter((r) => r.reorderQty > 0).reduce((s, r) => s + r.estCost, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Inventory Optimizer"
        description="Transparent, rule-based recommendations — ABC classification, reorder math, redistribution. No black-box AI."
        icon={Sparkles}
      />

      {/* Health + summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-6 flex items-center gap-6">
          <HealthGauge score={health.score} />
          <div>
            <p className="text-xs text-os-muted uppercase tracking-wide">Inventory health</p>
            <p className="text-3xl font-bold text-os-text">{health.score}<span className="text-base text-os-muted">/100</span></p>
            <Badge tone={health.score >= 85 ? 'success' : health.score >= 70 ? 'info' : health.score >= 50 ? 'warning' : 'danger'}>{health.grade}</Badge>
            <p className="text-xs text-os-muted mt-2 max-w-[220px]">Weighted penalties for out-of-stock, low stock, overstock and expiring items.</p>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Stock issues" icon={AlertTriangle} />
          <div className="p-4 grid grid-cols-2 gap-3">
            <IssueCount icon={XCircle} tone="danger" label="Out of stock" value={health.counts.out} />
            <IssueCount icon={AlertTriangle} tone="warning" label="Low stock" value={health.counts.low} />
            <IssueCount icon={TrendingUp} tone="info" label="Overstock" value={health.counts.over} />
            <IssueCount icon={HeartPulse} tone="danger" label="Expiring ≤14d" value={health.counts.expiring} />
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Reorder budget" icon={Boxes} />
          <div className="p-4">
            <p className="text-xs text-os-muted uppercase tracking-wide">Estimated purchase cost</p>
            <p className="text-3xl font-bold text-os-text mt-1">{formatCurrency(totalReorderCost)}</p>
            <p className="text-xs text-os-muted mt-2">{rec.all.filter((r) => r.reorderQty > 0).length} products need reordering to reach their maximum stock level.</p>
          </div>
        </Card>
      </div>

      {/* ABC classification */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="ABC inventory classification" subtitle="Pareto 80/15/5 by inventory value" icon={Sparkles} />
          <div className="p-4">
            <DataTable
              columns={[
                { key: 'name', header: 'Product', sortable: true, render: (p) => <span className="font-medium">{p.name}</span> },
                { key: 'class', header: 'Class', align: 'center', render: (p) => <Badge tone={p.class === 'A' ? 'danger' : p.class === 'B' ? 'warning' : 'muted'}>{p.class}</Badge> },
                { key: 'value', header: 'Value', align: 'right', sortable: true, render: (p) => formatCurrency(p.value) },
                { key: 'valueShare', header: '% of value', align: 'right', render: (p) => <span className="text-os-muted">{p.valueShare.toFixed(1)}%</span> },
                { key: 'cumulativeShare', header: 'Cumulative', align: 'right', render: (p) => <span className="text-os-muted">{p.cumulativeShare.toFixed(1)}%</span> },
              ]}
              data={abc}
              pageSize={8}
              initialSort={{ key: 'value', dir: 'desc' }}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Class summary" icon={TrendingUp} />
          <div className="p-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={abcChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="Products" radius={[6, 6, 0, 0]}>
                  {abcChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {abcSummary.map((s) => (
              <div key={s.class} className="flex items-center justify-between text-sm">
                <Badge tone={s.tone}>Class {s.class}</Badge>
                <span className="text-os-muted">{s.count} products · {formatCurrency(s.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Reorder recommendations */}
      <Card>
        <CardHeader
          title="Reorder recommendations"
          subtitle="Reorder quantity = max_stock − current. Estimated cost = reorder_qty × purchase_price."
          icon={AlertTriangle}
          action={
            <div className="flex gap-1">
              {[['out', 'Out of stock', rec.out.length], ['low', 'Low stock', rec.low.length], ['over', 'Overstock', rec.over.length]].map(([k, label, n]) => (
                <button key={k} onClick={() => setTab(k)} className={classNames('px-3 py-1.5 rounded-lg text-xs font-medium transition', tab === k ? 'bg-os-accent/10 text-os-accent' : 'text-os-muted hover:bg-os-bg')}>
                  {label} ({n})
                </button>
              ))}
            </div>
          }
        />
        <div className="p-4">
          {tabData[tab].length === 0 ? (
            <EmptyState title={`No ${tab === 'out' ? 'out-of-stock' : tab === 'low' ? 'low-stock' : 'overstock'} items`} description="Inventory is healthy in this category." />
          ) : (
            <DataTable columns={recColumns} data={tabData[tab]} pageSize={8} initialSort={{ key: 'reorderQty', dir: 'desc' }} />
          )}
        </div>
      </Card>

      {/* Redistribution */}
      <Card>
        <CardHeader title="Redistribution suggestions" subtitle="Move surplus from overstocked warehouses to low-stock peers of the same category." icon={ArrowRight} />
        <div className="p-4">
          {redist.length === 0 ? (
            <EmptyState title="No redistribution needed" description="No overstocked product can usefully rebalance a low-stock peer." />
          ) : (
            <ul className="space-y-2">
              {redist.map((r, i) => (
                <li key={i} className="p-3 rounded-lg bg-os-bg border border-os-border flex items-start gap-3">
                  <ArrowRight className="w-4 h-4 text-os-accent mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-os-text">{r.productName} <Badge tone="accent">{r.quantity} units</Badge></p>
                    <p className="text-xs text-os-muted mt-1">{r.fromWarehouse} → {r.toWarehouse} · {r.category}</p>
                    <p className="text-xs text-os-muted/80 mt-1">{r.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  )
}

function HealthGauge({ score }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 85 ? CHART_COLORS[1] : score >= 70 ? CHART_COLORS[3] : score >= 50 ? CHART_COLORS[2] : CHART_COLORS[4]
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0">
      <circle cx="48" cy="48" r={r} fill="none" stroke="rgb(var(--os-border))" strokeWidth="8" />
      <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 48 48)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  )
}

function IssueCount({ icon: Icon, tone, label, value }) {
  const tones = { danger: 'text-os-danger', warning: 'text-os-warning', info: 'text-os-info', success: 'text-os-success' }
  return (
    <div className="p-3 rounded-lg bg-os-bg border border-os-border">
      <Icon className={classNames('w-5 h-5 mb-1', tones[tone])} />
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] text-os-muted">{label}</p>
    </div>
  )
}
