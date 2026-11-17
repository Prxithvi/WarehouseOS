import { useState } from 'react'
import { Settings as SettingsIcon, Sun, Moon, Database, RefreshCw, User, Github, ShieldCheck, Boxes } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { PageHeader, Card, CardHeader, Button, Badge, Field, Input, ConfirmDialog, toast } from '../components/ui'
import { isSupabaseConfigured } from '../lib/supabase'

export function Settings() {
  const { theme, setTheme } = useTheme()
  const { mode, resetDemo, data } = useData()
  const { user } = useAuth()
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Personalize WarehouseOS, inspect the backend connection and manage demo data." icon={SettingsIcon} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Appearance */}
        <Card>
          <CardHeader title="Appearance" subtitle="Theme preference is saved to your browser." icon={theme === 'dark' ? Moon : Sun} />
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <ThemeOption active={theme === 'dark'} onClick={() => setTheme('dark')} icon={Moon} label="Dark" colors={['#0B0F19', '#151C2C', '#8B5CF6']} />
              <ThemeOption active={theme === 'light'} onClick={() => setTheme('light')} icon={Sun} label="Light" colors={['#F5F7FB', '#FFFFFF', '#6D5CE7']} />
            </div>
          </div>
        </Card>

        {/* Backend */}
        <Card>
          <CardHeader title="Backend connection" subtitle="Supabase credentials are read from VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY." icon={Database} />
          <div className="p-4 space-y-3 text-sm">
            <Row label="Mode"><Badge tone={mode === 'demo' ? 'warning' : 'success'}>{mode === 'demo' ? 'Demo (localStorage)' : 'Supabase'}</Badge></Row>
            <Row label="Supabase configured"><Badge tone={isSupabaseConfigured ? 'success' : 'muted'}>{isSupabaseConfigured ? 'Yes' : 'No'}</Badge></Row>
            <Row label="RLS protection"><Badge tone="info"><ShieldCheck className="w-3 h-3" /> Enabled in schema</Badge></Row>
            <p className="text-xs text-os-muted pt-2">
              {mode === 'demo'
                ? 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file and rebuild to switch to the cloud backend. All sample data stays local until then.'
                : 'Connected to your Supabase project. Row Level Security governs every read and write.'}
            </p>
          </div>
        </Card>

        {/* Profile */}
        <Card>
          <CardHeader title="Profile" icon={User} />
          <div className="p-4 space-y-3 text-sm">
            <Row label="Name"><span className="text-os-text">{user?.full_name || '—'}</span></Row>
            <Row label="Email"><span className="text-os-text">{user?.email || '—'}</span></Row>
            <Row label="Role"><Badge tone="accent">{user?.role || '—'}</Badge></Row>
          </div>
        </Card>

        {/* Demo data */}
        <Card>
          <CardHeader title="Demo data" subtitle="Counts of seeded records in the current dataset." icon={Boxes} />
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <Count label="Products" value={data.products.length} />
              <Count label="Warehouses" value={data.warehouses.length} />
              <Count label="Locations" value={data.storageLocations.length} />
              <Count label="Orders" value={data.orders.length} />
              <Count label="Suppliers" value={data.suppliers.length} />
              <Count label="Transactions" value={data.transactions.length} />
            </div>
            {mode === 'demo' && (
              <div className="mt-4">
                <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}><RefreshCw className="w-4 h-4" /> Reset demo data</Button>
                <p className="text-xs text-os-muted mt-2">Restores the original seeded dataset and discards all local edits.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="About" icon={Github} />
        <div className="p-4 text-sm text-os-muted leading-relaxed">
          <p><span className="text-os-text font-semibold">WarehouseOS</span> is a Smart Warehouse Inventory & Optimization System built as a SY BTech CSE Design and Analysis of Algorithms mini project. It demonstrates four core DAA algorithms — <span className="text-os-text">Greedy (bin packing)</span>, <span className="text-os-text">Dijkstra</span>, <span className="text-os-text">Merge Sort</span> and <span className="text-os-text">Binary Search</span> — applied to real warehouse problems, alongside a full inventory, order and analytics suite.</p>
          <p className="mt-2">Stack: React + Vite + Tailwind CSS + Lucide + React Router (HashRouter) + Supabase + Recharts + React Hook Form + Zod. Deployable to GitHub Pages via the included GitHub Actions workflow.</p>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmReset}
        danger
        title="Reset demo data"
        message="This restores the original seeded dataset and discards all local changes. Continue?"
        confirmText="Reset"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => { resetDemo(); toast('Demo data reset to seed', 'success'); setConfirmReset(false) }}
      />
    </div>
  )
}

function ThemeOption({ active, onClick, icon: Icon, label, colors }) {
  return (
    <button onClick={onClick} className={`p-3 rounded-xl border-2 transition text-left ${active ? 'border-os-accent bg-os-accent/5' : 'border-os-border hover:border-os-muted'}`}>
      <div className="flex gap-1.5 mb-2">
        {colors.map((c, i) => <span key={i} className="w-6 h-6 rounded-md" style={{ background: c }} />)}
      </div>
      <span className="text-sm font-medium text-os-text inline-flex items-center gap-1.5"><Icon className="w-4 h-4" /> {label}</span>
    </button>
  )
}

function Row({ label, children }) {
  return <div className="flex items-center justify-between"><span className="text-os-muted">{label}</span>{children}</div>
}
function Count({ label, value }) {
  return <div className="p-3 rounded-lg bg-os-bg border border-os-border"><p className="text-xl font-bold text-os-text tabular-nums">{value}</p><p className="text-[11px] text-os-muted uppercase tracking-wide">{label}</p></div>
}
