'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ChatsClient({ myGymId, myGymName }: { myGymId: string | null; myGymName: string | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [associate, setAssociate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function create() {
    if (!title.trim()) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/group-chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, gymId: associate ? myGymId : null }),
    })
    setSaving(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Could not create.'); return }
    const { id } = await res.json()
    router.push(`/chats/${id}`)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mb-6 bg-brand-red text-paper font-bold text-sm tracking-wide px-4 py-2 hover:bg-red-700 transition-colors">
        + Start a group chat
      </button>
    )
  }

  return (
    <div className="border border-smoke bg-mist/40 p-4 mb-6 flex flex-col gap-3">
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Chat name (e.g. Tuesday Open Mat crew)"
        className="w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red"
        autoFocus
      />
      {myGymId && (
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
          <input type="checkbox" checked={associate} onChange={e => setAssociate(e.target.checked)} className="w-4 h-4 accent-brand-red" />
          Associate with {myGymName ?? 'my gym'} <span className="text-xs text-slate">(easier to find; people from other gyms can still be invited)</span>
        </label>
      )}
      {error && <p className="text-sm text-brand-red">{error}</p>}
      <div className="flex gap-2">
        <button onClick={create} disabled={saving || !title.trim()} className="bg-brand-red text-paper font-bold text-sm px-4 py-2 hover:bg-red-700 transition-colors disabled:opacity-50">
          {saving ? 'Creating…' : 'Create'}
        </button>
        <button onClick={() => setOpen(false)} className="border border-smoke text-steel text-sm font-medium px-4 py-2">Cancel</button>
      </div>
    </div>
  )
}
