import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { Layout } from './components/Layout'
import { Spinner } from './components/ui'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import { Products } from './pages/Products'
import { Warehouses } from './pages/Warehouses'
import { StorageLocations } from './pages/StorageLocations'
import { StockTransfers } from './pages/StockTransfers'
import { Orders } from './pages/Orders'
import { Suppliers } from './pages/Suppliers'
import { SmartOptimizer } from './pages/SmartOptimizer'
import { PickingRoute } from './pages/PickingRoute'
import { AlgorithmLab } from './pages/AlgorithmLab'
import { Analytics } from './pages/Analytics'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'

function ProtectedShell() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-os-bg">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }
  if (!user) return <Login />
  return <Layout /> // renders <Outlet/> for the nested routes below
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <HashRouter>
            <Routes>
              <Route element={<ProtectedShell />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/products" element={<Products />} />
                <Route path="/warehouses" element={<Warehouses />} />
                <Route path="/storage-locations" element={<StorageLocations />} />
                <Route path="/transfers" element={<StockTransfers />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/optimizer" element={<SmartOptimizer />} />
                <Route path="/picking" element={<PickingRoute />} />
                <Route path="/algorithms" element={<AlgorithmLab />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </HashRouter>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
