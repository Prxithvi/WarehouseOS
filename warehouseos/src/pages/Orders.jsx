import { useState, useMemo } from 'react'
import { ShoppingCart, Plus, Trash2, Eye, ChevronRight, Package } from 'lucide-react'
import { useData } from '../context/DataContext'
import { PageHeader, Card, Button, Badge, Modal, Field, Input, Select, EmptyState, toast } from '../components/ui'
import { DataTable } from '../components/DataTable'
import { formatCurrency, formatDateTime, classNames } from '../lib/format'

const STATUS_FLOW = ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered']
const statusTone = {
  Pending: 'warning', Processing: 'info', Packed: 'accent', Shipped: 'info', Delivered: 'success', Cancelled: 'danger',
}

export function Orders() {
  const { data, createOrder, updateOrderStatus } = useData()
  const [creating, setCreating] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [filter, setFilter] = useState('')

  const filtered = useMemo(() => filter ? data.orders.filter((o) => o.status === filter) : data.orders, [data.orders, filter])

  const columns = [
    { key: 'order_number', header: 'Order', sortable: true, render: (o) => <span className="font-mono font-medium">{o.order_number}</span> },
    { key: 'customer_name', header: 'Customer', sortable: true },
    { key: 'items', header: 'Items', align: 'center', render: (o) => <Badge tone="muted">{o.items?.length || 0}</Badge> },
    { key: 'total', header: 'Total', align: 'right', sortable: true, render: (o) => formatCurrency(o.total) },
    { key: 'status', header: 'Status', align: 'center', render: (o) => <Badge tone={statusTone[o.status]}>{o.status}</Badge> },
    { key: 'created_at', header: 'Created', sortable: true, render: (o) => <span className="text-os-muted text-xs">{formatDateTime(o.created_at)}</span> },
    { key: '_actions', header: '', align: 'right', width: '1%', render: (o) => (
      <button onClick={() => setViewing(o)} className="os-btn-ghost p-1.5 rounded-md hover:text-os-accent"><Eye className="w-4 h-4" /></button>
    ) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Create orders, reserve stock on creation, advance them through the fulfilment pipeline."
        icon={ShoppingCart}
        actions={<Button size="sm" onClick={() => setCreating(true)}><Plus className="w-4 h-4" /> New order</Button>}
      />

      <Card className="p-3">
        <div className="flex gap-2 flex-wrap">
          {['', ...STATUS_FLOW, 'Cancelled'].map((s) => (
            <button key={s || 'all'} onClick={() => setFilter(s)} className={classNames('px-3 py-1.5 rounded-lg text-xs font-medium transition', filter === s ? 'bg-os-accent/10 text-os-accent' : 'text-os-muted hover:bg-os-bg')}>
              {s || 'All'} <span className="opacity-60">({s ? data.orders.filter((o) => o.status === s).length : data.orders.length})</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <DataTable columns={columns} data={filtered} pageSize={10} initialSort={{ key: 'created_at', dir: 'desc' }} emptyTitle="No orders" emptyDescription="Create an order to start fulfilling." />
      </Card>

      {creating && <OrderForm onClose={() => setCreating(false)} onCreate={async (payload) => {
        try { await createOrder(payload); toast('Order created — stock reserved', 'success'); setCreating(false) }
        catch (err) { toast(err.message || 'Failed to create order', 'danger') }
      }} />}

      {viewing && <OrderDetail order={viewing} onClose={() => setViewing(null)} onAdvance={async (status) => {
        try { await updateOrderStatus(viewing.id, status); toast(`Order ${status.toLowerCase()}`, 'success'); setViewing(null) }
        catch (err) { toast(err.message, 'danger') }
      }} />}
    </div>
  )
}

function OrderForm({ onClose, onCreate }) {
  const { data } = useData()
  const [customer, setCustomer] = useState('')
  const [items, setItems] = useState([])
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState(1)

  const total = items.reduce((s, it) => s + it.line_total, 0)

  const addItem = () => {
    const p = data.products.find((x) => x.id === productId)
    if (!p) { toast('Select a product', 'danger'); return }
    const q = parseInt(qty, 10)
    if (Number.isNaN(q) || q <= 0) { toast('Enter a valid quantity', 'danger'); return }
    const available = Number(p.quantity) - Number(p.reserved || 0)
    if (q > available) { toast(`Only ${available} available for ${p.name}`, 'warning') }
    setItems((cur) => [...cur, { product_id: p.id, name: p.name, sku: p.sku, quantity: q, price: p.selling_price, line_total: q * p.selling_price }])
    setProductId(''); setQty(1)
  }

  const create = () => {
    if (!customer.trim()) { toast('Enter customer name', 'danger'); return }
    if (items.length === 0) { toast('Add at least one item', 'danger'); return }
    onCreate({ customer_name: customer.trim(), items })
  }

  return (
    <Modal open onClose={onClose} title="New order" size="lg" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={create}>Create order · {formatCurrency(total)}</Button></>}>
      <div className="space-y-4">
        <Field label="Customer name"><Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="e.g. Retailo Mart" /></Field>

        <div className="rounded-lg border border-os-border p-3 bg-os-bg/50">
          <p className="text-xs font-medium text-os-muted mb-2">Add line item</p>
          <div className="flex gap-2">
            <Select value={productId} onChange={(e) => setProductId(e.target.value)} className="flex-1"><option value="">Select product…</option>{data.products.map((p) => <option key={p.id} value={p.id}>{p.name} · {formatCurrency(p.selling_price)} · {p.quantity} in stock</option>)}</Select>
            <Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className="w-24" />
            <Button variant="secondary" onClick={addItem}><Plus className="w-4 h-4" /></Button>
          </div>
        </div>

        {items.length > 0 && (
          <div className="rounded-lg border border-os-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-os-bg text-xs text-os-muted uppercase"><th className="px-3 py-2 text-left">Product</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Price</th><th className="px-3 py-2 text-right">Total</th><th></th></tr></thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-t border-os-border/60">
                    <td className="px-3 py-2"><div className="font-medium">{it.name}</div><div className="text-xs text-os-muted font-mono">{it.sku}</div></td>
                    <td className="px-3 py-2 text-right tabular-nums">{it.quantity}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(it.price)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(it.line_total)}</td>
                    <td className="px-3 py-2 text-right"><button onClick={() => setItems((c) => c.filter((_, idx) => idx !== i))} className="os-btn-ghost p-1 rounded hover:text-os-danger"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="border-t border-os-border bg-os-bg/50"><td colSpan={3} className="px-3 py-2 text-right text-xs text-os-muted uppercase">Total</td><td className="px-3 py-2 text-right font-bold tabular-nums">{formatCurrency(total)}</td><td></td></tr></tfoot>
            </table>
          </div>
        )}
        <p className="text-xs text-os-muted">Stock is reserved when the order is created and released if it is later cancelled. Delivery commits the sale and decrements on-hand stock.</p>
      </div>
    </Modal>
  )
}

function OrderDetail({ order, onClose, onAdvance }) {
  const currentIdx = STATUS_FLOW.indexOf(order.status)
  const canAdvance = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
  const nextStatus = canAdvance ? STATUS_FLOW[currentIdx + 1] : null
  const canCancel = order.status !== 'Delivered' && order.status !== 'Cancelled'

  return (
    <Modal open onClose={onClose} title={`${order.order_number}`} size="lg" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Close</Button>
        {canCancel && <Button variant="danger" onClick={() => onAdvance('Cancelled')}>Cancel order</Button>}
        {canAdvance && <Button onClick={() => onAdvance(nextStatus)}>Advance to {nextStatus} <ChevronRight className="w-4 h-4" /></Button>}
      </>
    }>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={statusTone[order.status]}>{order.status}</Badge>
          <span className="text-sm text-os-muted">{order.customer_name}</span>
          <span className="text-xs text-os-muted ml-auto">{formatDateTime(order.created_at)}</span>
        </div>

        {/* Status pipeline */}
        <div className="flex items-center gap-1">
          {STATUS_FLOW.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={classNames('flex-1 h-1.5 rounded-full', i <= currentIdx ? 'bg-os-accent' : 'bg-os-border')} />
              <span className={classNames('text-[10px] whitespace-nowrap', i <= currentIdx ? 'text-os-accent font-medium' : 'text-os-muted')}>{s}</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-os-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-os-bg text-xs text-os-muted uppercase"><th className="px-3 py-2 text-left">Product</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Price</th><th className="px-3 py-2 text-right">Total</th></tr></thead>
            <tbody>
              {order.items?.map((it, i) => (
                <tr key={i} className="border-t border-os-border/60">
                  <td className="px-3 py-2"><div className="font-medium">{it.name}</div><div className="text-xs text-os-muted font-mono">{it.sku}</div></td>
                  <td className="px-3 py-2 text-right tabular-nums">{it.quantity}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(it.price)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(it.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-os-bg">
          <span className="text-sm text-os-muted inline-flex items-center gap-2"><Package className="w-4 h-4" /> {order.items?.length || 0} line items</span>
          <span className="text-lg font-bold tabular-nums">{formatCurrency(order.total)}</span>
        </div>
      </div>
    </Modal>
  )
}
