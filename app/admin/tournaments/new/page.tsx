'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewTournamentPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [format, setFormat] = useState('single_elim')
  const [isPublic, setIsPublic] = useState(false)

  const inputCls = 'w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'
  const labelCls = 'text-xs font-bold uppercase tracking-widest text-steel'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim() || !date || !format) { setError('Title, date, and format are required.'); return }
    setSaving(true)
    const res = await fetch('/api/admin/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, date, format, isPublic }),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      router.push(`/admin/tournaments/${data.tournament.id}`)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to create tournament.')
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-3">
        <Link href="/admin/tournaments" className="text-xs text-ash hover:text-ink transition-colors">← Tournaments</Link>
      </div>
      <div className="mb-6">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">New Tournament</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Create Tournament</h1>
      </div>

      <form onSubmit={submit} className="border border-smoke bg-paper p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="Spring Scrimmage 2026" />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Optional details about the event…" />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Date *</label>
          <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Format *</label>
          <select value={format} onChange={e => setFormat(e.target.value)} className={inputCls}>
            <option value="single_elim">Single Elimination</option>
            <option value="round_robin">Round Robin</option>
            <option value="double_elim">Double Elimination (coming soon)</option>
          </select>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm text-ink">Make results visible to the public</span>
        </label>
        {error && <p className="text-sm text-brand-red">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60">
            {saving ? 'Creating…' : 'Create Tournament'}
          </button>
        </div>
      </form>
    </div>
  )
}
