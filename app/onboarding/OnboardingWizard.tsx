'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const BELTS = ['white', 'blue', 'purple', 'brown', 'black'] as const

export function OnboardingWizard({ userId }: { userId: string }) {
  const router = useRouter()
  const [form, setForm] = useState({
    bio: '',
    phone: '',
    emergencyContact: '',
    belt: 'white',
    stripes: 0,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, onboardingDone: true }),
    })

    if (!res.ok) {
      setError('Failed to save. Please try again.')
      setSaving(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Bio</label>
        <textarea
          value={form.bio}
          onChange={e => update('bio', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
          placeholder="A little about your training background…"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Belt</label>
          <select
            value={form.belt}
            onChange={e => update('belt', e.target.value)}
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          >
            {BELTS.map(b => (
              <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Stripes</label>
          <select
            value={form.stripes}
            onChange={e => update('stripes', Number(e.target.value))}
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          >
            {[0, 1, 2, 3, 4].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
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

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Continue to Dashboard'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
        >
          Skip for now
        </button>
      </div>
    </form>
  )
}
