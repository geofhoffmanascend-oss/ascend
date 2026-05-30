'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Gym {
  id: string
  name: string
  slug: string
  participatingStatus: string
  headInstructorName: string | null
  city: string | null
  state: string | null
  createdAt: string
  memberCount: number
}

const TIER_STYLES: Record<string, string> = {
  participating: 'bg-green-100 text-green-700',
  free: 'bg-mist text-steel',
  inactive: 'bg-red-50 text-red-600',
}

export function GymListClient({ gyms, total, page, limit }: { gyms: Gym[]; total: number; page: number; limit: number }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  function applyFilter() {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', '1')
    router.push(`/site-admin/gyms?${params}`)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && applyFilter()}
          placeholder="Search by name…"
          className="px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none"
        >
          <option value="">All tiers</option>
          <option value="free">Free</option>
          <option value="participating">Participating</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={applyFilter} className="px-4 py-2 bg-brand-red text-paper text-sm font-bold hover:bg-red-700 transition-colors">
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="border border-smoke overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-mist border-b border-smoke">
            <tr>
              {['Name', 'Tier', 'Members', 'Head Instructor', 'Location', 'Created'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-steel">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-smoke">
            {gyms.map(gym => (
              <tr key={gym.id} className="hover:bg-mist/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/site-admin/gyms/${gym.id}`} className="text-brand-red hover:underline font-medium">
                    {gym.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-1.5 py-0.5 text-xs font-bold uppercase ${TIER_STYLES[gym.participatingStatus]}`}>
                    {gym.participatingStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink">{gym.memberCount}</td>
                <td className="px-4 py-3 text-ash">{gym.headInstructorName ?? '—'}</td>
                <td className="px-4 py-3 text-ash">{[gym.city, gym.state].filter(Boolean).join(', ') || '—'}</td>
                <td suppressHydrationWarning className="px-4 py-3 text-ash">{new Date(gym.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
              </tr>
            ))}
            {gyms.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ash italic">No gyms found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 mt-4">
          {page > 1 && (
            <Link href={`/site-admin/gyms?page=${page - 1}`} className="text-sm text-ash hover:text-ink transition-colors">← Prev</Link>
          )}
          <span className="text-xs text-ash">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`/site-admin/gyms?page=${page + 1}`} className="text-sm text-ash hover:text-ink transition-colors">Next →</Link>
          )}
        </div>
      )}
    </div>
  )
}
