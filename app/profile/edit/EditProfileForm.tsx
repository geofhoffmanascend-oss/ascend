'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const WEIGHT_CLASSES = [
  'Rooster', 'Light-Feather', 'Feather', 'Light', 'Middle',
  'Medium-Heavy', 'Heavy', 'Super-Heavy', 'Ultra-Heavy',
]

type Props = {
  userId: string
  initial: {
    name: string
    bio: string
    phone: string
    emergencyContact: string
    avatarUrl: string
    weightClass: string
  }
}

export function EditProfileForm({ userId, initial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      setError('Failed to save. Please try again.')
      setSaving(false)
      return
    }

    router.push('/profile')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={e => update('name', e.target.value)}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          placeholder="Your full name"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Weight Class</label>
        <select
          value={form.weightClass}
          onChange={e => update('weightClass', e.target.value)}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
        >
          <option value="">— Not specified —</option>
          {WEIGHT_CLASSES.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <p className="text-xs text-ash mt-0.5">Used to group students by division on instructor rosters.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Bio</label>
        <textarea
          value={form.bio}
          onChange={e => update('bio', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
          placeholder="A little about your training background…"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Phone</label>
        <input
          type="tel"
          value={form.phone}
          onChange={e => update('phone', e.target.value)}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          placeholder="(555) 000-0000"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Emergency Contact</label>
        <input
          type="text"
          value={form.emergencyContact}
          onChange={e => update('emergencyContact', e.target.value)}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          placeholder="Name — (555) 000-0000"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Avatar URL</label>
        <input
          type="url"
          value={form.avatarUrl}
          onChange={e => update('avatarUrl', e.target.value)}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          placeholder="https://…"
        />
      </div>

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/profile')}
          className="px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
