import Link from 'next/link'
import MarginMark from '@/components/MarginMark'
import { ArrowRight, CircleAlert } from 'lucide-react'

export default function ConfirmationErrorPage() {
  return (
    <main className="auth-stage">
      <section className="auth-grid" style={{ gridTemplateColumns: '1fr', minHeight: 'auto', maxWidth: 620 }}>
        <div className="auth-form-panel">
          <div className="auth-form-top">
            <Link href="/" aria-label="Margin home" className="auth-brand"><MarginMark size={38} /><span>MARGIN<span className="auth-brand-dot">.</span></span></Link>
            <span className="auth-step">ACCOUNT ACCESS <b>ERROR</b></span>
          </div>
          <div className="auth-form-body">
            <div className="auth-confirmation-icon"><CircleAlert size={23} strokeWidth={1.5} /></div>
            <div className="auth-kicker"><span className="auth-kicker-line" /> CONFIRMATION NOT VERIFIED</div>
            <h2>Link not<br /><em>recognised.</em></h2>
            <p className="auth-intro">This confirmation link may have expired or already been used. Return to sign in. If your account is not confirmed, request a fresh confirmation email and open its newest link.</p>
            <Link href="/login" className="auth-submit" style={{ marginTop: 28 }}>Return to sign in <ArrowRight size={16} /></Link>
          </div>
          <div className="auth-form-footer"><span>Need a new account?</span><Link href="/signup">Create an account <ArrowRight size={13} /></Link></div>
        </div>
      </section>
    </main>
  )
}
