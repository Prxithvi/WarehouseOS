import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertTriangle, Inbox, Loader2, Search } from 'lucide-react'
import { classNames } from '../lib/format'

// --- Button -----------------------------------------------------------------
export function Button({ variant = 'primary', size = 'md', className, children, ...props }) {
  const variants = {
    primary: 'os-btn-primary',
    secondary: 'os-btn-secondary',
    ghost: 'os-btn-ghost',
    danger: 'os-btn-danger',
  }
  const sizes = { sm: 'text-xs px-3 py-1.5', md: '', lg: 'text-base px-5 py-2.5' }
  return (
    <button className={classNames(variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}

// --- Inputs -----------------------------------------------------------------
export function Input({ className, ...props }) {
  return <input className={classNames('os-input', className)} {...props} />
}
export function Textarea({ className, ...props }) {
  return <textarea className={classNames('os-input', className)} {...props} />
}
export function Select({ className, children, ...props }) {
  return (
    <select className={classNames('os-input', className)} {...props}>
      {children}
    </select>
  )
}
export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && <span className="os-label">{label}</span>}
      {children}
      {hint && !error && <span className="block text-xs text-os-muted/70 mt-1">{hint}</span>}
      {error && <span className="block text-xs text-os-danger mt-1">{error}</span>}
    </label>
  )
}

// --- Badge ------------------------------------------------------------------
const toneMap = {
  success: 'bg-os-success/10 text-os-success border-os-success/30',
  warning: 'bg-os-warning/10 text-os-warning border-os-warning/30',
  danger: 'bg-os-danger/10 text-os-danger border-os-danger/30',
  info: 'bg-os-info/10 text-os-info border-os-info/30',
  accent: 'bg-os-accent/10 text-os-accent border-os-accent/30',
  muted: 'bg-os-muted/10 text-os-muted border-os-muted/30',
}
export function Badge({ tone = 'muted', className, children }) {
  return <span className={classNames('os-chip', toneMap[tone] || toneMap.muted, className)}>{children}</span>
}

export function StatusBadge({ tone, label }) {
  return <Badge tone={tone}>{label}</Badge>
}

// --- Card -------------------------------------------------------------------
export function Card({ className, children, ...props }) {
  return (
    <div className={classNames('os-card', className)} {...props}>
      {children}
    </div>
  )
}
export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-os-border">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && <Icon className="w-5 h-5 text-os-accent shrink-0" />}
        <div className="min-w-0">
          <h3 className="font-semibold text-os-text truncate">{title}</h3>
          {subtitle && <p className="text-xs text-os-muted truncate">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

// --- Empty state ------------------------------------------------------------
export function EmptyState({ title = 'Nothing here yet', description, icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="w-12 h-12 rounded-full bg-os-bg flex items-center justify-center mb-3 border border-os-border">
        <Icon className="w-6 h-6 text-os-muted" />
      </div>
      <h3 className="font-medium text-os-text">{title}</h3>
      {description && <p className="text-sm text-os-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// --- Spinner ----------------------------------------------------------------
export function Spinner({ className }) {
  return <Loader2 className={classNames('animate-spin text-os-accent', className)} />
}

// --- Page header ------------------------------------------------------------
export function PageHeader({ title, description, actions, icon: Icon }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-os-accent/10 text-os-accent flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-os-text tracking-tight">{title}</h1>
          {description && <p className="text-sm text-os-muted mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

// --- Search input -----------------------------------------------------------
export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <div className={classNames('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-os-muted" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="os-input pl-9"
      />
    </div>
  )
}

// --- Modal ------------------------------------------------------------------
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={classNames(
          'relative w-full bg-os-card border border-os-border rounded-t-2xl sm:rounded-xl shadow-2xl animate-scale-in flex flex-col max-h-[92vh]',
          widths[size]
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-os-border shrink-0">
          <h3 className="font-semibold text-os-text">{title}</h3>
          <button onClick={onClose} className="os-btn-ghost p-1.5 rounded-lg" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 grow">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-os-border flex justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

// --- Confirm dialog (promise-free, controlled) ------------------------------
export function ConfirmDialog({ open, title = 'Are you sure?', message, confirmText = 'Confirm', danger, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmText}</Button>
        </>
      }
    >
      <div className="flex gap-3">
        {danger && <AlertTriangle className="w-5 h-5 text-os-danger shrink-0 mt-0.5" />}
        <p className="text-sm text-os-muted">{message}</p>
      </div>
    </Modal>
  )
}

// --- Toast (very small, local) ---------------------------------------------
let pushToast = () => {}
export function toast(message, tone = 'info') {
  pushToast({ message, tone, id: Date.now() })
}
export function ToastHost() {
  const [items, setItems] = useState([])
  useEffect(() => {
    pushToast = (t) => {
      setItems((cur) => [...cur, t])
      setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== t.id)), 3200)
    }
    return () => { pushToast = () => {} }
  }, [])
  return createPortal(
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-[min(92vw,360px)]">
      {items.map((t) => (
        <div key={t.id} className={classNames('os-card px-4 py-3 text-sm animate-slide-up flex items-start gap-2', toneMap[t.tone])}>
          <span className="font-medium">{t.message}</span>
        </div>
      ))}
    </div>,
    document.body
  )
}
