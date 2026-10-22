import { createBrowserClient } from '@supabase/ssr'

export function isSupabaseBrowserConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return false

  try {
    const parsed = new URL(url)
    return (parsed.protocol === 'https:' || parsed.hostname === 'localhost') && key.trim().length > 0
  } catch {
    return false
  }
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase browser configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the deployment environment.')
  }

  try {
    new URL(url)
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid URL.')
  }

  return createBrowserClient(url, key)
}
