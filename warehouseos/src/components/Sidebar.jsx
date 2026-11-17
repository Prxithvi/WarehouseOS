import { NavLink } from 'react-router-dom'
import { ChevronLeft, Boxes, X } from 'lucide-react'
import { NAV_ITEMS } from '../lib/nav'
import { classNames } from '../lib/format'
import { useData } from '../context/DataContext'
import { Badge } from './ui'

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { mode } = useData()

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in" onClick={onCloseMobile} />
      )}

      <aside
        className={classNames(
          'fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen bg-os-sidebar border-r border-os-border flex flex-col transition-all duration-200',
          collapsed ? 'lg:w-[72px]' : 'lg:w-64',
          'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 h-16 border-b border-os-border shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-os-accent to-os-info flex items-center justify-center shrink-0 shadow-glow">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-os-text leading-tight">WarehouseOS</p>
              <p className="text-[10px] text-os-muted uppercase tracking-wider">Smart Inventory</p>
            </div>
          )}
          <button onClick={onCloseMobile} className="ml-auto lg:hidden os-btn-ghost p-1.5 rounded-md" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                classNames(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative group',
                  isActive
                    ? 'bg-os-accent/10 text-os-accent'
                    : 'text-os-muted hover:text-os-text hover:bg-os-bg',
                  collapsed && 'lg:justify-center lg:px-0'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {isActive && !collapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-os-accent rounded-r-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer: mode + collapse */}
        <div className="border-t border-os-border p-3 space-y-2 shrink-0">
          {!collapsed && (
            <div className="flex items-center justify-between px-1">
              <Badge tone={mode === 'demo' ? 'warning' : 'success'}>
                {mode === 'demo' ? 'Demo mode' : 'Supabase'}
              </Badge>
              <span className="text-[10px] text-os-muted">v1.0.0</span>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center gap-2 text-xs text-os-muted hover:text-os-text py-1.5 rounded-md hover:bg-os-bg transition-colors"
          >
            <ChevronLeft className={classNames('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
