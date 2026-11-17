import { useState, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Boxes, Plus, Minus, Edit3, Bookmark, BookmarkCheck, ArrowLeftRight,
  History, Download, Upload, Package,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { PageHeader, Card, Button, Badge, Modal, Field, Input, Select, EmptyState, toast } from '../components/ui'
import { DataTable } from '../components/DataTable'
import { formatCurrency, formatDate, stockStatus, inventoryValue, classNames } from '../lib/format'
import { downloadCSV, parseCSV } from '../lib/csv'

export function Inventory() {
  const { data, adjustStock, setStock, reserveStock, releaseStock, transferStock } = useData()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') || '')
  const [category, setCategory] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [status, setStatus] = useState('')
  const [action, setAction] = useState(null) // { type, product }
  const [historyFor, setHistoryFor] = useState(null)
  const fileRef = useRef(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.products.filter((p) => {
      if (q && !(p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.barcode || '').includes(q))) return false
      if (category && p.category_id !== category) return false
      if (warehouse && p.warehouse_id !== warehouse) return false
      if (status && stockStatus(p).key !== status) return false
      return true
    })
  }, [data.products, search, category, warehouse, status])

  const columns = [
    {
      key: 'name', header: 'Product', sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3 min-w-[180px]">
          <ProductAvatar name={p.name} />
          <div className="min-w-0">
            <div className="font-medium text-os-text truncate">{p.name}</div>
            <div className="text-xs text-os-muted">{p.sku}</div>
          </div>
        </div>
      ),
    },
    { key: 'category_name', header: 'Category', sortable: true, render: (p) => <span className="text-os-muted">{p.category_name}</span> },
    { key: 'warehouse_name', header: 'Warehouse', sortable: true, render: (p) => <span className="text-os-muted">{p.warehouse_name}</span> },
    { key: 'storage_location_code', header: 'Location', render: (p) => <span className="font-mono text-xs text-os-muted">{p.storage_location_code}</span> },
    { key: 'quantity', header: 'Available', sortable: true, align: 'right', render: (p) => <span className="font-semibold">{p.quantity}</span> },
    { key: 'reserved', header: 'Reserved', align: 'right', render: (p) => <span className="text-os-warning">{p.reserved || 0}</span> },
    { key: 'min_stock', header: 'Min', align: 'right', render: (p) => <span className="text-os-muted">{p.min_stock}</span> },
    { key: 'purchase_price', header: 'Unit cost', sortable: true, align: 'right', render: (p) => formatCurrency(p.purchase_price) },
    {
      key: 'status', header: 'Status', align: 'center',
      render: (p) => { const st = stockStatus(p); return <Badge tone={st.tone}>{st.label}</Badge> },
    },
    {
      key: '_actions', header: 'Actions', align: 'right', width: '1%',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <IconBtn title="Add stock" onClick={() => setAction({ type: 'add', product: p })}><Plus className="w-4 h-4" /></IconBtn>
          <IconBtn title="Remove stock" onClick={() => setAction({ type: 'remove', product: p })}><Minus className="w-4 h-4" /></IconBtn>
          <IconBtn title="Set stock" onClick={() => setAction({ type: 'set', product: p })}><Edit3 className="w-4 h-4" /></IconBtn>
          <IconBtn title="Reserve" onClick={() => setAction({ type: 'reserve', product: p })}><Bookmark className="w-4 h-4" /></IconBtn>
          <IconBtn title="Release" onClick={() => setAction({ type: 'release', product: p })}><BookmarkCheck className="w-4 h-4" /></IconBtn>
          <IconBtn title="Transfer" onClick={() => setAction({ type: 'transfer', product: p })}><ArrowLeftRight className="w-4 h-4" /></IconBtn>
          <IconBtn title="History" onClick={() => setHistoryFor(p)}><History className="w-4 h-4" /></IconBtn>
        </div>
      ),
    },
  ]

  const exportCSV = () => {
    downloadCSV('warehouseos-inventory.csv', filtered, [
      { key: 'name', label: 'Name' }, { key: 'sku', label: 'SKU' }, { key: 'barcode', label: 'Barcode' },
      { key: 'category_name', label: 'Category' }, { key: 'brand', label: 'Brand' },
      { key: 'warehouse_name', label: 'Warehouse' }, { key: 'storage_location_code', label: 'Location' },
      { key: 'quantity', label: 'Available' }, { key: 'reserved', label: 'Reserved' },
      { key: 'min_stock', label: 'Min' }, { key: 'max_stock', label: 'Max' },
      { key: 'purchase_price', label: 'PurchasePrice' }, { key: 'selling_price', label: 'SellingPrice' },
    ])
    toast('Inventory exported to CSV', 'success')
  }

  const onImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const rows = parseCSV(text)
    let updated = 0, created = 0, skipped = 0
    for (const r of rows) {
      const sku = (r.SKU || r.sku || '').trim()
      const qty = parseInt(r.Available || r.quantity, 10)
      if (!sku || Number.isNaN(qty)) { skipped++; continue }
      const existing = data.products.find((p) => p.sku === sku)
      if (existing) {
        try { await setStock(existing.id, qty, `CSV import — set ${qty}`); updated++ } catch { skipped++ }
      } else {
        skipped++
      }
    }
    toast(`Import complete: ${updated} updated, ${created} created, ${skipped} skipped`, 'info')
    if (fileRef.current) fileRef.current.value = ''
  }

  const clearSearch = () => { setSearch(''); setCategory(''); setWarehouse(''); setStatus(''); setParams({}) }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Live stock levels across all warehouses. Every action is logged to the transaction history."
        icon={Boxes}
        actions={
          <>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onImportFile} />
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" /> Import CSV</Button>
            <Button variant="secondary" size="sm" onClick={exportCSV}><Download className="w-4 h-4" /> Export CSV</Button>
          </>
        }
      />

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input placeholder="Search name, SKU, barcode…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
            <option value="">All warehouses</option>
            {data.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="in_stock">In stock</option>
            <option value="low_stock">Low stock</option>
            <option value="overstock">Overstock</option>
            <option value="out_of_stock">Out of stock</option>
          </Select>
          <Button variant="ghost" size="sm" onClick={clearSearch}>Clear filters</Button>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-os-muted">
          <span>{filtered.length} of {data.products.length} products</span>
          <span>·</span>
          <span>Total value: <span className="text-os-text font-medium">{formatCurrency(filtered.reduce((s, p) => s + inventoryValue(p), 0))}</span></span>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={filtered}
          pageSize={12}
          initialSort={{ key: 'name', dir: 'asc' }}
          emptyTitle="No inventory matches"
          emptyDescription="Try adjusting your search or filters."
        />
      </Card>

      {action && (
        <StockActionModal
          action={action}
          warehouses={data.warehouses}
          onClose={() => setAction(null)}
          onApply={async (payload) => {
            const { product, type } = action
            try {
              if (type === 'add') await adjustStock(product.id, payload.qty, payload.note || 'Manual add')
              else if (type === 'remove') await adjustStock(product.id, -payload.qty, payload.note || 'Manual remove')
              else if (type === 'set') await setStock(product.id, payload.qty, payload.note || 'Stock set')
              else if (type === 'reserve') await reserveStock(product.id, payload.qty)
              else if (type === 'release') await releaseStock(product.id, payload.qty)
              else if (type === 'transfer') await transferStock(product.id, payload.qty, payload.fromWh, payload.toWh)
              toast('Stock updated', 'success')
              setAction(null)
            } catch (err) {
              toast(err.message || 'Operation failed', 'danger')
            }
          }}
        />
      )}

      <Modal open={!!historyFor} onClose={() => setHistoryFor(null)} title={historyFor ? `Transaction history · ${historyFor.name}` : ''} size="lg">
        <TxHistory productId={historyFor?.id} transactions={data.transactions} />
      </Modal>
    </div>
  )
}

function ProductAvatar({ name }) {
  const initials = name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['from-os-accent to-os-info', 'from-os-success to-os-info', 'from-os-warning to-os-danger', 'from-os-info to-os-accent']
  const idx = (name.charCodeAt(0) || 0) % colors.length
  return (
    <div className={classNames('w-9 h-9 rounded-lg bg-gradient-to-br text-white text-xs font-bold flex items-center justify-center shrink-0', colors[idx])}>
      {initials}
    </div>
  )
}

function IconBtn({ title, onClick, children }) {
  return (
    <button title={title} onClick={onClick} className="os-btn-ghost p-1.5 rounded-md hover:text-os-accent">
      {children}
    </button>
  )
}

function StockActionModal({ action, warehouses, onClose, onApply }) {
  const { type, product } = action
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const [fromWh, setFromWh] = useState(product.warehouse_id)
  const [toWh, setToWh] = useState('')

  const titles = {
    add: 'Add stock', remove: 'Remove stock', set: 'Set stock level',
    reserve: 'Reserve stock', release: 'Release reservation', transfer: 'Transfer stock',
  }
  const labels = {
    add: 'Quantity to add', remove: 'Quantity to remove', set: 'New stock level',
    reserve: 'Quantity to reserve', release: 'Quantity to release', transfer: 'Quantity to transfer',
  }

  const apply = () => {
    const q = parseInt(qty, 10)
    if (Number.isNaN(q) || q < 0) { toast('Enter a valid non-negative quantity', 'danger'); return }
    if (type === 'transfer' && (!fromWh || !toWh || fromWh === toWh)) { toast('Select two different warehouses', 'danger'); return }
    onApply({ qty: q, note, fromWh, toWh })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={titles[type]}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={apply}>Apply</Button></>}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-os-bg border border-os-border">
          <Package className="w-5 h-5 text-os-accent" />
          <div className="min-w-0">
            <p className="font-medium text-os-text truncate">{product.name}</p>
            <p className="text-xs text-os-muted">{product.sku} · Available {product.quantity} · Reserved {product.reserved || 0}</p>
          </div>
        </div>
        <Field label={labels[type]}>
          <Input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        {type === 'transfer' ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="From warehouse">
              <Select value={fromWh} onChange={(e) => setFromWh(e.target.value)}>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </Field>
            <Field label="To warehouse">
              <Select value={toWh} onChange={(e) => setToWh(e.target.value)}>
                <option value="">Select…</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </Field>
          </div>
        ) : null}
        {['add', 'remove', 'set'].includes(type) && (
          <Field label="Note (optional)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for adjustment" />
          </Field>
        )}
        {(type === 'remove' || type === 'reserve') && (
          <p className="text-xs text-os-warning">Negative inventory is prevented — the operation will clamp at zero where applicable.</p>
        )}
      </div>
    </Modal>
  )
}

function TxHistory({ productId, transactions }) {
  const items = transactions.filter((t) => t.product_id === productId)
  if (items.length === 0) return <EmptyState title="No transactions yet" description="Stock movements for this product will appear here." />
  return (
    <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
      {items.map((t) => (
        <li key={t.id} className="flex items-start gap-3 p-3 rounded-lg bg-os-bg border border-os-border">
          <Badge tone={txTone(t.type)}>{t.type}</Badge>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-os-text">{t.note}</p>
            <p className="text-xs text-os-muted">{t.warehouse_name} · {formatDate(t.timestamp)} · by {t.user}</p>
          </div>
          <span className="text-sm font-semibold tabular-nums text-os-text">{t.quantity}</span>
        </li>
      ))}
    </ul>
  )
}

function txTone(type) {
  return { add: 'success', remove: 'danger', update: 'info', reserve: 'warning', release: 'accent', transfer: 'info' }[type] || 'muted'
}
