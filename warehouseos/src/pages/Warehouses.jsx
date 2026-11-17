import { useState, useMemo } from 'react'
import { Warehouse as WHIcon, Plus, Pencil, Trash2, MapPin, Boxes, Layers } from 'lucide-react'
import { useData } from '../context/DataContext'
import { PageHeader, Card, CardHeader, Button, Badge, Modal, Field, Input, Textarea, Select, ConfirmDialog, EmptyState, toast } from '../components/ui'
import { formatNumber, classNames } from '../lib/format'

export function Warehouses() {
  const { data, create, update, remove } = useData()
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const stats = useMemo(() => {
    const map = new Map()
    data.warehouses.forEach((w) => {
      const locs = data.storageLocations.filter((l) => l.warehouse_id === w.id)
      const cap = locs.reduce((s, l) => s + (Number(l.capacity) || 0), 0)
      const occ = locs.reduce((s, l) => s + (Number(l.occupied) || 0), 0)
      const zones = data.zones.filter((z) => z.warehouse_id === w.id)
      const products = data.products.filter((p) => p.warehouse_id === w.id).length
      map.set(w.id, { locs: locs.length, cap, occ, util: cap ? Math.round((occ / cap) * 100) : 0, zones: zones.length, products })
    })
    return map
  }, [data])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouses"
        description="Multiple warehouses, each modelled as Warehouse → Zone → Aisle → Rack → Shelf → Bin."
        icon={WHIcon}
        actions={<Button size="sm" onClick={() => setEditing('new')}><Plus className="w-4 h-4" /> New warehouse</Button>}
      />

      {data.warehouses.length === 0 ? (
        <Card><EmptyState title="No warehouses" description="Add your first warehouse to start storing inventory." action={<Button onClick={() => setEditing('new')}>Add warehouse</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.warehouses.map((w) => {
            const s = stats.get(w.id) || {}
            const utilTone = s.util >= 90 ? 'danger' : s.util >= 70 ? 'warning' : 'success'
            return (
              <Card key={w.id} className="p-5 flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-os-accent/10 text-os-accent flex items-center justify-center"><WHIcon className="w-5 h-5" /></div>
                    <div>
                      <h3 className="font-semibold text-os-text">{w.name}</h3>
                      <p className="text-xs text-os-muted font-mono">{w.code}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(w)} className="os-btn-ghost p-1.5 rounded-md hover:text-os-accent"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setConfirmDelete(w)} className="os-btn-ghost p-1.5 rounded-md hover:text-os-danger"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-sm text-os-muted mt-3">{w.address}</p>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-os-muted">Capacity utilization</span>
                    <Badge tone={utilTone}>{s.util}%</Badge>
                  </div>
                  <div className="h-2 rounded-full bg-os-bg overflow-hidden">
                    <div className={classNames('h-full rounded-full transition-all', utilBar(utilTone))} style={{ width: `${Math.min(100, s.util)}%` }} />
                  </div>
                  <p className="text-xs text-os-muted mt-1">{formatNumber(s.occ)} / {formatNumber(s.cap)} units</p>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-os-border">
                  <Stat icon={Layers} label="Zones" value={s.zones} />
                  <Stat icon={MapPin} label="Locations" value={s.locs} />
                  <Stat icon={Boxes} label="Products" value={s.products} />
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {editing && (
        <WarehouseForm
          warehouse={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (values) => {
            try {
              if (editing === 'new') { await create('warehouses', values); toast('Warehouse created', 'success') }
              else { await update('warehouses', editing.id, values); toast('Warehouse updated', 'success') }
              setEditing(null)
            } catch (err) { toast(err.message || 'Save failed', 'danger') }
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        danger
        title="Delete warehouse"
        message={`Delete "${confirmDelete?.name}"? Storage locations inside it remain and should be reassigned.`}
        confirmText="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => { try { await remove('warehouses', confirmDelete.id); toast('Warehouse deleted', 'info') } catch (err) { toast(err.message, 'danger') } finally { setConfirmDelete(null) } }}
      />
    </div>
  )
}

function utilBar(tone) {
  return { success: 'bg-os-success', warning: 'bg-os-warning', danger: 'bg-os-danger' }[tone]
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="text-center">
      <Icon className="w-4 h-4 text-os-muted mx-auto mb-1" />
      <p className="font-semibold text-os-text tabular-nums">{value}</p>
      <p className="text-[10px] text-os-muted uppercase tracking-wide">{label}</p>
    </div>
  )
}

function WarehouseForm({ warehouse, onClose, onSave }) {
  const { data } = useData()
  const [form, setForm] = useState({
    name: warehouse?.name || '',
    code: warehouse?.code || `WH-${String(data.warehouses.length + 1).padStart(2, '0')}`,
    address: warehouse?.address || '',
    capacity: warehouse?.capacity || 10000,
  })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <Modal
      open onClose={onClose}
      title={warehouse ? `Edit · ${warehouse.name}` : 'New warehouse'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave({ ...form, capacity: Number(form.capacity) || 0 })}>{warehouse ? 'Save' : 'Create'}</Button></>}
    >
      <div className="space-y-4">
        <Field label="Warehouse name"><Input value={form.name} onChange={set('name')} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Code"><Input value={form.code} onChange={set('code')} /></Field>
          <Field label="Capacity (units)"><Input type="number" min="0" value={form.capacity} onChange={set('capacity')} /></Field>
        </div>
        <Field label="Address"><Textarea rows={2} value={form.address} onChange={set('address')} /></Field>
      </div>
    </Modal>
  )
}

