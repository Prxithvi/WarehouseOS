import { useState, useMemo } from 'react'
import { ArrowLeftRight, Plus, ArrowRight, CheckCircle2, Clock, Truck } from 'lucide-react'
import { useData } from '../context/DataContext'
import { PageHeader, Card, Button, Badge, Modal, Field, Input, Select, EmptyState, toast } from '../components/ui'
import { DataTable } from '../components/DataTable'
import { formatDateTime, classNames } from '../lib/format'

const statusTone = { Completed: 'success', 'In Transit': 'info', Pending: 'warning' }
const statusIcon = { Completed: CheckCircle2, 'In Transit': Truck, Pending: Clock }

export function StockTransfers() {
  const { data, transferStock } = useData()
  const [open, setOpen] = useState(false)

  const columns = [
    { key: 'product_name', header: 'Product', sortable: true, render: (t) => (
      <div><div className="font-medium text-os-text">{t.product_name}</div><div className="text-xs text-os-muted font-mono">{t.sku}</div></div>
    ) },
    { key: 'quantity', header: 'Qty', align: 'right', sortable: true, render: (t) => <span className="font-semibold tabular-nums">{t.quantity}</span> },
    { key: 'from_warehouse', header: 'From', render: (t) => <span className="text-os-muted">{t.from_warehouse}</span> },
    { key: 'to_warehouse', header: 'To', render: (t) => (
      <span className="inline-flex items-center gap-1 text-os-muted">{t.from_warehouse} <ArrowRight className="w-3 h-3" /> {t.to_warehouse}</span>
    ) },
    { key: 'status', header: 'Status', align: 'center', render: (t) => {
      const Icon = statusIcon[t.status] || Clock
      return <Badge tone={statusTone[t.status] || 'muted'}><Icon className="w-3 h-3" /> {t.status}</Badge>
    } },
    { key: 'created_at', header: 'Date', sortable: true, render: (t) => <span className="text-os-muted text-xs">{formatDateTime(t.created_at)}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Transfers"
        description="Move stock between warehouses. Every transfer is logged and decrements the source."
        icon={ArrowLeftRight}
        actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> New transfer</Button>}
      />

      <Card>
        <DataTable columns={columns} data={data.transfers} pageSize={10} initialSort={{ key: 'created_at', dir: 'desc' }} emptyTitle="No transfers yet" emptyDescription="Create your first inter-warehouse transfer." />
      </Card>

      {open && <TransferForm onClose={() => setOpen(false)} onApply={async (p) => {
        try { await transferStock(p.productId, p.qty, p.fromWh, p.toWh); toast('Transfer completed', 'success'); setOpen(false) }
        catch (err) { toast(err.message || 'Transfer failed', 'danger') }
      }} />}
    </div>
  )
}

function TransferForm({ onClose, onApply }) {
  const { data } = useData()
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState(1)
  const [fromWh, setFromWh] = useState('')
  const [toWh, setToWh] = useState('')

  const product = data.products.find((p) => p.id === productId)
  const available = product ? Number(product.quantity) : 0

  const apply = () => {
    const q = parseInt(qty, 10)
    if (!productId) { toast('Select a product', 'danger'); return }
    if (!fromWh || !toWh) { toast('Select both warehouses', 'danger'); return }
    if (fromWh === toWh) { toast('Warehouses must differ', 'danger'); return }
    if (Number.isNaN(q) || q <= 0) { toast('Enter a valid quantity', 'danger'); return }
    if (q > available) { toast(`Only ${available} units available`, 'danger'); return }
    onApply({ productId, qty: q, fromWh, toWh })
  }

  return (
    <Modal open onClose={onClose} title="New stock transfer" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={apply}>Transfer</Button></>}>
      <div className="space-y-4">
        <Field label="Product"><Select value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">Select…</option>{data.products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku}) · {p.quantity} in stock</option>)}</Select></Field>
        {product && (
          <p className="text-xs text-os-muted">Available at <span className="text-os-text font-medium">{product.warehouse_name}</span>: {available} units</p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="From warehouse"><Select value={fromWh} onChange={(e) => setFromWh(e.target.value)}><option value="">Select…</option>{data.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select></Field>
          <Field label="To warehouse"><Select value={toWh} onChange={(e) => setToWh(e.target.value)}><option value="">Select…</option>{data.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select></Field>
        </div>
        <Field label="Quantity to transfer"><Input type="number" min="1" max={available} value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
      </div>
    </Modal>
  )
}
