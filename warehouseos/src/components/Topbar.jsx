import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, Bell, Search, ChevronRight, LogOut, Settings as SettingsIcon, UserCircle } from 'lucide-react'
import { NAV_ITEMS } from '../lib/nav'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { ThemeToggle } from './ThemeToggle'
import { classNames, formatDateTime } from '../lib/format'
import { Badge } from './ui'

export function Topbar({ onOpenMobile }) {
  const { data, markNotificationRead, markAllNotificationsRead } = useData()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showNotif, setShowNotif] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const notifRef = useRef(null)
  const userRef = useRef(null)
  const searchRef = useRef(null)

  const unread = data.notifications.filter((n) => !n.read).length

  // Breadcrumb derivation from current path.
  const crumbs = useMemo(() => {
    const path = location.pathname
    const match = NAV_ITEMS.find((i) => (i.to === '/' ? path === '/' : path.startsWith(i.to)))
    return [{ label: 'Home', to: '/' }, ...(match ? [{ label: match.label, to: match.to }] : [])]
  }, [location.pathname])

  // Global search: live product matches.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return data.products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.barcode || '').includes(q))
      .slice(0, 6)
  }, [query, data.products])

  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false)
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const goSearch = () => {
    if (query.trim()) {
      navigate(`/inventory?q=${encodeURIComponent(query.trim())}`)
      setShowSearch(false)
      setQuery('')
    }
  }

  const initials = (user?.full_name || 'U')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 h-16 bg-os-bg/80 backdrop-blur-md border-b border-os-border flex items-center gap-3 px-4 lg:px-6">
      <button onClick={onOpenMobile} className="lg:hidden os-btn-ghost p-2 rounded-md" aria-label="Open menu">
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumbs */}
      <nav className="hidden sm:flex items-center gap-1.5 text-sm min-w-0">
        {crumbs.map((c, i) => (
          <span key={c.to} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-os-muted shrink-0" />}
            <span
              className={classNames('truncate', i === crumbs.length - 1 ? 'text-os-text font-medium' : 'text-os-muted')}
            >
              {c.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Global search */}
      <div className="ml-auto flex items-center gap-2">
        <div className="relative" ref={searchRef}>
          <div className="hidden md:flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-os-muted pointer-events-none" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSearch(true) }}
              onFocus={() => setShowSearch(true)}
              onKeyDown={(e) => e.key === 'Enter' && goSearch()}
              placeholder="Search products, SKU…"
              className="os-input pl-9 w-56 lg:w-64"
            />
          </div>
          <button onClick={() => setShowSearch(true)} className="md:hidden os-btn-ghost p-2 rounded-md" aria-label="Search">
            <Search className="w-5 h-5" />
          </button>

          {showSearch && matches.length > 0 && (
            <div className="absolute right-0 top-full mt-2 w-72 os-card shadow-2xl overflow-hidden animate-scale-in z-50">
              {matches.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { navigate(`/inventory?q=${encodeURIComponent(p.sku)}`); setShowSearch(false); setQuery('') }}
                  className="w-full text-left px-3 py-2 hover:bg-os-bg flex items-center justify-between gap-2"
                >
                  <span className="text-sm text-os-text truncate">{p.name}</span>
                  <span className="text-xs text-os-muted shrink-0">{p.sku}</span>
                </button>
              ))}
              <button onClick={goSearch} className="w-full text-left px-3 py-2 text-xs text-os-accent hover:bg-os-bg border-t border-os-border">
                View all results →
              </button>
            </div>
          )}
        </div>

        <ThemeToggle />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif((s) => !s)}
            className="os-btn-ghost p-2 rounded-md relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-os-danger text-white text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 os-card shadow-2xl animate-scale-in z-50 max-h-[70vh] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-os-border">
                <span className="font-semibold text-sm text-os-text">Notifications</span>
                {unread > 0 && (
                  <button onClick={markAllNotificationsRead} className="text-xs text-os-accent hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto">
                {data.notifications.length === 0 && (
                  <p className="px-4 py-6 text-sm text-os-muted text-center">No notifications</p>
                )}
                {data.notifications.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={classNames(
                      'w-full text-left px-4 py-3 border-b border-os-border/60 hover:bg-os-bg flex gap-3',
                      !n.read && 'bg-os-accent/5'
                    )}
                  >
                    <span className={classNames('w-2 h-2 rounded-full mt-1.5 shrink-0', dotFor(n.severity))} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-os-text">{n.title}</span>
                      <span className="block text-xs text-os-muted mt-0.5">{n.message}</span>
                      <span className="block text-[10px] text-os-muted/70 mt-1">{formatDateTime(n.created_at)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUser((s) => !s)}
            className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-os-bg transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-os-accent to-os-info text-white text-xs font-bold flex items-center justify-center">
              {initials}
            </span>
            <span className="hidden sm:block text-left leading-tight">
              <span className="block text-sm font-medium text-os-text truncate max-w-[120px]">{user?.full_name || 'Guest'}</span>
              <span className="block text-[10px] text-os-muted capitalize">{user?.role || 'visitor'}</span>
            </span>
          </button>
          {showUser && (
            <div className="absolute right-0 top-full mt-2 w-60 os-card shadow-2xl animate-scale-in z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-os-border">
                <p className="text-sm font-medium text-os-text truncate">{user?.full_name}</p>
                <p className="text-xs text-os-muted truncate">{user?.email}</p>
                <div className="mt-2">
                  <Badge tone="accent">{user?.role}</Badge>
                </div>
              </div>
              <button
                onClick={() => { setShowUser(false); navigate('/settings') }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-os-text hover:bg-os-bg"
              >
                <SettingsIcon className="w-4 h-4" /> Settings
              </button>
              <button
                onClick={() => { setShowUser(false); signOut() }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-os-danger hover:bg-os-danger/10 border-t border-os-border"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function dotFor(severity) {
  return {
    danger: 'bg-os-danger',
    warning: 'bg-os-warning',
    success: 'bg-os-success',
    info: 'bg-os-info',
  }[severity] || 'bg-os-muted'
}
