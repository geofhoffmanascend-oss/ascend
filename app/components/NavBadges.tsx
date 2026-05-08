'use client'

import Link from 'next/link'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function NavBadges() {
  const { data: notif } = useSWR('/api/notifications/unread-count', fetcher, { refreshInterval: 30000 })
  const { data: msg }   = useSWR('/api/messages/unread-count',      fetcher, { refreshInterval: 30000 })

  const notifCount = notif?.count ?? 0
  const msgCount   = msg?.count   ?? 0

  return (
    <div className="flex items-center gap-3">
      <Link href="/messages" className="relative text-paper hover:text-brand-red transition-colors" aria-label="Messages">
        <EnvelopeIcon />
        {msgCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-brand-red text-paper text-[10px] font-bold flex items-center justify-center leading-none">
            {msgCount > 99 ? '99+' : msgCount}
          </span>
        )}
      </Link>

      <Link href="/notifications" className="relative text-paper hover:text-brand-red transition-colors" aria-label="Notifications">
        <BellIcon />
        {notifCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-brand-red text-paper text-[10px] font-bold flex items-center justify-center leading-none">
            {notifCount > 99 ? '99+' : notifCount}
          </span>
        )}
      </Link>
    </div>
  )
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function EnvelopeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}
