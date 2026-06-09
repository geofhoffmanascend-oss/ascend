'use client'

import { useState } from 'react'

export function GymLogoForm({ initial }: { initial: { logoUrl: string; name: string; description: string } }) {
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl)
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Gym name cannot be empty.'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/gym', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl, name, description }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to save')
      }
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <div className="border border-smoke bg-paper p-6 flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Gym Profile</p>
        <p className="text-xs text-ash -mt-2">
          Your gym name, description, and logo as shown on your public gym page and forums.
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Gym Name</label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setSaved(false) }}
            placeholder="Your gym name"
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Description</label>
          <textarea
            value={description}
            onChange={e => { setDescription(e.target.value); setSaved(false) }}
            rows={3}
            placeholder="Tell members about your gym…"
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          />
        </div>

        <div className="flex items-start gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Gym logo preview"
              className="w-16 h-16 object-contain border border-smoke bg-mist flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 border border-smoke bg-mist flex items-center justify-center text-xs text-ash flex-shrink-0">
              No logo
            </div>
          )}
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-widest text-steel">Logo URL</label>
            <input
              type="url"
              value={logoUrl}
              onChange={e => { setLogoUrl(e.target.value); setSaved(false) }}
              placeholder="https://…/logo.png"
              className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
        {saved && <p className="text-sm text-steel">Saved.</p>}
        {error && <p className="text-sm text-brand-red">{error}</p>}
      </div>
    </form>
  )
}
