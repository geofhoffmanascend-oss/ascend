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
      className={`px-1.5 py-1 text-sm font-medium transition-colors shrink-0 ${
        highlight ? 'text-brand-red hover:text-red-400' : 'text-paper hover:text-brand-red'
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
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href={session ? '/dashboard' : '/'} className="flex items-center gap-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="AscendIt" width={36} height={36} className="object-contain" />
          <span className="hidden sm:block font-display font-bold text-paper text-lg tracking-tight">AscendIt</span>
        </Link>

        {/* Desktop nav — visible at md+ */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-end">
          {session ? (
            <>
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/schedule">Schedule</NavLink>
              <NavLink href="/forum">Forum</NavLink>
              <NavLink href="/events">Events</NavLink>
              <NavLink href="/lessons">Lessons</NavLink>
              <NavLink href="/journal">Journal</NavLink>
              <NavLink href="/gallery">Gallery</NavLink>
              <NavLink href="/store">Store</NavLink>

              {(session.user.roles?.includes('instructor') || session.user.roles?.includes('admin')) && (
                <>
                  <span className="w-px h-4 bg-steel/50 mx-1.5 shrink-0" />
                  <NavLink href="/instructor" highlight>Instructor</NavLink>
                </>
              )}
              {session.user.roles?.includes('vendor') && !session.user.roles?.includes('admin') && (
                <NavLink href="/vendor" highlight>Vendor</NavLink>
              )}
              {session.user.roles?.includes('admin') && (
                <NavLink href="/admin" highlight>Admin</NavLink>
              )}
              {session.user.roles?.includes('site_admin') && (
                <NavLink href="/site-admin" highlight>Site Admin</NavLink>
              )}

              <span className="w-px h-4 bg-steel/50 mx-1.5 shrink-0" />
              <NavBadges />

              {/* Profile icon */}
              <Link href="/profile" title="My Profile"
                className="p-1.5 text-paper/60 hover:text-paper transition-colors shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </Link>

              {/* Settings icon */}
              <Link href="/settings" title="Settings"
                className="p-1.5 text-paper/60 hover:text-paper transition-colors shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </Link>

              {/* Help icon */}
              <Link href="/help" title="Help"
                className="p-1.5 text-paper/60 hover:text-paper transition-colors shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </Link>

              {/* Sign out icon */}
              <button onClick={() => signOut({ callbackUrl: '/' })} title="Sign Out"
                className="p-1.5 text-paper/60 hover:text-paper transition-colors shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-paper text-sm font-medium hover:text-brand-red transition-colors px-2">
                Sign In
              </Link>
              <Link href="/register" className="px-3 py-1.5 bg-brand-red text-paper text-sm font-bold tracking-wide hover:bg-red-700 transition-colors">
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
              <NavLink href="/events" onClick={close}>Events</NavLink>
              <NavLink href="/lessons" onClick={close}>Lessons</NavLink>
              <NavLink href="/journal" onClick={close}>Journal</NavLink>
              <NavLink href="/gallery" onClick={close}>Gallery</NavLink>
              <NavLink href="/store" onClick={close}>Store</NavLink>

              {(session.user.roles?.includes('instructor') || session.user.roles?.includes('admin')) && (
                <>
                  <div className="h-px bg-steel/30 my-2" />
                  <NavLink href="/instructor" highlight onClick={close}>Instructor</NavLink>
                </>
              )}
              {session.user.roles?.includes('vendor') && !session.user.roles?.includes('admin') && (
                <NavLink href="/vendor" highlight onClick={close}>Vendor</NavLink>
              )}
              {session.user.roles?.includes('admin') && (
                <NavLink href="/admin" highlight onClick={close}>Admin</NavLink>
              )}
              {session.user.roles?.includes('site_admin') && (
                <NavLink href="/site-admin" highlight onClick={close}>Site Admin</NavLink>
              )}

              <div className="h-px bg-steel/30 my-2" />
              <NavLink href="/profile" onClick={close}>Profile</NavLink>
              <NavLink href="/settings" onClick={close}>Settings</NavLink>
              <NavLink href="/help" onClick={close}>Help</NavLink>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-left px-1.5 py-1 text-sm font-medium text-paper hover:text-brand-red transition-colors"
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
