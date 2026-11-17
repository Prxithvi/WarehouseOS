import {
  LayoutDashboard, Boxes, Package, Warehouse, MapPin, ArrowLeftRight,
  ShoppingCart, Truck, Sparkles, Route, FlaskConical, BarChart3,
  FileText, Settings,
} from 'lucide-react'

// Single source of truth for sidebar navigation + breadcrumbs.
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/warehouses', label: 'Warehouses', icon: Warehouse },
  { to: '/storage-locations', label: 'Storage Locations', icon: MapPin },
  { to: '/transfers', label: 'Stock Transfers', icon: ArrowLeftRight },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/optimizer', label: 'Smart Optimizer', icon: Sparkles },
  { to: '/picking', label: 'Picking Route Optimizer', icon: Route },
  { to: '/algorithms', label: 'DAA Algorithm Lab', icon: FlaskConical },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
]
