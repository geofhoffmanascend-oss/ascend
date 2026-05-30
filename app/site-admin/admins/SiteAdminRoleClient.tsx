'use client'

import { useState } from 'react'

interface User {
  id: string
  name: string | null
  email: string | null
  roles?: string[]
  createdAt?: string
}

interface Props {
  currentUserId: string
  siteAdmins: User[]
  allUsers: User[]
}

export function SiteAdminRoleClient({ currentUserId, siteAdmins: initial, allUsers }: Props) {
  const [admins, setAdmins] = useState(initial)
  const [search, setSearch] = useState('')
  const [working, setWorking] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  const adminIds = new Set(admins.map(a => a.id))

  const candidates = allUsers.filter(u =>
    !adminIds.has(u.id) &&
    (search === '' ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()))
  )

  async function grant(user: User) {
    setWorking(user.id)
    const res = await fetch(`/api/site-admin/users/${user.id}/site-admin-role`, { method: 'PUT' })
    if (res.ok) setAdmins(prev => [...prev, { ...user, createdAt: new Date().toISOString() }])
    setWorking(null)
  }

  async function revoke(userId: string) {
    setWorking(userId)
    const res = await fetch(`/api/site-admin/users/${userId}/site-admin-role`, { method: 'DELETE' })
    if (res.ok) setAdmins(prev => prev.filter(a => a.id !== userId))
    setWorking(null)
    setConfirming(null)
  }

  const secondaryBtn = 'px-4 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors disabled:opacity-50'
  const primaryBtn = 'px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50'

  return (
    <div className="flex flex-col gap-8">
      {/* Current site admins */}
      <div className="border border-smoke bg-paper p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">
          Current Site Admins ({admins.length})
        </p>
        <div className="flex flex-col gap-2">
          {admins.map(admin => (
            <div key={admin.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">{admin.name ?? '(no name)'}</p>
                <p className="text-xs text-ash">{admin.email}</p>
              </div>
              {admin.id === currentUserId ? (
                <span className="text-xs text-ash italic">You</span>
              ) : confirming === admin.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ash">Revoke access?</span>
                  <button onClick={() => revoke(admin.id)} disabled={!!working} className={primaryBtn}>
                    {working === admin.id ? '…' : 'Confirm'}
                  </button>
                  <button onClick={() => setConfirming(null)} className={secondaryBtn}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirming(admin.id)} disabled={!!working} className={secondaryBtn}>
                  Revoke
                </button>
              )}
            </div>
          ))}
          {admins.length === 0 && <p className="text-sm text-ash italic">No site admins yet.</p>}
        </div>
      </div>

      {/* Grant to existing user */}
      <div className="border border-smoke bg-paper p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">Grant Site Admin Role</p>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red mb-4"
        />
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {candidates.slice(0, 20).map(user => (
            <div key={user.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-ink truncate">{user.name ?? '(no name)'}</p>
                <p className="text-xs text-ash truncate">{user.email}</p>
              </div>
              <button
                onClick={() => grant(user)}
                disabled={!!working}
                className="flex-shrink-0 px-3 py-1.5 bg-brand-red text-paper text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {working === user.id ? '…' : 'Grant'}
              </button>
            </div>
          ))}
          {candidates.length === 0 && search && (
            <p className="text-sm text-ash italic">No users found.</p>
          )}
          {candidates.length === 0 && !search && (
            <p className="text-sm text-ash italic">All users are already site admins.</p>
          )}
        </div>
      </div>
    </div>
  )
}
