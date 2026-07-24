'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-ink-secondary transition-colors duration-150 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
    >
      <LogOut className="h-3.5 w-3.5" />
      Se déconnecter
    </button>
  )
}
