'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ProviderApply() {
  const router = useRouter()
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const res = await fetch('/api/provider/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio, city, state, zip }),
    })
    setSaving(false)
    if (res.ok) { router.refresh() }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Could not submit.') }
  }

  const inputCls = 'w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'
  const labelCls = 'text-xs font-bold uppercase tracking-widest text-steel'

  return (
    <form onSubmit={submit} className="border border-smoke bg-paper p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className={labelCls}>About you (optional)</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Experience, style, what you offer…" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>City</label>
          <input value={city} onChange={e => setCity(e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>State</label>
          <input value={state} onChange={e => setState(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelCls}>ZIP</label>
        <input value={zip} onChange={e => setZip(e.target.value)} className={`${inputCls} max-w-[140px]`} />
      </div>
      <p className="text-xs text-ash -mt-1">Your location is used so students nearby can find you. A verified black belt reviews every application.</p>
      {error && <p className="text-sm text-brand-red">{error}</p>}
      <button type="submit" disabled={saving} className="self-start px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60">
        {saving ? 'Submitting…' : 'Apply to offer lessons'}
      </button>
    </form>
  )
}
