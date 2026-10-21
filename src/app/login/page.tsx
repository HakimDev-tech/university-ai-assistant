'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CircleAlert, LoaderCircle } from 'lucide-react'
import MarginMark from '@/components/MarginMark'
import { isSupabaseBrowserConfigured } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)
    setNotice(null)
    if (!isSupabaseBrowserConfigured()) {
      setError('Account service is not configured for this deployment. Check the public Supabase URL and key in Vercel.')
      return
    }
    setLoading(true)
    try {
      const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        setError('The email or password could not be verified. If you just signed up, confirm your email first.')
        return
      }
      router.replace('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Sign-in request failed', err instanceof Error ? { name: err.name, message: err.message } : { type: typeof err })
      setError(typeof navigator !== 'undefined' && !navigator.onLine
        ? 'Your device appears to be offline. Reconnect and try again.'
        : 'Margin could not reach the account service. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-stage">
      <div className="auth-grid">
        <aside className="auth-manifesto">
          <Link href="/" className="auth-back"><ArrowLeft size={14} /> Back to Margin</Link>
          <div className="auth-editorial">
            <div className="auth-index"><span>FIELD GUIDE</span><span>NO. 001</span></div>
            <h1>Pick up<br />where the<br /><em>evidence is.</em></h1>
            <p>Your documents, questions, and source passages remain together in one focused study space.</p>
            <div className="auth-proof"><div className="auth-proof-symbol"><CircleAlert size={19} strokeWidth={1.5} /></div><div><strong>Answers are not the source.</strong><span>Open the passage and decide whether the reasoning holds.</span></div></div>
          </div>
          <div className="auth-bottomline"><span>MARGIN / STUDY SYSTEM</span><span>EST. FOR CURIOSITY</span></div>
        </aside>
        <section className="auth-form-panel">
          <div className="auth-form-top">
            <Link href="/" aria-label="Margin home" className="auth-brand"><MarginMark size={38} /><span>MARGIN<span className="auth-brand-dot">.</span></span></Link>
            <span className="auth-step">ACCOUNT ACCESS <b>01 / 02</b></span>
          </div>
          <div className="auth-form-body">
            <div className="auth-kicker"><span className="auth-kicker-line" /> WELCOME BACK</div>
            <h2>Return to<br /><em>your notes.</em></h2>
            <p className="auth-intro">Sign in to continue your study threads and inspect the evidence behind previous answers.</p>
            <form onSubmit={handleLogin} className="auth-form">
              <div className="auth-field"><label htmlFor="email">EMAIL ADDRESS</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" disabled={loading} /></div>
              <div className="auth-field"><div className="auth-label-row"><label htmlFor="password">PASSWORD</label><span>YOUR ACCOUNT PASSWORD</span></div><input id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" disabled={loading} /></div>
              {error && <div role="alert" className="auth-error"><CircleAlert size={17} /><p>{error}</p></div>}
              {notice && <p role="status" className="auth-notice">{notice}</p>}
              <button type="submit" disabled={loading} className="auth-submit">{loading ? <><LoaderCircle size={16} className="animate-spin" /> Signing in…</> : <>Sign in to Margin <ArrowRight size={16} /></>}</button>
            </form>
            <div className="auth-assurance"><Check size={14} /><span>Private to your account. No public course library.</span></div>
          </div>
          <div className="auth-form-footer"><span>New to Margin?</span><Link href="/signup">Create an account <ArrowRight size={13} /></Link></div>
        </section>
      </div>
    </main>
  )
}
