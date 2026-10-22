'use client'

import { useState } from 'react'
import { createClient, isSupabaseBrowserConfigured } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MarginMark from '@/components/MarginMark'
import { ArrowRight, Check, CircleAlert, LoaderCircle, Mail, ShieldCheck } from 'lucide-react'

function explainSignupError(error: unknown): string {
  const value = error as { message?: string; name?: string; status?: number; code?: string }
  const message = (value?.message ?? '').toLowerCase()

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'Your device appears to be offline. Reconnect and try again.'
  }
  if (message.includes('failed to fetch') || message.includes('networkerror') || message.includes('fetch failed')) {
    return 'Margin could not reach the account service. Check your connection; if it persists, the deployment’s Supabase URL or public key may need to be checked.'
  }
  if (message.includes('already registered') || message.includes('already been registered') || message.includes('user already exists')) {
    return 'An account may already exist for this email. Try signing in instead.'
  }
  if (message.includes('password') && (message.includes('weak') || message.includes('least'))) {
    return 'Choose a stronger password that meets the account security requirements.'
  }
  if (message.includes('rate limit') || value?.status === 429) {
    return 'Too many attempts in a short period. Wait a little before trying again.'
  }
  if (message.includes('email') && (message.includes('invalid') || message.includes('not valid'))) {
    return 'Check the email address and try again.'
  }
  return 'Your account could not be created. Please try again. If this continues, the account service may need attention.'
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return
    setError(null)
    setNotice(null)

    if (!isSupabaseBrowserConfigured()) {
      setError('Account service is not configured for this deployment. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel, then redeploy.')
      return
    }
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      })

      if (signupError) {
        setError(explainSignupError(signupError))
        return
      }

      if (!data.user) {
        setError('The account service did not return an account. Please try again.')
        return
      }

      if (!data.session) {
        setNotice('Account request received. Check your inbox for a confirmation link. After confirming, you can return here to sign in.')
        return
      }

      router.replace('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Signup request failed', err instanceof Error ? { name: err.name, message: err.message } : { type: typeof err })
      setError(explainSignupError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-stage">
      <div className="auth-grid">
        <aside className="auth-manifesto">
          <Link href="/" className="auth-back"><span aria-hidden="true">←</span> Back to Margin</Link>
          <div className="auth-editorial">
            <div className="auth-index"><span>FIELD GUIDE</span><span>NO. 001</span></div>
            <h1>Keep the<br />source in<br /><em>the picture.</em></h1>
            <p>Make your notes searchable. Ask better questions. Check the passage before trusting the answer.</p>
            <div className="auth-proof">
              <div className="auth-proof-symbol"><ShieldCheck size={19} strokeWidth={1.5} /></div>
              <div><strong>Your material stays yours.</strong><span>Private study space, tied to your account.</span></div>
            </div>
          </div>
          <div className="auth-bottomline"><span>MARGIN / STUDY SYSTEM</span><span>EST. FOR CURIOSITY</span></div>
        </aside>

        <section className="auth-form-panel">
          <div className="auth-form-top">
            <Link href="/" aria-label="Margin home" className="auth-brand"><MarginMark size={38} /><span>MARGIN<span className="auth-brand-dot">.</span></span></Link>
            <span className="auth-step">ACCOUNT SETUP <b>02 / 02</b></span>
          </div>

          <div className="auth-form-body">
            {notice ? (
              <div className="auth-confirmation" role="status">
                <div className="auth-confirmation-icon"><Mail size={23} strokeWidth={1.5} /></div>
                <span className="auth-kicker">ONE MORE STEP</span>
                <h2>Check your<br /><em>inbox.</em></h2>
                <p>{notice}</p>
                <div className="auth-email-receipt"><span>CONFIRMATION SENT TO</span><strong>{email.trim()}</strong></div>
                <Link href="/login" className="auth-submit">Go to sign in <ArrowRight size={16} /></Link>
                <button className="auth-text-button" type="button" onClick={() => { setNotice(null); setPassword('') }}>Use a different email</button>
              </div>
            ) : (
              <>
                <div className="auth-kicker"><span className="auth-kicker-line" /> CREATE YOUR ACCOUNT</div>
                <h2>Start with<br /><em>one source.</em></h2>
                <p className="auth-intro">Your study space begins here. No noise, just your material and the questions that matter.</p>
                <form onSubmit={handleSignup} className="auth-form">
                  <div className="auth-field">
                    <label htmlFor="email">EMAIL ADDRESS</label>
                    <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" disabled={loading} />
                  </div>
                  <div className="auth-field">
                    <div className="auth-label-row"><label htmlFor="password">PASSWORD</label><span>8 CHARACTERS MIN.</span></div>
                    <input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password" disabled={loading} />
                  </div>
                  {error && <div role="alert" className="auth-error"><CircleAlert size={17} /><p>{error}</p></div>}
                  <button type="submit" disabled={loading} className="auth-submit">
                    {loading ? <><LoaderCircle size={16} className="animate-spin" /> Creating your account…</> : <>Create your account <ArrowRight size={16} /></>}
                  </button>
                </form>
                <div className="auth-assurance"><Check size={14} /><span>Your documents are private to your account.</span></div>
              </>
            )}
          </div>
          <div className="auth-form-footer"><span>Already have a space?</span><Link href="/login">Sign in <ArrowRight size={13} /></Link></div>
        </section>
      </div>
    </main>
  )
}
