'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setError('The email or password could not be verified.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <main className="site-shell grid min-h-[calc(100vh-68px)] place-items-center py-12">
      <div className="grid w-full max-w-4xl border border-border bg-surface md:grid-cols-[.9fr_1.1fr]">
        <aside className="hidden flex-col justify-between bg-[#e9e5d9] p-8 md:flex">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-ink-secondary hover:text-brand-700"><ArrowLeft size={13} /> Back to Margin</Link>
          <div>
            <div className="eyebrow">Your study desk</div>
            <h1 className="mt-5 font-display text-5xl leading-[1.02] tracking-tight">The source stays close.</h1>
            <p className="mt-5 max-w-xs text-sm leading-7 text-ink-secondary">Return to your documents, questions, and the passages behind your answers.</p>
          </div>
          <span className="eyebrow">MARGIN / ACCOUNT ACCESS</span>
        </aside>
        <section className="p-7 sm:p-10 md:p-12">
          <div className="eyebrow">Account / 01</div>
          <h2 className="mt-4 font-display text-4xl tracking-tight">Welcome back.</h2>
          <p className="mt-3 text-sm leading-6 text-ink-secondary">Sign in to continue your study threads.</p>
          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-semibold">Email address</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="input text-sm" placeholder="you@university.edu" />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-xs font-semibold">Password</label>
              <input id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="input text-sm" placeholder="Your password" />
            </div>
            {error && <p role="alert" className="border border-error/25 bg-error-bg px-3 py-2 text-xs leading-5 text-error">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Signing in…' : 'Enter study desk'} <ArrowRight size={14} /></button>
          </form>
          <p className="mt-7 border-t border-border pt-5 text-xs text-ink-secondary">New to Margin? <Link href="/signup" className="font-semibold text-brand-700 underline underline-offset-4">Create an account</Link></p>
        </section>
      </div>
    </main>
  )
}
