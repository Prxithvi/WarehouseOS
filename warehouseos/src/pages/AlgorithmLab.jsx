import { useState } from 'react'
import { FlaskConical, Play, RotateCcw, Boxes, Route, GitBranch, Search } from 'lucide-react'
import { PageHeader, Card, CardHeader, Button, Badge, Field, Input, Textarea, Select } from '../components/ui'
import { classNames } from '../lib/format'
import { greedyBinPacking, greedyMeta } from '../lib/algorithms/greedy'
import { dijkstra, reconstructPath, dijkstraMeta } from '../lib/algorithms/dijkstra'
import { mergeSort, mergeSortMeta } from '../lib/algorithms/mergeSort'
import { binarySearch, binarySearchMeta } from '../lib/algorithms/binarySearch'

const TABS = [
  { id: 'greedy', label: 'Greedy', icon: Boxes, application: 'Warehouse storage allocation' },
  { id: 'dijkstra', label: "Dijkstra", icon: Route, application: 'Shortest picking route' },
  { id: 'merge', label: 'Merge Sort', icon: GitBranch, application: 'Inventory sorting' },
  { id: 'binary', label: 'Binary Search', icon: Search, application: 'SKU lookup' },
]

export function AlgorithmLab() {
  const [tab, setTab] = useState('greedy')
  return (
    <div className="space-y-6">
      <PageHeader
        title="DAA Algorithm Lab"
        description="Interactive study of four Design & Analysis of Algorithms techniques applied to warehouse problems — with real execution, step traces and complexity analysis."
        icon={FlaskConical}
      />
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={classNames('inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition border', tab === t.id ? 'bg-os-accent/10 text-os-accent border-os-accent/40' : 'text-os-muted border-os-border hover:bg-os-bg')}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'greedy' && <GreedySection />}
      {tab === 'dijkstra' && <DijkstraSection />}
      {tab === 'merge' && <MergeSection />}
      {tab === 'binary' && <BinarySection />}
    </div>
  )
}

// --- shared shells ----------------------------------------------------------
function TheoryBlock({ meta, problem, input, output, flow }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader title="Explanation" icon={FlaskConical} />
        <div className="p-4 space-y-3 text-sm text-os-muted leading-relaxed">
          <p>{meta.application && <Badge tone="accent">{meta.application}</Badge>}</p>
          <div>
            <p className="text-os-text font-medium mb-1">Problem statement</p>
            <p>{problem}</p>
          </div>
          <div>
            <p className="text-os-text font-medium mb-1">Input</p>
            <p>{input}</p>
          </div>
          <div>
            <p className="text-os-text font-medium mb-1">Output</p>
            <p>{output}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Pseudocode" />
          <pre className="p-4 text-xs font-mono text-os-text overflow-x-auto leading-relaxed">{meta.pseudocode.join('\n')}</pre>
        </Card>
        <Card>
          <CardHeader title="Flowchart" />
          <div className="p-4">
            <Flow steps={flow} />
          </div>
        </Card>
      </div>
    </div>
  )
}

function Flow({ steps }) {
  return (
    <div className="flex flex-col items-stretch gap-0">
      {steps.map((s, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className={classNames('px-4 py-2 rounded-lg border text-sm text-os-text text-center w-full max-w-md', s.kind === 'decision' ? 'border-os-warning/50 bg-os-warning/5' : s.kind === 'io' ? 'border-os-info/50 bg-os-info/5' : 'border-os-border bg-os-bg')}>{s.label}</div>
          {i < steps.length - 1 && <div className="w-px h-4 bg-os-border" />}
        </div>
      ))}
    </div>
  )
}

function ComplexityTable({ meta }) {
  const rows = [
    ['Best-case', meta.bestCase],
    ['Average-case', meta.averageCase],
    ['Worst-case', meta.worstCase],
    ['Space complexity', meta.spaceComplexity],
  ]
  return (
    <Card>
      <CardHeader title="Complexity analysis" />
      <div className="p-4">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-b border-os-border/60 last:border-0">
                <td className="py-2.5 text-os-muted">{k}</td>
                <td className="py-2.5 text-right font-mono text-os-text">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function Counts({ result }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <CountCard label="Comparisons" value={result?.comparisons ?? 0} />
      <CountCard label="Operations" value={result?.operations ?? 0} />
      <CountCard label="Steps traced" value={result?.steps?.length ?? 0} />
      <CountCard label="Result" value={result?.summary ?? '—'} />
    </div>
  )
}
function CountCard({ label, value }) {
  return (
    <div className="p-3 rounded-lg bg-os-bg border border-os-border">
      <p className="text-[11px] text-os-muted uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-os-text tabular-nums truncate">{value}</p>
    </div>
  )
}

// --- Greedy ----------------------------------------------------------------
function GreedySection() {
  const [items, setItems] = useState('P1:45,P2:25,P3:60,P4:15,P5:30,P6:55,P7:20,P8:40')
  const [capacity, setCapacity] = useState(100)
  const [result, setResult] = useState(null)

  const run = () => {
    const parsed = items.split(',').map((s, i) => {
      const [id, size] = s.split(':')
      return { id: (id || `i${i + 1}`).trim(), size: Number(size) }
    }).filter((x) => !Number.isNaN(x.size))
    setResult(greedyBinPacking(parsed, Number(capacity)))
  }

  return (
    <div className="space-y-4">
      <TheoryBlock
        meta={greedyMeta}
        problem="Allocate items of varying sizes into storage bins of fixed capacity, using the minimum number of bins without exceeding any bin's capacity."
        input="A list of items each with an id and size (units), and a single bin capacity shared by all bins."
        output="A packing of items into bins, the number of bins used, and the utilization of each bin."
        flow={[
          { label: 'Start: read items + capacity', kind: 'io' },
          { label: 'Sort items by size DESC (greedy choice)', kind: '' },
          { label: 'For each item: place in first bin that fits?', kind: 'decision' },
          { label: 'Yes → add to that bin', kind: '' },
          { label: 'No → open a new bin', kind: '' },
          { label: 'Output bins + counts', kind: 'io' },
        ]}
      />
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Items (id:size, comma separated)"><Textarea rows={3} value={items} onChange={(e) => setItems(e.target.value)} className="font-mono text-xs" /></Field>
          <Field label="Bin capacity"><Input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} /></Field>
          <div className="flex items-end gap-2"><Button onClick={run}><Play className="w-4 h-4" /> Run</Button><Button variant="secondary" onClick={() => setResult(null)}><RotateCcw className="w-4 h-4" /></Button></div>
        </div>
      </Card>
      {result && (
        <>
          <Counts result={{ ...result, summary: `${result.binCount} bins` }} />
          <Card>
            <CardHeader title="Step trace" subtitle="Each step records the bin layout after a placement." />
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {result.steps.map((s, i) => (
                <div key={i} className="text-xs p-2 rounded-lg bg-os-bg border border-os-border">
                  <Badge tone="muted">{s.phase}</Badge> <span className="text-os-text">{s.note}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Resulting bins" subtitle={`Lower bound (ceil(total/capacity)): ${result.lowerBound}`} />
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.bins.map((b) => (
                <div key={b.index} className="p-3 rounded-lg border border-os-border">
                  <div className="flex items-center justify-between mb-2"><span className="font-medium text-os-text">Bin {b.index}</span><Badge tone={b.utilization >= 90 ? 'danger' : b.utilization >= 60 ? 'warning' : 'success'}>{b.utilization}%</Badge></div>
                  <div className="h-2 rounded-full bg-os-bg overflow-hidden mb-2"><div className="h-full bg-os-accent" style={{ width: `${b.utilization}%` }} /></div>
                  <div className="flex flex-wrap gap-1">
                    {b.items.map((it, j) => <span key={j} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-os-bg border border-os-border text-os-muted">{it.id}:{it.size}</span>)}
                  </div>
                  <p className="text-[10px] text-os-muted mt-2">{b.used}/{b.capacity} used · {b.free} free</p>
                </div>
              ))}
            </div>
          </Card>
          <ComplexityTable meta={greedyMeta} />
        </>
      )}
    </div>
  )
}

// --- Dijkstra --------------------------------------------------------------
function DijkstraSection() {
  const [edges, setEdges] = useState('PACK-A1:15\nA1-A2:10\nA2-A3:10\nA1-B1:12\nB1-B2:10\nPACK-B1:20\nA3-C1:8\nC1-C2:10')
  const [start, setStart] = useState('PACK')
  const [result, setResult] = useState(null)

  const run = () => {
    const elist = edges.split('\n').map((l) => {
      const [ab, w] = l.split(':')
      const [from, to] = ab.split('-')
      return { from: from.trim(), to: to.trim(), weight: Number(w) }
    }).filter((e) => e.from && e.to && !Number.isNaN(e.weight))
    const nodes = [...new Set(elist.flatMap((e) => [e.from, e.to]))]
    setResult(dijkstra({ nodes, edges: elist }, start.trim() || nodes[0]))
  }

  const distances = result ? Object.entries(result.distances).map(([n, d]) => ({ node: n, dist: d, path: reconstructPath(result.predecessors, start, n) })) : []

  return (
    <div className="space-y-4">
      <TheoryBlock
        meta={dijkstraMeta}
        problem="Find the minimum walking distance from a start node to every other node in a weighted graph of warehouse paths."
        input="A weighted graph: nodes (storage locations) and edges (walking paths with a distance weight), plus a start node."
        output="Shortest distance from the start to every node, and the predecessor chain used to rebuild each shortest path."
        flow={[
          { label: 'Init: dist[start]=0, others=∞', kind: '' },
          { label: 'Pick unvisited node with min dist', kind: '' },
          { label: 'Has unvisited neighbours?', kind: 'decision' },
          { label: 'Relax each neighbour: alt=dist[u]+w', kind: '' },
          { label: 'if alt < dist[v]: update', kind: '' },
          { label: 'Mark u visited; repeat', kind: '' },
          { label: 'Output distances + paths', kind: 'io' },
        ]}
      />
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Edges (from-to:weight, one per line)"><Textarea rows={6} value={edges} onChange={(e) => setEdges(e.target.value)} className="font-mono text-xs" /></Field>
          <Field label="Start node"><Input value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <div className="flex items-end gap-2"><Button onClick={run}><Play className="w-4 h-4" /> Run</Button><Button variant="secondary" onClick={() => setResult(null)}><RotateCcw className="w-4 h-4" /></Button></div>
        </div>
      </Card>
      {result && (
        <>
          <Counts result={{ ...result, summary: `${result.visited.length} visited` }} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Step trace" subtitle="Distances after each node extraction." />
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {result.steps.map((s, i) => (
                  <div key={i} className="text-xs p-2 rounded-lg bg-os-bg border border-os-border">
                    <p className="text-os-text mb-1">{s.note}</p>
                    <p className="font-mono text-os-muted">{Object.entries(s.distances).map(([n, d]) => `${n}=${Number.isFinite(d) ? d : '∞'}`).join('  ')}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Shortest distances" subtitle={`From ${start}`} />
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-os-muted uppercase border-b border-os-border"><th className="px-2 py-2 text-left">Node</th><th className="px-2 py-2 text-right">Distance</th><th className="px-2 py-2 text-left">Path</th></tr></thead>
                  <tbody>
                    {distances.map((d) => (
                      <tr key={d.node} className="border-b border-os-border/60">
                        <td className="px-2 py-2 font-mono">{d.node}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{Number.isFinite(d.dist) ? d.dist : '∞'}</td>
                        <td className="px-2 py-2 text-xs text-os-muted font-mono">{d.path ? d.path.join(' → ') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          <ComplexityTable meta={dijkstraMeta} />
        </>
      )}
    </div>
  )
}

// --- Merge Sort ------------------------------------------------------------
function MergeSection() {
  const [values, setValues] = useState('220, 45, 12, 178, 9, 64, 301, 56, 88, 150, 7, 33')
  const [order, setOrder] = useState('asc')
  const [result, setResult] = useState(null)

  const run = () => {
    const arr = values.split(',').map((v) => Number(v.trim())).filter((n) => !Number.isNaN(n))
    setResult(mergeSort(arr, undefined, order))
  }

  return (
    <div className="space-y-4">
      <TheoryBlock
        meta={mergeSortMeta}
        problem="Sort an array of inventory records (e.g. stock counts) into non-decreasing order efficiently."
        input="An array of comparable numeric values."
        output="A new array containing the same values in sorted order."
        flow={[
          { label: 'If length ≤ 1 → return', kind: 'decision' },
          { label: 'Split into two halves', kind: '' },
          { label: 'Recursively sort left half', kind: '' },
          { label: 'Recursively sort right half', kind: '' },
          { label: 'Merge the two sorted halves', kind: '' },
          { label: 'Return merged array', kind: 'io' },
        ]}
      />
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Values (comma separated)"><Textarea rows={3} value={values} onChange={(e) => setValues(e.target.value)} className="font-mono text-xs" /></Field>
          <Field label="Order"><Select value={order} onChange={(e) => setOrder(e.target.value)}><option value="asc">Ascending</option><option value="desc">Descending</option></Select></Field>
          <div className="flex items-end gap-2"><Button onClick={run}><Play className="w-4 h-4" /> Run</Button><Button variant="secondary" onClick={() => setResult(null)}><RotateCcw className="w-4 h-4" /></Button></div>
        </div>
      </Card>
      {result && (
        <>
          <Counts result={{ ...result, summary: `${result.sorted.length} sorted` }} />
          <Card>
            <CardHeader title="Step trace" subtitle={`${result.splits} splits · ${result.merges} merges`} />
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {result.steps.map((s, i) => (
                <div key={i} className="text-xs p-2 rounded-lg bg-os-bg border border-os-border">
                  <Badge tone={s.phase === 'split' ? 'info' : 'accent'}>{s.phase}</Badge> <span className="text-os-text">{s.note}</span>
                  {s.phase === 'merge' && (
                    <div className="mt-1 font-mono text-os-muted">
                      <span className="text-os-info">[{(s.left || []).join(', ')}]</span> + <span className="text-os-warning">[{(s.right || []).join(', ')}]</span> → <span className="text-os-success">[{(s.merged || []).join(', ')}]</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Sorted result" />
            <div className="p-4 font-mono text-sm text-os-text overflow-x-auto">[{result.sorted.join(', ')}]</div>
          </Card>
          <ComplexityTable meta={mergeSortMeta} />
        </>
      )}
    </div>
  )
}

// --- Binary Search ---------------------------------------------------------
function BinarySection() {
  const [values, setValues] = useState('SKU-0001, SKU-0005, SKU-0009, SKU-0012, SKU-0017, SKU-0023, SKU-0031, SKU-0044, SKU-0050, SKU-0061')
  const [target, setTarget] = useState('SKU-0017')
  const [result, setResult] = useState(null)

  const run = () => {
    const arr = values.split(',').map((v) => v.trim()).filter(Boolean)
    setResult(binarySearch(arr, target.trim()))
  }

  return (
    <div className="space-y-4">
      <TheoryBlock
        meta={binarySearchMeta}
        problem="Locate a product by its SKU in a sorted catalogue in logarithmic time."
        input="A sorted array of SKUs and a target SKU to find."
        output="The index of the target, or -1 if it is not present."
        flow={[
          { label: 'lo=0, hi=n-1', kind: '' },
          { label: 'lo ≤ hi?', kind: 'decision' },
          { label: 'mid = (lo+hi)/2', kind: '' },
          { label: 'arr[mid] == target?', kind: 'decision' },
          { label: 'Yes → return mid', kind: '' },
          { label: '< target → lo=mid+1', kind: '' },
          { label: '> target → hi=mid-1', kind: '' },
          { label: 'Not found → return -1', kind: 'io' },
        ]}
      />
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Sorted SKUs (comma separated)"><Textarea rows={3} value={values} onChange={(e) => setValues(e.target.value)} className="font-mono text-xs" /></Field>
          <Field label="Target SKU"><Input value={target} onChange={(e) => setTarget(e.target.value)} className="font-mono" /></Field>
          <div className="flex items-end gap-2"><Button onClick={run}><Play className="w-4 h-4" /> Run</Button><Button variant="secondary" onClick={() => setResult(null)}><RotateCcw className="w-4 h-4" /></Button></div>
        </div>
      </Card>
      {result && (
        <>
          <Counts result={{ ...result, summary: result.found ? `Index ${result.index}` : 'Not found' }} />
          <Card>
            <CardHeader title="Step trace" subtitle="lo / mid / hi at each comparison." />
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {result.steps.map((s, i) => (
                <div key={i} className="text-xs p-2 rounded-lg bg-os-bg border border-os-border">
                  <Badge tone="muted">{s.phase}</Badge> <span className="text-os-text">{s.note}</span>
                  {s.mid !== undefined && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.array.map((v, idx) => {
                        const tone = idx === s.mid ? 'accent' : idx < s.lo || idx > s.hi ? 'muted' : 'info'
                        return <span key={idx} className={classNames('font-mono px-1.5 py-0.5 rounded border text-[10px]', tone === 'accent' ? 'border-os-accent/50 bg-os-accent/10 text-os-accent' : tone === 'info' ? 'border-os-info/30 bg-os-info/10 text-os-info' : 'border-os-border text-os-muted opacity-60')}>{v}</span>
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Result" />
            <div className="p-4 text-sm">
              {result.found ? (
                <p className="text-os-success">✓ Found <span className="font-mono font-bold">{result.target}</span> at index <span className="font-bold">{result.index}</span>.</p>
              ) : (
                <p className="text-os-danger">✗ <span className="font-mono">{result.target}</span> was not found in the catalogue.</p>
              )}
            </div>
          </Card>
          <ComplexityTable meta={binarySearchMeta} />
        </>
      )}
    </div>
  )
}
