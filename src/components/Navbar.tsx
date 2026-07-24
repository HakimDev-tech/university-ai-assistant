'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default function Navbar() {
  const pathname = usePathname()

  const linkClasses = (href: string) =>
    `inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
      pathname === href
        ? 'bg-brand-100 text-brand-700'
        : 'text-ink-secondary hover:bg-brand-50 hover:text-brand-700'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">

        {/* Logo */}

        <Link
          href="/dashboard"
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-brand-700 text-lg text-white shadow-sm">
            🎓
          </div>

          <div className="hidden sm:block">
            <p className="text-base font-semibold text-ink-primary">
              University AI
            </p>

            <p className="text-xs text-ink-muted">
              Assistant
            </p>
          </div>
        </Link>

        {/* Navigation */}

        <nav className="flex items-center rounded-full border border-border bg-surface-secondary p-1">

          <Link
            href="/dashboard"
            className={linkClasses('/dashboard')}
          >
            Dashboard
          </Link>

        </nav>

        {/* Right */}

        <div className="flex items-center gap-3">

          <div className="hidden rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 md:flex">
            Gemini AI
          </div>

          <LogoutButton />

        </div>

      </div>
    </header>
  )
}