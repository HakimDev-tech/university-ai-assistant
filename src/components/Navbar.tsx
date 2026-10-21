'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, BookOpenText } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'

export default function Navbar() {
  const pathname = usePathname()
  const onWorkspace = pathname === '/dashboard' || pathname.startsWith('/chat/')

  return (
    <header className="site-nav sticky top-0 z-50">
      <div className="site-shell flex h-full items-center justify-between gap-4">
        <Link href={onWorkspace ? '/dashboard' : '/'} className="wordmark" aria-label="Margin home">
          <span className="wordmark-mark">m.</span>
          <span>
            <span className="wordmark-name block">MARGIN</span>
            <span className="wordmark-sub">Study from the source</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {onWorkspace ? (
            <Link href="/dashboard" className={`nav-link ${pathname === '/dashboard' ? 'nav-link-active' : ''}`}>
              <span className="inline-flex items-center gap-2"><BookOpenText size={14} strokeWidth={1.7} /> Study desk</span>
            </Link>
          ) : (
            <>
              <a href="#method" className="nav-link hidden sm:inline-flex">Method</a>
              <a href="#principles" className="nav-link hidden sm:inline-flex">Principles</a>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {onWorkspace ? (
            <LogoutButton />
          ) : (
            <Link href="/login" className="nav-link inline-flex items-center gap-1">
              Sign in <ArrowUpRight size={13} />
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
