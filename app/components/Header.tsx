'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { NavBadges } from './NavBadges'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="bg-ink-soft border-b border-steel/30">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-paper text-lg tracking-tight">
          Ascend
        </Link>

        <nav className="flex items-center gap-4">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="text-paper text-sm font-medium hover:text-brand-red transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/schedule"
                className="text-paper text-sm font-medium hover:text-brand-red transition-colors"
              >
                Schedule
              </Link>
              {(session.user.role === 'instructor' || session.user.role === 'admin') && (
                <Link
                  href="/instructor"
                  className="text-paper text-sm font-medium hover:text-brand-red transition-colors"
                >
                  Instructor
                </Link>
              )}
              {session.user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="text-paper text-sm font-medium hover:text-brand-red transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/settings"
                className="text-paper text-sm font-medium hover:text-brand-red transition-colors"
              >
                Settings
              </Link>
              <NavBadges />
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-3 py-1.5 border border-ash text-paper text-sm font-medium hover:border-brand-red hover:text-brand-red transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-paper text-sm font-medium hover:text-brand-red transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 bg-brand-red text-paper text-sm font-bold tracking-wide hover:bg-red-700 transition-colors"
              >
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
