import { useState, useMemo } from 'react'
import { Truck, Plus, Pencil, Trash2, Mail, Phone, MapPin, User, Package } from 'lucide-react'
import { useData } from '../context/DataContext'
import { PageHeader, Card, Button, Badge, Modal, Field, Input, Textarea, ConfirmDialog, EmptyState, toast } from '../components/ui'
import { formatNumber } from '../lib/format'

export function Suppliers() {
  const { data, create, update, remove } = useData()
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const productCounts = useMemo(() => {
    const m = new Map()
    data.products.forEach((p) => m.set(p.supplier_id, (m.get(p.supplier_id) || 0) + 1))
    return m
  }, [data.products])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage vendor relationships. Each supplier card shows live product count."
        icon={Truck}
        actions={<Button size="sm" onClick={() => setEditing('new')}><Plus className="w-4 h-4" /> New supplier</Button>}
      />

      {data.suppliers.length === 0 ? (
        <Card><EmptyState title="No suppliers" description="Add a supplier to start sourcing products." action={<Button onClick={() => setEditing('new')}>Add supplier</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.suppliers.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-os-info/10 text-os-info flex items-center justify-center"><Truck className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-semibold text-os-text">{s.name}</h3>
                    <p className="text-xs text-os-muted inline-flex items-center gap-1"><User className="w-3 h-3" /> {s.contact_person}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(s)} className="os-btn-ghost p-1.5 rounded-md hover:text-os-accent"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setConfirmDelete(s)} className="os-btn-ghost p-1.5 rounded-md hover:text-os-danger"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                <p className="text-os-muted inline-flex items-center gap-2"><Mail className="w-4 h-4" /> {s.email}</p>
                <p className="text-os-muted inline-flex items-center gap-2"><Phone className="w-4 h-4" /> {s.phone}</p>
                <p className="text-os-muted inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> {s.address}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-os-border flex items-center justify-between">
                <span className="text-xs text-os-muted inline-flex items-center gap-1.5"><Package className="w-4 h-4" /> Products supplied</span>
                <Badge tone="accent">{formatNumber(productCounts.get(s.id) || 0)}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <SupplierForm supplier={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSave={async (v) => {
          try {
            if (editing === 'new') { await create('suppliers', v); toast('Supplier created', 'success') }
            else { await update('suppliers', editing.id, v); toast('Supplier updated', 'success') }
            setEditing(null)
          } catch (err) { toast(err.message || 'Save failed', 'danger') }
        }} />
      )}

      <ConfirmDialog open={!!confirmDelete} danger title="Delete supplier" message={`Delete "${confirmDelete?.name}"?`} confirmText="Delete" onCancel={() => setConfirmDelete(null)} onConfirm={async () => { try { await remove('suppliers', confirmDelete.id); toast('Supplier deleted', 'info') } catch (err) { toast(err.message, 'danger') } finally { setConfirmDelete(null) } }} />
    </div>
  )
}

function SupplierForm({ supplier, onClose, onSave }) {
  const [form, setForm] = useState({
    name: supplier?.name || '', email: supplier?.email || '', phone: supplier?.phone || '',
    address: supplier?.address || '', contact_person: supplier?.contact_person || '',
  })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  return (
    <Modal open onClose={onClose} title={supplier ? `Edit · ${supplier.name}` : 'New supplier'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>{supplier ? 'Save' : 'Create'}</Button></>}>
      <div className="space-y-4">
        <Field label="Supplier name"><Input value={form.name} onChange={set('name')} /></Field>
        <Field label="Contact person"><Input value={form.contact_person} onChange={set('contact_person')} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={set('phone')} /></Field>
        </div>
        <Field label="Address"><Textarea rows={2} value={form.address} onChange={set('address')} /></Field>
      </div>
    </Modal>
  )
}
