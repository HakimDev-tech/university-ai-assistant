'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default function Navbar() {
  const pathname = usePathname()

  const linkClasses = (href: string) =>
    `px-3 py-2 text-sm font-medium rounded transition-colors ${
      pathname === href
        ? 'bg-blue-100 text-blue-700'
        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
    }`

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo / App name */}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-gray-900">
            🎓 University AI Assistant
          </span>
        </Link>

        {/* Navigation links */}
        <div className="flex items-center space-x-1">
          <Link href="/dashboard" className={linkClasses('/dashboard')}>
            Dashboard
          </Link>
        </div>

        {/* Auth section */}
        <div className="flex items-center">
          <LogoutButton />
        </div>
      </div>
    </nav>
  )
}