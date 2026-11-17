import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boxes, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button, Field, Input, Badge, toast } from '../components/ui'
import { BACKEND_MODE } from '../lib/supabase'

export function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast('Enter email and password', 'danger'); return }
    setLoading(true)
    try {
      if (mode === 'signin') await signIn(email, password)
      else await signUp(email, password)
      toast('Welcome to WarehouseOS', 'success')
      navigate('/')
    } catch (err) {
      toast(err.message || 'Authentication failed', 'danger')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-os-accent via-os-accent to-os-info p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 2px, transparent 2px), radial-gradient(circle at 70% 60%, white 2px, transparent 2px)', backgroundSize: '40px 40px' }} />
        <div className="relative">
          <div className="flex items-center gap-3 text-white">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center"><Boxes className="w-6 h-6" /></div>
            <div><p className="font-bold text-lg">WarehouseOS</p><p className="text-xs text-white/70 uppercase tracking-wider">Smart Inventory</p></div>
          </div>
        </div>
        <div className="relative text-white">
          <h1 className="text-4xl font-bold leading-tight">Smart Warehouse<br />Inventory & Optimization</h1>
          <p className="mt-4 text-white/80 max-w-md">A DAA mini project featuring Dijkstra, Greedy bin-packing, Merge Sort and Binary Search — applied to real warehouse operations.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['Dijkstra routing', 'ABC classification', 'Live inventory', 'Supabase + GitHub Pages'].map((t) => (
              <span key={t} className="px-3 py-1 rounded-full bg-white/15 text-xs text-white backdrop-blur">{t}</span>
            ))}
          </div>
        </div>
        <p className="relative text-white/60 text-xs">SY BTech CSE · Design and Analysis of Algorithms</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-os-bg">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-os-accent to-os-info flex items-center justify-center"><Boxes className="w-5 h-5 text-white" /></div>
            <span className="font-bold text-os-text">WarehouseOS</span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-os-accent" />
            <h2 className="text-2xl font-bold text-os-text">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
          </div>
          <p className="text-sm text-os-muted mb-6">{mode === 'signin' ? 'Sign in to continue to your dashboard.' : 'Start managing your warehouse in minutes.'}</p>

          {BACKEND_MODE === 'demo' && (
            <div className="mb-4 p-3 rounded-lg bg-os-warning/10 border border-os-warning/30 text-xs text-os-warning">
              Demo mode is active — enter any email and password to continue. Data is stored locally in your browser.
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <Field label="Full name">
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-os-muted" /><Input className="pl-9" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></div>
              </Field>
            )}
            <Field label="Email">
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-os-muted" /><Input className="pl-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
            </Field>
            <Field label="Password">
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-os-muted" /><Input className="pl-9" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait…' : <>{mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>

          <p className="text-sm text-os-muted text-center mt-6">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="text-os-accent font-medium hover:underline">
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <div className="mt-6 flex items-center justify-center">
            <Badge tone={BACKEND_MODE === 'demo' ? 'warning' : 'success'}>{BACKEND_MODE === 'demo' ? 'Demo mode' : 'Supabase connected'}</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
