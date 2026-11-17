import { createClient } from '@supabase/supabase-js'

// Read PUBLIC browser credentials from environment. These are safe to ship in
// the client bundle because Supabase Row Level Security (see
// supabase/migrations/schema.sql) — not key secrecy — protects the data.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(
  url && anonKey && String(url).startsWith('http')
)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

// 'supabase' when credentials are present, otherwise 'demo' (localStorage).
export const BACKEND_MODE = isSupabaseConfigured ? 'supabase' : 'demo'
