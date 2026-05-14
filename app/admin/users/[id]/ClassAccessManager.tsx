'use client'

import { useState } from 'react'
import { ALL_GROUPS, GROUP_LABELS, GROUP_DESCRIPTIONS } from '@/lib/classGroups'
import { ClassGroup } from '@prisma/client'

export function ClassAccessManager({ userId, blocked }: { userId: string; blocked: ClassGroup[] }) {
  const [blockedGroups, setBlockedGroups] = useState<ClassGroup[]>(blocked)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggle(group: ClassGroup) {
    setBlockedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    )
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    await fetch(`/api/admin/users/${userId}/class-access`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockedClassGroups: blockedGroups }),
    })
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="border border-smoke bg-paper p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Class Access</p>
      <p className="text-xs text-ash mb-4">Blocked groups are grayed out on the student's schedule — they cannot register or check in.</p>
      <div className="flex flex-col gap-3 mb-4">
        {ALL_GROUPS.map(group => {
          const isBlocked = blockedGroups.includes(group)
          return (
            <label key={group} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!isBlocked}
                onChange={() => toggle(group)}
                className="mt-0.5 accent-brand-red"
              />
              <div>
                <p className="text-sm text-ink font-medium">{GROUP_LABELS[group]}</p>
                <p className="text-xs text-ash">{GROUP_DESCRIPTIONS[group]}</p>
              </div>
            </label>
          )
        })}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save Access'}
        </button>
        {saved && <span className="text-xs text-ash">Saved</span>}
      </div>
    </div>
  )
}
