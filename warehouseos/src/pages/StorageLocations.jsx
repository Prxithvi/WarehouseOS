import { useState, useMemo } from 'react'
import { MapPin, Plus, Pencil, Trash2, Grid3x3, List } from 'lucide-react'
import { useData } from '../context/DataContext'
import { PageHeader, Card, Button, Badge, Modal, Field, Input, Select, ConfirmDialog, EmptyState, toast } from '../components/ui'
import { formatNumber, classNames } from '../lib/format'

function locState(loc) {
  if (loc.status !== 'active') return { key: 'inactive', label: 'Inactive', color: 'bg-os-muted', ring: 'border-os-border', dot: 'bg-os-muted' }
  const util = loc.capacity ? (loc.occupied / loc.capacity) * 100 : 0
  if (util >= 90) return { key: 'full', label: 'Full', color: 'bg-os-danger/15', ring: 'border-os-danger/40', dot: 'bg-os-danger' }
  if (util >= 50) return { key: 'partial', label: 'Partial', color: 'bg-os-warning/15', ring: 'border-os-warning/40', dot: 'bg-os-warning' }
  return { key: 'available', label: 'Available', color: 'bg-os-success/15', ring: 'border-os-success/40', dot: 'bg-os-success' }
}

export function StorageLocations() {
  const { data, create, update, remove } = useData()
  const [warehouse, setWarehouse] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [view, setView] = useState('grid')
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const whName = (id) => data.warehouses.find((w) => w.id === id)?.name || '—'

  const filtered = useMemo(() => {
    return data.storageLocations.filter((l) => {
      if (warehouse && l.warehouse_id !== warehouse) return false
      if (stateFilter && locState(l).key !== stateFilter) return false
      return true
    })
  }, [data.storageLocations, warehouse, stateFilter])

  const counts = useMemo(() => {
    const c = { available: 0, partial: 0, full: 0, inactive: 0 }
    data.storageLocations.forEach((l) => { c[locState(l).key]++ })
    return c
  }, [data.storageLocations])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Storage Locations"
        description="Bin-level capacity with live colour indicators across the Warehouse → Zone → Aisle → Rack → Shelf → Bin hierarchy."
        icon={MapPin}
        actions={
          <>
            <div className="flex rounded-lg border border-os-border overflow-hidden">
              <button onClick={() => setView('grid')} className={classNames('p-2', view === 'grid' ? 'bg-os-accent/10 text-os-accent' : 'text-os-muted')}><Grid3x3 className="w-4 h-4" /></button>
              <button onClick={() => setView('list')} className={classNames('p-2', view === 'list' ? 'bg-os-accent/10 text-os-accent' : 'text-os-muted')}><List className="w-4 h-4" /></button>
            </div>
            <Button size="sm" onClick={() => setEditing('new')}><Plus className="w-4 h-4" /> New location</Button>
          </>
        }
      />

      {/* Legend */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <LegendItem color="bg-os-success" label="Available" count={counts.available} />
          <LegendItem color="bg-os-warning" label="Partially occupied" count={counts.partial} />
          <LegendItem color="bg-os-danger" label="Full" count={counts.full} />
          <LegendItem color="bg-os-muted" label="Inactive" count={counts.inactive} />
          <div className="ml-auto flex gap-2">
            <Select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="w-auto">
              <option value="">All warehouses</option>
              {data.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
            <Select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="w-auto">
              <option value="">All states</option>
              <option value="available">Available</option>
              <option value="partial">Partial</option>
              <option value="full">Full</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card><EmptyState title="No storage locations" description="Add bins, shelves and racks to model your warehouse layout." action={<Button onClick={() => setEditing('new')}>Add location</Button>} /></Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((l) => {
            const st = locState(l)
            const util = l.capacity ? Math.round((l.occupied / l.capacity) * 100) : 0
            return (
              <button key={l.id} onClick={() => setEditing(l)} className={classNames('text-left p-4 rounded-xl border bg-os-card transition hover:scale-[1.02]', st.ring)}>
                <div className="flex items-center justify-between">
                  <span className={classNames('w-2.5 h-2.5 rounded-full', st.dot)} />
                  <Badge tone="muted">{st.label}</Badge>
                </div>
                <p className="font-mono text-sm font-semibold text-os-text mt-2">{l.code}</p>
                <p className="text-[11px] text-os-muted mt-1 leading-tight">{l.path}</p>
                <div className="mt-3">
                  <div className="h-1.5 rounded-full bg-os-bg overflow-hidden">
                    <div className={classNames('h-full', st.dot)} style={{ width: `${Math.min(100, util)}%` }} />
                  </div>
                  <p className="text-[11px] text-os-muted mt-1">{formatNumber(l.occupied)} / {formatNumber(l.capacity)} · {util}%</p>
                </div>
                <p className="text-[10px] text-os-muted/70 mt-1">{whName(l.warehouse_id)}</p>
              </button>
            )
          })}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-os-border text-xs text-os-muted uppercase">
                <th className="px-4 py-3 text-left">Code</th><th className="px-4 py-3 text-left">Path</th>
                <th className="px-4 py-3 text-left">Warehouse</th><th className="px-4 py-3 text-right">Occupied</th>
                <th className="px-4 py-3 text-right">Capacity</th><th className="px-4 py-3 text-center">State</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody>
                {filtered.map((l) => {
                  const st = locState(l)
                  return (
                    <tr key={l.id} className="border-b border-os-border/60">
                      <td className="px-4 py-3 font-mono">{l.code}</td>
                      <td className="px-4 py-3 text-os-muted">{l.path}</td>
                      <td className="px-4 py-3 text-os-muted">{whName(l.warehouse_id)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{l.occupied}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{l.capacity}</td>
                      <td className="px-4 py-3 text-center"><Badge tone={st.key === 'full' ? 'danger' : st.key === 'partial' ? 'warning' : st.key === 'available' ? 'success' : 'muted'}>{st.label}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setEditing(l)} className="os-btn-ghost p-1.5 rounded-md hover:text-os-accent"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmDelete(l)} className="os-btn-ghost p-1.5 rounded-md hover:text-os-danger"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {editing && (
        <LocationForm
          location={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (values) => {
            try {
              if (editing === 'new') { await create('storageLocations', values); toast('Location created', 'success') }
              else { await update('storageLocations', editing.id, values); toast('Location updated', 'success') }
              setEditing(null)
            } catch (err) { toast(err.message || 'Save failed', 'danger') }
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete} danger title="Delete location"
        message={`Delete "${confirmDelete?.code}"?`}
        confirmText="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => { try { await remove('storageLocations', confirmDelete.id); toast('Location deleted', 'info') } catch (err) { toast(err.message, 'danger') } finally { setConfirmDelete(null) } }}
      />
    </div>
  )
}

function LegendItem({ color, label, count }) {
  return (
    <div className="flex items-center gap-2">
      <span className={classNames('w-3 h-3 rounded-full', color)} />
      <span className="text-xs text-os-muted">{label}</span>
      <Badge tone="muted">{count}</Badge>
    </div>
  )
}

function LocationForm({ location, onClose, onSave }) {
  const { data } = useData()
  const [form, setForm] = useState({
    warehouse_id: location?.warehouse_id || data.warehouses[0]?.id || '',
    zone_id: location?.zone_id || '',
    code: location?.code || '',
    path: location?.path || '',
    aisle: location?.aisle || 'Aisle 1',
    rack: location?.rack || 'R1',
    shelf: location?.shelf || 'S1',
    bin: location?.bin || 'B1',
    capacity: location?.capacity || 100,
    occupied: location?.occupied ?? 0,
    status: location?.status || 'active',
  })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const zones = data.zones.filter((z) => z.warehouse_id === form.warehouse_id)
  const wh = data.warehouses.find((w) => w.id === form.warehouse_id)

  const buildPath = () => {
    const zone = data.zones.find((z) => z.id === form.zone_id)?.code || wh?.code || ''
    return `${zone} > ${form.aisle} > ${form.rack} > ${form.shelf} > ${form.bin}`
  }

  return (
    <Modal
      open onClose={onClose}
      title={location ? `Edit · ${location.code}` : 'New storage location'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave({ ...form, capacity: Number(form.capacity), occupied: Number(form.occupied), path: form.path || buildPath() })}>{location ? 'Save' : 'Create'}</Button></>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Warehouse"><Select value={form.warehouse_id} onChange={set('warehouse_id')}>{data.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select></Field>
          <Field label="Zone"><Select value={form.zone_id} onChange={set('zone_id')}><option value="">—</option>{zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</Select></Field>
        </div>
        <Field label="Code"><Input value={form.code} onChange={set('code')} placeholder="e.g. NH-A-1-R1-S1-B1" /></Field>
        <div className="grid grid-cols-4 gap-3">
          <Field label="Aisle"><Input value={form.aisle} onChange={set('aisle')} /></Field>
          <Field label="Rack"><Input value={form.rack} onChange={set('rack')} /></Field>
          <Field label="Shelf"><Input value={form.shelf} onChange={set('shelf')} /></Field>
          <Field label="Bin"><Input value={form.bin} onChange={set('bin')} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Capacity"><Input type="number" min="0" value={form.capacity} onChange={set('capacity')} /></Field>
          <Field label="Occupied"><Input type="number" min="0" value={form.occupied} onChange={set('occupied')} /></Field>
          <Field label="Status"><Select value={form.status} onChange={set('status')}><option value="active">Active</option><option value="inactive">Inactive</option></Select></Field>
        </div>
        <Field label="Hierarchy path"><Input value={form.path || buildPath()} onChange={set('path')} readOnly={false} /></Field>
        <p className="text-xs text-os-muted">Path auto-built as <span className="font-mono">Zone &gt; Aisle &gt; Rack &gt; Shelf &gt; Bin</span> — edit if needed.</p>
      </div>
    </Modal>
  )
}
