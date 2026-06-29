'use client'

import type { TourRole } from '@/lib/tour/types'

// An inert, light-theme mimic of the real AscendIt app shell (dark header + light body).
// Nothing here navigates — links are spans/buttons with [data-tour] hooks for the spotlight.

const NAV: Record<TourRole, { label: string; hook?: string }[]> = {
  member: [
    { label: 'Dashboard' }, { label: 'Schedule', hook: 'nav-schedule' }, { label: 'Feed' },
    { label: 'Forums' }, { label: 'Lessons' }, { label: 'Journal' }, { label: 'Store' },
  ],
  gym: [
    { label: 'Dashboard' }, { label: 'Members' }, { label: 'Classes' },
    { label: 'Attendance' }, { label: 'Store' }, { label: 'Admin', hook: 'nav-admin' },
  ],
  instructor: [
    { label: 'Dashboard' }, { label: 'Schedule' }, { label: 'Availability' },
    { label: 'Lessons' }, { label: 'Forums' }, { label: 'Instructor', hook: 'nav-inst' },
  ],
}

function Icon({ d, title }: { d: string; title: string }) {
  return (
    <span title={title} className="p-1.5 text-paper/60 inline-flex">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d={d} />
      </svg>
    </span>
  )
}

export function MockShell({
  role,
  navOpen,
  onToggleNav,
  children,
}: {
  role: TourRole
  navOpen: boolean
  onToggleNav: () => void
  children: React.ReactNode
}) {
  const links = NAV[role]
  return (
    <div className="min-h-full bg-paper flex flex-col">
      {/* Header (mimics app/components/Header.tsx) */}
      <header className="bg-ink-soft border-b border-steel/30 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="AscendIt" width={32} height={32} className="object-contain" />
            <span className="hidden sm:block font-display font-bold text-paper text-lg tracking-tight">AscendIt</span>
          </span>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-end">
            {links.map((l) => (
              <span
                key={l.label}
                data-tour={l.hook}
                className={`px-1.5 py-1 text-sm font-medium shrink-0 ${
                  l.hook?.startsWith('nav-admin') || l.hook?.startsWith('nav-inst') ? 'text-brand-red' : 'text-paper'
                }`}
              >
                {l.label}
              </span>
            ))}
            <span className="w-px h-4 bg-steel/50 mx-1.5 shrink-0" />
            <Icon title="Profile" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20c0-4 3.6-7 8-7s8 3 8 7" />
            <Icon title="Settings" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <Icon title="Help" d="M12 17h.01M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            data-tour="nav-menu"
            onClick={onToggleNav}
            className="md:hidden p-2 text-paper"
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>

        {/* Mobile dropdown */}
        {navOpen && (
          <div className="md:hidden border-t border-steel/30 bg-ink-soft px-4 py-2 flex flex-col">
            {links.map((l) => (
              <span key={l.label} className="py-2 text-sm font-medium text-paper border-b border-steel/20 last:border-0">
                {l.label}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Demo ribbon */}
      <div className="bg-brand-red/10 border-b border-brand-red/20 text-center py-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-red">Demo — sample data</span>
      </div>

      {/* Body */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  )
}
