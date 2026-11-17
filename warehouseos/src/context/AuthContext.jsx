import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, BACKEND_MODE } from '../lib/supabase'
import { DEMO_USER } from '../lib/demoData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    let unsubscribe = null
    async function init() {
      if (BACKEND_MODE === 'supabase' && supabase) {
        const { data } = await supabase.auth.getSession()
        if (active) {
          setUser(data.session?.user ? mapSupabaseUser(data.session.user) : null)
          setLoading(false)
        }
        const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
          setUser(session?.user ? mapSupabaseUser(session.user) : null)
        })
        unsubscribe = () => sub.subscription.unsubscribe()
        return
      }
      // Demo mode: a persistent local session.
      const saved = localStorage.getItem('warehouseos:demoSession')
      if (active) {
        setUser(saved ? DEMO_USER : null)
        setLoading(false)
      }
    }
    init()
    return () => {
      active = false
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    if (BACKEND_MODE === 'supabase' && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return
    }
    // Demo mode accepts any credentials.
    localStorage.setItem('warehouseos:demoSession', '1')
    setUser(DEMO_USER)
  }, [])

  const signUp = useCallback(async (email, password) => {
    if (BACKEND_MODE === 'supabase' && supabase) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      return
    }
    localStorage.setItem('warehouseos:demoSession', '1')
    setUser(DEMO_USER)
  }, [])

  const signOut = useCallback(async () => {
    if (BACKEND_MODE === 'supabase' && supabase) {
      await supabase.auth.signOut()
    } else {
      localStorage.removeItem('warehouseos:demoSession')
    }
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, mode: BACKEND_MODE }}>
      {children}
    </AuthContext.Provider>
  )
}

function mapSupabaseUser(u) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
    role: u.user_metadata?.role || 'administrator',
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
