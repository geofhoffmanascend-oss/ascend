'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { NavBadges } from './NavBadges'

function NavLink({
  href,
  highlight,
  onClick,
  children,
}: {
  href: string
  highlight?: boolean
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`px-2 py-1 text-sm font-medium transition-colors shrink-0 ${
        highlight ? 'text-brand-red hover:text-brand-red-light' : 'text-paper hover:text-brand-red'
      }`}
    >
      {children}
    </Link>
  )
}

export function Header() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header className="bg-ink-soft border-b border-steel/30">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/AJJ.webp" alt="Ascend" width={32} height={32} className="rounded-full" />
          <span className="hidden md:block font-display font-bold text-paper text-lg tracking-tight">Ascend</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {session ? (
            <>
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/schedule">Schedule</NavLink>
              <NavLink href="/forum">Forum</NavLink>
              <NavLink href="/lessons">Lessons</NavLink>
              <NavLink href="/journal">Journal</NavLink>

              {(session.user.role === 'instructor' || session.user.role === 'admin') && (
                <>
                  <span className="w-px h-4 bg-steel/50 mx-2 shrink-0" />
                  <NavLink href="/instructor" highlight>Instructor</NavLink>
                </>
              )}
              {session.user.role === 'admin' && (
                <NavLink href="/admin" highlight>Admin</NavLink>
              )}

              <span className="w-px h-4 bg-steel/50 mx-2 shrink-0" />
              <NavLink href="/settings">Settings</NavLink>
              <NavBadges />
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="ml-1 px-3 py-1.5 border border-ash text-paper text-sm font-medium hover:border-brand-red hover:text-brand-red transition-colors shrink-0"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-paper text-sm font-medium hover:text-brand-red transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="px-3 py-1.5 bg-brand-red text-paper text-sm font-bold tracking-wide hover:bg-brand-red-dark transition-colors">
                Join
              </Link>
            </>
          )}
        </nav>

        {/* Mobile: badges + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          {session && <NavBadges />}
          <button
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
            className="text-paper p-1"
          >
            {open ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-steel/30 bg-ink-soft px-4 py-3 flex flex-col">
          {session ? (
            <>
              <NavLink href="/dashboard" onClick={close}>Dashboard</NavLink>
              <NavLink href="/schedule" onClick={close}>Schedule</NavLink>
              <NavLink href="/forum" onClick={close}>Forum</NavLink>
              <NavLink href="/lessons" onClick={close}>Lessons</NavLink>
              <NavLink href="/journal" onClick={close}>Journal</NavLink>

              {(session.user.role === 'instructor' || session.user.role === 'admin') && (
                <>
                  <div className="h-px bg-steel/30 my-2" />
                  <NavLink href="/instructor" highlight onClick={close}>Instructor</NavLink>
                </>
              )}
              {session.user.role === 'admin' && (
                <NavLink href="/admin" highlight onClick={close}>Admin</NavLink>
              )}

              <div className="h-px bg-steel/30 my-2" />
              <NavLink href="/settings" onClick={close}>Settings</NavLink>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-left px-2 py-1 text-sm font-medium text-paper hover:text-brand-red transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <NavLink href="/login" onClick={close}>Sign In</NavLink>
              <NavLink href="/register" onClick={close}>Join</NavLink>
            </>
          )}
        </div>
      )}
    </header>
  )
}
