'use client'

import { useState } from 'react'
import { ALL_GROUPS, GROUP_LABELS, GROUP_DESCRIPTIONS } from '@/lib/classGroups'
import { ClassGroup } from '@prisma/client'

type Program = { id: string; name: string; description: string | null }

// Phase 52.5 — per-user class access. When the gym has defined its own class
// groups (programs), toggle those (blockedProgramIds). Otherwise fall back to
// the legacy fixed class groups (blockedClassGroups) — used by the demo gym.
export function ClassAccessManager({
  userId,
  blocked,
  programs,
  blockedProgramIds,
}: {
  userId: string
  blocked: ClassGroup[]
  programs: Program[]
  blockedProgramIds: string[]
}) {
  const useProgramMode = programs.length > 0
  const [blockedGroups, setBlockedGroups] = useState<ClassGroup[]>(blocked)
  const [blockedProgs, setBlockedProgs] = useState<string[]>(blockedProgramIds)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggleGroup(group: ClassGroup) {
    setBlockedGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group])
    setSaved(false)
  }
  function toggleProg(id: string) {
    setBlockedProgs(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    await fetch(`/api/admin/users/${userId}/class-access`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(useProgramMode ? { blockedProgramIds: blockedProgs } : { blockedClassGroups: blockedGroups }),
    })
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="border border-smoke bg-paper p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Class Access</p>
      <p className="text-xs text-ash mb-4">Unchecked class groups are grayed out on the student's schedule — they cannot register or check in.</p>
      <div className="flex flex-col gap-3 mb-4">
        {useProgramMode
          ? programs.map(p => {
              const isBlocked = blockedProgs.includes(p.id)
              return (
                <label key={p.id} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={!isBlocked} onChange={() => toggleProg(p.id)} className="mt-0.5 accent-brand-red" />
                  <div>
                    <p className="text-sm text-ink font-medium">{p.name}</p>
                    {p.description && <p className="text-xs text-ash">{p.description}</p>}
                  </div>
                </label>
              )
            })
          : ALL_GROUPS.map(group => {
              const isBlocked = blockedGroups.includes(group)
              return (
                <label key={group} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={!isBlocked} onChange={() => toggleGroup(group)} className="mt-0.5 accent-brand-red" />
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
