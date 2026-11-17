import { useState, useMemo } from 'react'
import { Route, Play, MapPin, Navigation, GitCompare } from 'lucide-react'
import { useData } from '../context/DataContext'
import { PageHeader, Card, CardHeader, Badge, Button, EmptyState, Select } from '../components/ui'
import { dijkstra, greedyPickingRoute, reconstructPath } from '../lib/algorithms/dijkstra'
import { classNames } from '../lib/format'

// Build a weighted warehouse graph from storage locations of one warehouse.
// Nodes = PACK station + every location. Edges connect locations inside an
// aisle into a chain (by rack), connect each aisle head to PACK, and connect
// consecutive aisle heads so the graph is connected and Dijkstra has real work.
function buildGraph(warehouseId, locations) {
  const nodes = ['PACK']
  const locs = locations.filter((l) => l.warehouse_id === warehouseId && l.status === 'active')
  const num = (s) => {
    const m = String(s).match(/(\d+)/)
    return m ? parseInt(m[1], 10) : 0
  }
  const enriched = locs.map((l) => ({ ...l, aisleN: num(l.aisle), rackN: num(l.rack), code: l.code }))
  nodes.push(...enriched.map((l) => l.code))

  const edges = []
  const addEdge = (a, b, w) => edges.push({ from: a, to: b, weight: w })

  // Group by aisle, chain by rack.
  const byAisle = new Map()
  enriched.forEach((l) => { (byAisle.get(l.aisleN) || byAisle.set(l.aisleN, []).get(l.aisleN)).push(l) })
  const aisles = [...byAisle.keys()].sort((a, b) => a - b)
  const aisleHeads = []
  byAisle.forEach((list, aisle) => {
    list.sort((a, b) => a.rackN - b.rackN)
    aisleHeads.push({ aisle, head: list[0].code })
    for (let i = 0; i < list.length - 1; i++) {
      addEdge(list[i].code, list[i + 1].code, Math.max(1, Math.abs(list[i].rackN - list[i + 1].rackN)) * 10)
    }
  })
  // Connect PACK to first aisle head, and aisle heads to each other.
  if (aisleHeads.length) {
    addEdge('PACK', aisleHeads[0].head, 15)
    for (let i = 0; i < aisleHeads.length - 1; i++) {
      addEdge(aisleHeads[i].head, aisleHeads[i + 1].head, 12)
    }
  }
  // Fallback: if a location is isolated (single in its aisle), connect to PACK.
  enriched.forEach((l) => {
    const hasEdge = edges.some((e) => e.from === l.code || e.to === l.code)
    if (!hasEdge) addEdge('PACK', l.code, 20)
  })
  return { nodes, edges, locations: enriched }
}

export function PickingRoute() {
  const { data } = useData()
  const [warehouseId, setWarehouseId] = useState(data.warehouses[0]?.id || '')
  const [selected, setSelected] = useState([])
  const [result, setResult] = useState(null)

  const graph = useMemo(() => buildGraph(warehouseId, data.storageLocations), [warehouseId, data.storageLocations])

  const toggle = (code) => {
    setSelected((cur) => (cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]))
    setResult(null)
  }

  const run = () => {
    if (selected.length === 0) return
    const greedy = greedyPickingRoute({ nodes: graph.nodes, edges: graph.edges }, 'PACK', selected)
    // Sequential comparison: visit in the order the user selected.
    let seqDist = 0
    let cur = 'PACK'
    const seqRoute = ['PACK', ...selected, 'PACK']
    for (let i = 1; i < seqRoute.length; i++) {
      const d = dijkstra({ nodes: graph.nodes, edges: graph.edges }, cur)
      seqDist += d.distances[seqRoute[i]] ?? Infinity
      cur = seqRoute[i]
    }
    setResult({ greedy, sequential: { totalDistance: seqDist, route: seqRoute } })
  }

  const savings = result ? Math.max(0, result.sequential.totalDistance - result.greedy.totalDistance) : 0
  const savingsPct = result && result.sequential.totalDistance > 0 ? Math.round((savings / result.sequential.totalDistance) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Picking Route Optimizer"
        description="Storage locations are graph nodes; walking paths are weighted edges. Dijkstra finds each shortest leg, a greedy nearest-neighbour strategy sequences the stops."
        icon={Route}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Controls */}
        <Card className="p-4 space-y-4">
          <div>
            <label className="os-label">Warehouse</label>
            <Select value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); setSelected([]); setResult(null) }}>
              {data.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
          </div>
          <div>
            <p className="os-label">Pick target locations ({selected.length} selected)</p>
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {graph.locations.map((l) => (
                <label key={l.code} className={classNames('flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition', selected.includes(l.code) ? 'border-os-accent/50 bg-os-accent/5' : 'border-os-border hover:bg-os-bg')}>
                  <input type="checkbox" checked={selected.includes(l.code)} onChange={() => toggle(l.code)} className="accent-os-accent" />
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-os-text">{l.code}</p>
                    <p className="text-[11px] text-os-muted truncate">{l.path}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <Button onClick={run} disabled={selected.length === 0} className="w-full"><Play className="w-4 h-4" /> Compute picking route</Button>
        </Card>

        {/* Graph visualization */}
        <Card className="lg:col-span-2">
          <CardHeader title="Warehouse graph" subtitle="PACK station (◆) → locations grouped by aisle" icon={MapPin} />
          <div className="p-4">
            <GraphView graph={graph} route={result?.greedy} />
          </div>
        </Card>
      </div>

      {result && (
        <>
          {/* Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <p className="text-xs text-os-muted uppercase tracking-wide">Greedy nearest-neighbour</p>
              <p className="text-3xl font-bold text-os-text mt-1 tabular-nums">{result.greedy.totalDistance}</p>
              <p className="text-xs text-os-muted mt-1">{result.greedy.legCount} legs · {result.greedy.comparisons} comparisons</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-os-muted uppercase tracking-wide">Sequential (selection order)</p>
              <p className="text-3xl font-bold text-os-text mt-1 tabular-nums">{result.sequential.totalDistance}</p>
              <p className="text-xs text-os-muted mt-1">{result.sequential.route.length - 1} legs</p>
            </Card>
            <Card className="p-5 bg-os-success/5 border-os-success/30">
              <p className="text-xs text-os-success uppercase tracking-wide inline-flex items-center gap-1"><GitCompare className="w-3 h-3" /> Distance saved</p>
              <p className="text-3xl font-bold text-os-success mt-1 tabular-nums">{savings} ({savingsPct}%)</p>
              <p className="text-xs text-os-muted mt-1">Greedy vs sequential picking</p>
            </Card>
          </div>

          {/* Route detail */}
          <Card>
            <CardHeader title="Optimized route" subtitle="Start → nearest target → … → back to start" icon={Navigation} />
            <div className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                {result.greedy.route.map((node, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge tone={node === 'PACK' ? 'accent' : 'info'}>{node}</Badge>
                    {i < result.greedy.route.length - 1 && <span className="text-os-muted text-xs">→</span>}
                  </div>
                ))}
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-os-muted uppercase border-b border-os-border"><th className="px-3 py-2 text-left">Leg</th><th className="px-3 py-2 text-left">From</th><th className="px-3 py-2 text-left">To</th><th className="px-3 py-2 text-right">Distance</th></tr></thead>
                  <tbody>
                    {result.greedy.legs.map((leg, i) => (
                      <tr key={i} className="border-b border-os-border/60">
                        <td className="px-3 py-2 text-os-muted">{i + 1}</td>
                        <td className="px-3 py-2 font-mono">{leg.from}</td>
                        <td className="px-3 py-2 font-mono">{leg.to}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{leg.distance}</td>
                      </tr>
                    ))}
                    <tr className="font-bold"><td colSpan={3} className="px-3 py-2 text-right">Total</td><td className="px-3 py-2 text-right tabular-nums">{result.greedy.totalDistance}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </>
      )}

      {!result && selected.length === 0 && (
        <Card><EmptyState icon={MapPin} title="Select target locations" description="Pick one or more storage locations above, then compute the optimal picking route." /></Card>
      )}
    </div>
  )
}

function GraphView({ graph, route }) {
  const PAD = 30
  const W = 640
  const H = 360
  const enriched = graph.locations
  if (enriched.length === 0) return <EmptyState title="No locations in this warehouse" />
  const aisles = [...new Set(enriched.map((l) => l.aisleN))].sort((a, b) => a - b)
  const maxRack = Math.max(1, ...enriched.map((l) => l.rackN))
  const xFor = (aisle) => PAD + (aisles.length <= 1 ? W / 2 - PAD : (aisle / (aisles.length + 1)) * (W - 2 * PAD))
  const yFor = (rack) => H - PAD - (rack / (maxRack + 1)) * (H - 2 * PAD)
  const pack = { x: W / 2, y: H - PAD }

  const routeNodes = new Set(route?.route || [])
  const routeEdges = new Set()
  ;(route?.legs || []).forEach((leg) => {
    if (leg.path) for (let i = 0; i < leg.path.length - 1; i++) routeEdges.add(`${leg.path[i]}|${leg.path[i + 1]}`)
  })

  const pos = (code) => {
    if (code === 'PACK') return pack
    const l = enriched.find((x) => x.code === code)
    return l ? { x: xFor(l.aisleN), y: yFor(l.rackN) } : null
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-lg bg-os-bg border border-os-border">
      {/* edges */}
      {graph.edges.map((e, i) => {
        const a = pos(e.from), b = pos(e.to)
        if (!a || !b) return null
        const onRoute = routeEdges.has(`${e.from}|${e.to}`) || routeEdges.has(`${e.to}|${e.from}`)
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={onRoute ? '#8B5CF6' : 'rgb(var(--os-border))'} strokeWidth={onRoute ? 3 : 1.5} />
      })}
      {/* nodes */}
      <g>
        <polygon points={`${pack.x},${pack.y - 12} ${pack.x + 10},${pack.y} ${pack.x},${pack.y + 10} ${pack.x - 10},${pack.y}`} fill="#8B5CF6" />
        <text x={pack.x} y={pack.y + 26} textAnchor="middle" fontSize="11" fill="rgb(var(--os-muted))">PACK</text>
      </g>
      {enriched.map((l) => {
        const p = { x: xFor(l.aisleN), y: yFor(l.rackN) }
        const onRoute = routeNodes.has(l.code)
        return (
          <g key={l.code}>
            <circle cx={p.x} cy={p.y} r={onRoute ? 8 : 6} fill={onRoute ? '#22C55E' : 'rgb(var(--os-card))'} stroke={onRoute ? '#22C55E' : 'rgb(var(--os-muted))'} strokeWidth={2} />
            <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="9" fill="rgb(var(--os-muted))">{l.code}</text>
          </g>
        )
      })}
    </svg>
  )
}
