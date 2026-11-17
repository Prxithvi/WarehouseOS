import { useState, useMemo } from 'react'
import { FileText, Download, IndianRupee, AlertTriangle, TrendingUp, Warehouse as WHIcon, ShoppingCart, History } from 'lucide-react'
import { useData } from '../context/DataContext'
import { PageHeader, Card, CardHeader, Button, Select, Badge } from '../components/ui'
import { DataTable } from '../components/DataTable'
import { formatCurrency, formatNumber, formatDate, formatDateTime, stockStatus, inventoryValue } from '../lib/format'
import { downloadCSV } from '../lib/csv'

const REPORTS = [
  { id: 'valuation', label: 'Inventory valuation', icon: IndianRupee },
  { id: 'lowstock', label: 'Low stock report', icon: AlertTriangle },
  { id: 'overstock', label: 'Overstock report', icon: TrendingUp },
  { id: 'utilization', label: 'Warehouse utilization', icon: WHIcon },
  { id: 'orders', label: 'Order history', icon: ShoppingCart },
  { id: 'transactions', label: 'Stock transactions', icon: History },
]

export function Reports() {
  const { data } = useData()
  const [report, setReport] = useState('valuation')

  const { rows, columns, exportCols } = useMemo(() => build(report, data), [report, data])

  const exportCsv = () => {
    downloadCSV(`${report}-report.csv`, rows, exportCols)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and export structured warehouse reports as CSV."
        icon={FileText}
        actions={<Button size="sm" onClick={exportCsv}><Download className="w-4 h-4" /> Export CSV</Button>}
      />

      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          {REPORTS.map((r) => (
            <button key={r.id} onClick={() => setReport(r.id)} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${report === r.id ? 'bg-os-accent/10 text-os-accent border-os-accent/40' : 'text-os-muted border-os-border hover:bg-os-bg'}`}>
              <r.icon className="w-4 h-4" /> {r.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title={REPORTS.find((r) => r.id === report)?.label} subtitle={`${rows.length} rows`} />
        <DataTable columns={columns} data={rows} pageSize={12} emptyTitle="No rows" />
      </Card>
    </div>
  )
}

function build(report, data) {
  switch (report) {
    case 'valuation': {
      const rows = data.products.map((p) => ({
        name: p.name, sku: p.sku, category: p.category_name, quantity: p.quantity,
        unit_cost: p.purchase_price, value: inventoryValue(p),
      })).sort((a, b) => b.value - a.value)
      return {
        rows,
        exportCols: [{ key: 'name', label: 'Name' }, { key: 'sku', label: 'SKU' }, { key: 'category', label: 'Category' }, { key: 'quantity', label: 'Qty' }, { key: 'unit_cost', label: 'Unit Cost' }, { key: 'value', label: 'Value' }],
        columns: [
          { key: 'name', header: 'Product', sortable: true, render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-os-muted font-mono">{r.sku}</div></div> },
          { key: 'category', header: 'Category', sortable: true },
          { key: 'quantity', header: 'Qty', align: 'right', sortable: true },
          { key: 'unit_cost', header: 'Unit cost', align: 'right', render: (r) => formatCurrency(r.unit_cost) },
          { key: 'value', header: 'Value', align: 'right', sortable: true, render: (r) => <span className="font-semibold">{formatCurrency(r.value)}</span> },
        ],
      }
    }
    case 'lowstock': {
      const rows = data.products.filter((p) => { const k = stockStatus(p).key; return k === 'low_stock' || k === 'out_of_stock' }).map((p) => ({ ...p, status: stockStatus(p).label }))
      return {
        rows,
        exportCols: [{ key: 'name', label: 'Name' }, { key: 'sku', label: 'SKU' }, { key: 'quantity', label: 'Qty' }, { key: 'min_stock', label: 'Min' }, { key: 'warehouse_name', label: 'Warehouse' }, { key: 'status', label: 'Status' }],
        columns: [
          { key: 'name', header: 'Product', sortable: true, render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-os-muted font-mono">{r.sku}</div></div> },
          { key: 'warehouse_name', header: 'Warehouse' },
          { key: 'quantity', header: 'Qty', align: 'right', sortable: true },
          { key: 'min_stock', header: 'Min', align: 'right' },
          { key: 'status', header: 'Status', align: 'center', render: (r) => <Badge tone={r.quantity <= 0 ? 'danger' : 'warning'}>{r.status}</Badge> },
        ],
      }
    }
    case 'overstock': {
      const rows = data.products.filter((p) => stockStatus(p).key === 'overstock')
      return {
        rows,
        exportCols: [{ key: 'name', label: 'Name' }, { key: 'sku', label: 'SKU' }, { key: 'quantity', label: 'Qty' }, { key: 'max_stock', label: 'Max' }, { key: 'warehouse_name', label: 'Warehouse' }],
        columns: [
          { key: 'name', header: 'Product', sortable: true, render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-os-muted font-mono">{r.sku}</div></div> },
          { key: 'warehouse_name', header: 'Warehouse' },
          { key: 'quantity', header: 'Qty', align: 'right', sortable: true },
          { key: 'max_stock', header: 'Max', align: 'right' },
        ],
      }
    }
    case 'utilization': {
      const rows = data.warehouses.map((w) => {
        const locs = data.storageLocations.filter((l) => l.warehouse_id === w.id)
        const cap = locs.reduce((s, l) => s + Number(l.capacity || 0), 0)
        const occ = locs.reduce((s, l) => s + Number(l.occupied || 0), 0)
        return { name: w.name, code: w.code, locations: locs.length, capacity: cap, occupied: occ, utilization: cap ? Math.round((occ / cap) * 100) : 0 }
      })
      return {
        rows,
        exportCols: [{ key: 'name', label: 'Warehouse' }, { key: 'code', label: 'Code' }, { key: 'locations', label: 'Locations' }, { key: 'capacity', label: 'Capacity' }, { key: 'occupied', label: 'Occupied' }, { key: 'utilization', label: 'Utilization %' }],
        columns: [
          { key: 'name', header: 'Warehouse', sortable: true, render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-os-muted font-mono">{r.code}</div></div> },
          { key: 'locations', header: 'Locations', align: 'right' },
          { key: 'occupied', header: 'Occupied', align: 'right', sortable: true, render: (r) => formatNumber(r.occupied) },
          { key: 'capacity', header: 'Capacity', align: 'right', render: (r) => formatNumber(r.capacity) },
          { key: 'utilization', header: 'Utilization', align: 'right', sortable: true, render: (r) => <Badge tone={r.utilization >= 90 ? 'danger' : r.utilization >= 70 ? 'warning' : 'success'}>{r.utilization}%</Badge> },
        ],
      }
    }
    case 'orders': {
      const rows = data.orders.map((o) => ({ ...o, items_count: o.items?.length || 0 }))
      return {
        rows,
        exportCols: [{ key: 'order_number', label: 'Order' }, { key: 'customer_name', label: 'Customer' }, { key: 'items_count', label: 'Items' }, { key: 'total', label: 'Total' }, { key: 'status', label: 'Status' }, { key: 'created_at', label: 'Created' }],
        columns: [
          { key: 'order_number', header: 'Order', sortable: true, render: (r) => <span className="font-mono">{r.order_number}</span> },
          { key: 'customer_name', header: 'Customer', sortable: true },
          { key: 'items_count', header: 'Items', align: 'center' },
          { key: 'total', header: 'Total', align: 'right', sortable: true, render: (r) => formatCurrency(r.total) },
          { key: 'status', header: 'Status', align: 'center', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
          { key: 'created_at', header: 'Date', sortable: true, render: (r) => <span className="text-xs text-os-muted">{formatDateTime(r.created_at)}</span> },
        ],
      }
    }
    case 'transactions': {
      const rows = data.transactions
      return {
        rows,
        exportCols: [{ key: 'product_name', label: 'Product' }, { key: 'sku', label: 'SKU' }, { key: 'type', label: 'Type' }, { key: 'quantity', label: 'Qty' }, { key: 'warehouse_name', label: 'Warehouse' }, { key: 'note', label: 'Note' }, { key: 'timestamp', label: 'Timestamp' }],
        columns: [
          { key: 'product_name', header: 'Product', sortable: true, render: (r) => <div><div className="font-medium">{r.product_name}</div><div className="text-xs text-os-muted font-mono">{r.sku}</div></div> },
          { key: 'type', header: 'Type', align: 'center', render: (r) => <Badge tone={txTone(r.type)}>{r.type}</Badge> },
          { key: 'quantity', header: 'Qty', align: 'right', sortable: true },
          { key: 'warehouse_name', header: 'Warehouse' },
          { key: 'note', header: 'Note', render: (r) => <span className="text-xs text-os-muted">{r.note}</span> },
          { key: 'timestamp', header: 'When', sortable: true, render: (r) => <span className="text-xs text-os-muted">{formatDateTime(r.timestamp)}</span> },
        ],
      }
    }
    default: return { rows: [], columns: [], exportCols: [] }
  }
}

function statusTone(s) {
  return { Pending: 'warning', Processing: 'info', Packed: 'accent', Shipped: 'info', Delivered: 'success', Cancelled: 'danger' }[s] || 'muted'
}
function txTone(t) {
  return { add: 'success', remove: 'danger', update: 'info', reserve: 'warning', release: 'accent', transfer: 'info' }[t] || 'muted'
}
