'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ALL_ROLES = ['student', 'instructor', 'vendor', 'admin'] as const
type Role = typeof ALL_ROLES[number]

export function RoleManager({ userId, currentRoles }: { userId: string; currentRoles: string[] }) {
  const [roles, setRoles] = useState<Role[]>(currentRoles as Role[])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function toggle(role: Role) {
    if (role === 'student') return // student is always required
    setRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  async function save() {
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/admin/users/${userId}/roles`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles }),
    })
    setSaving(false)
    if (!res.ok) {
      setError('Failed to update roles.')
    } else {
      router.refresh()
    }
  }

  const changed = JSON.stringify([...roles].sort()) !== JSON.stringify([...currentRoles].sort())

  return (
    <div className="border border-smoke bg-paper p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">Roles</p>
      <div className="flex flex-wrap gap-3 mb-4">
        {ALL_ROLES.map(role => {
          const active = roles.includes(role)
          const locked = role === 'student'
          return (
            <button
              key={role}
              onClick={() => toggle(role)}
              disabled={locked}
              className={`px-4 py-2 text-sm font-medium border transition-colors capitalize ${
                active
                  ? 'bg-ink text-paper border-ink'
                  : 'bg-paper text-steel border-smoke hover:border-steel'
              } ${locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {role}
              {locked && <span className="ml-1 text-xs opacity-60">(required)</span>}
            </button>
          )
        })}
      </div>
      {error && <p className="text-xs text-brand-red mb-3">{error}</p>}
      <button
        onClick={save}
        disabled={!changed || saving}
        className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving…' : 'Save Roles'}
      </button>
    </div>
  )
}
