'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    if (loading) return
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setLoading(false)
      return
    }
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex min-h-9 items-center gap-2 border border-border px-3 text-xs text-ink-secondary transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
    >
      <LogOut size={13} />
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
