'use client'

import Link from 'next/link'
import { TOURS } from '@/lib/tour'
import type { TourRole } from '@/lib/tour/types'

// Role-aware "replay tour" links, used in Settings and Help.
export function TourReplayButton({ roles }: { roles: TourRole[] }) {
  if (roles.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((r) => (
        <Link
          key={r}
          href={TOURS[r].href}
          className="inline-block bg-brand-red text-paper font-bold text-sm tracking-wide px-4 py-2 hover:bg-red-700 transition-colors"
        >
          {roles.length > 1 ? TOURS[r].label : 'Take the tour'}
        </Link>
      ))}
    </div>
  )
}
