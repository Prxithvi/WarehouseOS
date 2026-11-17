import { useState, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, Plus, Pencil, Trash2, Search, Upload, ImageIcon } from 'lucide-react'
import { useData } from '../context/DataContext'
import { PageHeader, Card, Button, Badge, Modal, Field, Input, Textarea, Select, ConfirmDialog, EmptyState, toast } from '../components/ui'
import { DataTable } from '../components/DataTable'
import { formatCurrency, stockStatus, classNames } from '../lib/format'

const schema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  description: z.string().optional(),
  category_id: z.string().min(1, 'Select a category'),
  brand: z.string().optional(),
  supplier_id: z.string().min(1, 'Select a supplier'),
  purchase_price: z.coerce.number().min(0, 'Must be ≥ 0'),
  selling_price: z.coerce.number().min(0, 'Must be ≥ 0'),
  quantity: z.coerce.number().min(0, 'Must be ≥ 0'),
  min_stock: z.coerce.number().min(0, 'Must be ≥ 0'),
  max_stock: z.coerce.number().min(0, 'Must be ≥ 0'),
  warehouse_id: z.string().min(1, 'Select a warehouse'),
  storage_location_id: z.string().min(1, 'Select a storage location'),
  expiry_date: z.string().optional(),
  image_url: z.string().optional(),
})

export function Products() {
  const { data, create, update, remove } = useData()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // product or 'new'
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data.products
    return data.products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q))
  }, [data.products, search])

  const columns = [
    {
      key: 'name', header: 'Product', sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <ProductThumb product={p} />
          <div className="min-w-0">
            <div className="font-medium text-os-text truncate">{p.name}</div>
            <div className="text-xs text-os-muted">{p.sku} · {p.brand}</div>
          </div>
        </div>
      ),
    },
    { key: 'category_name', header: 'Category', sortable: true, render: (p) => <Badge tone="accent">{p.category_name}</Badge> },
    { key: 'supplier_name', header: 'Supplier', render: (p) => <span className="text-os-muted">{p.supplier_name}</span> },
    { key: 'purchase_price', header: 'Purchase', align: 'right', sortable: true, render: (p) => formatCurrency(p.purchase_price) },
    { key: 'selling_price', header: 'Selling', align: 'right', sortable: true, render: (p) => formatCurrency(p.selling_price) },
    { key: 'quantity', header: 'Stock', align: 'right', sortable: true, render: (p) => <span className="font-semibold">{p.quantity}</span> },
    { key: '_status', header: 'Status', align: 'center', render: (p) => { const st = stockStatus(p); return <Badge tone={st.tone}>{st.label}</Badge> } },
    {
      key: '_actions', header: '', align: 'right', width: '1%',
      render: (p) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => setEditing(p)} className="os-btn-ghost p-1.5 rounded-md hover:text-os-accent" title="Edit"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => setConfirmDelete(p)} className="os-btn-ghost p-1.5 rounded-md hover:text-os-danger" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage the product catalogue. Every field is validated with React Hook Form + Zod."
        icon={Package}
        actions={<Button size="sm" onClick={() => setEditing('new')}><Plus className="w-4 h-4" /> New product</Button>}
      />

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-os-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="os-input pl-9" />
        </div>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={filtered}
          pageSize={10}
          initialSort={{ key: 'name', dir: 'asc' }}
          emptyTitle="No products"
          emptyDescription="Create your first product to get started."
        />
      </Card>

      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (values) => {
            const enriched = enrich(values, data)
            try {
              if (editing === 'new') {
                await create('products', enriched)
                toast('Product created', 'success')
              } else {
                await update('products', editing.id, enriched)
                toast('Product updated', 'success')
              }
              setEditing(null)
            } catch (err) {
              toast(err.message || 'Save failed', 'danger')
            }
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        danger
        title="Delete product"
        message={`Delete "${confirmDelete?.name}"? This cannot be undone.`}
        confirmText="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          try { await remove('products', confirmDelete.id); toast('Product deleted', 'info') }
          catch (err) { toast(err.message || 'Delete failed', 'danger') }
          finally { setConfirmDelete(null) }
        }}
      />
    </div>
  )
}

function enrich(values, data) {
  const cat = data.categories.find((c) => c.id === values.category_id)
  const sup = data.suppliers.find((s) => s.id === values.supplier_id)
  const wh = data.warehouses.find((w) => w.id === values.warehouse_id)
  const loc = data.storageLocations.find((l) => l.id === values.storage_location_id)
  return {
    ...values,
    barcode: values.barcode || '',
    description: values.description || '',
    brand: values.brand || '',
    image_url: values.image_url || '',
    reserved: 0,
    category_name: cat?.name || '—',
    supplier_name: sup?.name || '—',
    warehouse_name: wh?.name || '—',
    storage_location_code: loc?.code || '—',
  }
}

function ProductForm({ product, onClose, onSave }) {
  const { data } = useData()
  const fileRef = useRef(null)
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: product
      ? { ...product }
      : {
          name: '', sku: '', barcode: '', description: '', brand: '',
          category_id: '', supplier_id: '', purchase_price: 0, selling_price: 0,
          quantity: 0, min_stock: 10, max_stock: 100, warehouse_id: '', storage_location_id: '',
          expiry_date: '', image_url: '',
        },
  })

  const whId = watch('warehouse_id')
  const imageUrl = watch('image_url')
  const locations = data.storageLocations.filter((l) => l.warehouse_id === whId)

  const onImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 250_000) { toast('Image too large (>250KB). Use a URL instead.', 'warning'); return }
    const reader = new FileReader()
    reader.onload = () => setValue('image_url', reader.result, { shouldValidate: true })
    reader.readAsDataURL(file)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={product ? `Edit · ${product.name}` : 'New product'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit(onSave)} disabled={isSubmitting}>{product ? 'Save changes' : 'Create product'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSave)} className="space-y-4">
        {/* Image */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg bg-os-bg border border-os-border flex items-center justify-center overflow-hidden shrink-0">
            {imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-os-muted" />}
          </div>
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImage} />
            <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" /> Upload image</Button>
            <Input placeholder="…or paste image URL" {...register('image_url')} />
            <p className="text-xs text-os-muted">Images &lt;250KB are stored inline. Larger images should use a URL.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Product name" error={errors.name?.message}><Input {...register('name')} /></Field>
          <Field label="SKU" error={errors.sku?.message}><Input {...register('sku')} /></Field>
          <Field label="Barcode"><Input {...register('barcode')} /></Field>
          <Field label="Brand"><Input {...register('brand')} /></Field>
        </div>

        <Field label="Description"><Textarea rows={2} {...register('description')} /></Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Category" error={errors.category_id?.message}>
            <Select {...register('category_id')}><option value="">Select…</option>{data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
          </Field>
          <Field label="Supplier" error={errors.supplier_id?.message}>
            <Select {...register('supplier_id')}><option value="">Select…</option>{data.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Purchase price" error={errors.purchase_price?.message}><Input type="number" min="0" {...register('purchase_price')} /></Field>
          <Field label="Selling price" error={errors.selling_price?.message}><Input type="number" min="0" {...register('selling_price')} /></Field>
          <Field label="Quantity" error={errors.quantity?.message}><Input type="number" min="0" {...register('quantity')} /></Field>
          <Field label="Expiry date"><Input type="date" {...register('expiry_date')} /></Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Min stock" error={errors.min_stock?.message}><Input type="number" min="0" {...register('min_stock')} /></Field>
          <Field label="Max stock" error={errors.max_stock?.message}><Input type="number" min="0" {...register('max_stock')} /></Field>
          <Field label="Margin" hint="Auto-calculated">
            <Input value={marginText(watch)} readOnly />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Warehouse" error={errors.warehouse_id?.message}>
            <Select {...register('warehouse_id')}><option value="">Select…</option>{data.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select>
          </Field>
          <Field label="Storage location" error={errors.storage_location_id?.message}>
            <Select {...register('storage_location_id')} disabled={!whId}>
              <option value="">{whId ? 'Select…' : 'Pick a warehouse first'}</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.code} · {l.path}</option>)}
            </Select>
          </Field>
        </div>
      </form>
    </Modal>
  )
}

function marginText(watch) {
  const buy = Number(watch('purchase_price')) || 0
  const sell = Number(watch('selling_price')) || 0
  if (!buy || !sell) return '—'
  const m = Math.round(((sell - buy) / buy) * 100)
  return `${m}%`
}

function ProductThumb({ product }) {
  if (product.image_url) {
    return <img src={product.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
  }
  const initials = product.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['from-os-accent to-os-info', 'from-os-success to-os-info', 'from-os-warning to-os-danger']
  const idx = (product.name.charCodeAt(0) || 0) % colors.length
  return (
    <div className={classNames('w-10 h-10 rounded-lg bg-gradient-to-br text-white text-xs font-bold flex items-center justify-center shrink-0', colors[idx])}>
      {initials}
    </div>
  )
}
