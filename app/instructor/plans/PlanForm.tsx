'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Class = { id: string; title: string }

type Props = {
  classes: Class[]
  initial?: {
    id: string
    title: string
    techniques: string
    notes: string
    videoUrls: string[]
    classId: string
  }
}

export function PlanForm({ classes, initial }: Props) {
  const router = useRouter()
  const isEdit = !!initial?.id
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    techniques: initial?.techniques ?? '',
    notes: initial?.notes ?? '',
    videoUrls: initial?.videoUrls?.join('\n') ?? '',
    classId: initial?.classId ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')

    const videoUrls = form.videoUrls
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean)

    const url = isEdit ? `/api/instructor/plans/${initial!.id}` : '/api/instructor/plans'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, videoUrls, classId: form.classId || null }),
    })

    if (!res.ok) { setError('Failed to save.'); setSaving(false); return }

    router.push('/instructor/plans')
    router.refresh()
  }

  async function handleDelete() {
    if (!initial?.id) return
    await fetch(`/api/instructor/plans/${initial.id}`, { method: 'DELETE' })
    router.push('/instructor/plans')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => update('title', e.target.value)}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          placeholder="e.g. Double-leg takedown series"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Attach to Class</label>
        <select
          value={form.classId}
          onChange={e => update('classId', e.target.value)}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
        >
          <option value="">— None —</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Techniques</label>
        <textarea
          value={form.techniques}
          onChange={e => update('techniques', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
          placeholder="List the techniques to cover…"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => update('notes', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
          placeholder="Additional notes…"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Video URLs</label>
        <textarea
          value={form.videoUrls}
          onChange={e => update('videoUrls', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none font-mono"
          placeholder="One URL per line"
        />
      </div>

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Plan'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/instructor/plans')}
          className="px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
        >
          Cancel
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="ml-auto px-4 py-3 text-sm text-ash hover:text-brand-red transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  )
}
