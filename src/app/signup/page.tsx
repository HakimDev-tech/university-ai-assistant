'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (!data.session) {
      setNotice('Check your inbox for the confirmation link. Once confirmed, sign in to open your study desk.')
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
            <div className="eyebrow">A different study habit</div>
            <h1 className="mt-5 font-display text-5xl leading-[1.02] tracking-tight">Understand it. Then verify it.</h1>
            <p className="mt-5 max-w-xs text-sm leading-7 text-ink-secondary">Bring your course material into one private place, with source excerpts attached to answers.</p>
          </div>
          <span className="eyebrow">MARGIN / YOUR MATERIAL, YOUR PACE</span>
        </aside>
        <section className="p-7 sm:p-10 md:p-12">
          <div className="eyebrow">Account / 02</div>
          <h2 className="mt-4 font-display text-4xl tracking-tight">Start with a source.</h2>
          <p className="mt-3 text-sm leading-6 text-ink-secondary">Create an account for your personal study library.</p>
          <form onSubmit={handleSignup} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-semibold">Email address</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="input text-sm" placeholder="you@university.edu" />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-xs font-semibold">Password <span className="font-normal text-ink-muted">(8+ characters)</span></label>
              <input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} className="input text-sm" placeholder="Create a password" />
            </div>
            {error && <p role="alert" className="border border-error/25 bg-error-bg px-3 py-2 text-xs leading-5 text-error">{error}</p>}
            {notice && <p role="status" className="border border-success/25 bg-success-bg px-3 py-2 text-xs leading-5 text-success">{notice}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Creating account…' : 'Create study desk'} <ArrowRight size={14} /></button>
          </form>
          <p className="mt-7 border-t border-border pt-5 text-xs text-ink-secondary">Already have an account? <Link href="/login" className="font-semibold text-brand-700 underline underline-offset-4">Sign in</Link></p>
        </section>
      </div>
    </main>
  )
}
