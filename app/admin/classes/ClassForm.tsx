'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Instructor = { id: string; name: string | null }
type Program = { id: string; name: string }

type Props = {
  instructors: Instructor[]
  programs?: Program[]
  initial?: {
    id: string
    title: string
    description?: string
    type: string
    dayOfWeek: string
    startTime: string
    endTime: string
    location: string
    instructorId: string
    maxStudents: string
    isActive: boolean
    programId?: string
  }
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const TYPES = ['gi', 'nogi', 'open_mat', 'kids', 'competition_prep', 'seminar', 'fundamentals', 'nogi_fundamentals', 'muay_thai', 'wrestling', 'self_defense']
const TYPE_LABELS: Record<string, string> = {
  gi: 'Gi', nogi: 'No-Gi', open_mat: 'Open Mat', kids: 'Kids',
  competition_prep: 'Comp Prep', seminar: 'Seminar', fundamentals: 'Basics (Gi)',
  nogi_fundamentals: 'Basics (No-Gi)', muay_thai: 'Muay Thai',
  wrestling: 'Wrestling', self_defense: 'Self Defense',
}

export function ClassForm({ instructors, programs = [], initial }: Props) {
  const router = useRouter()
  const isEdit = !!initial?.id
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    type: initial?.type ?? 'gi',
    dayOfWeek: initial?.dayOfWeek ?? 'monday',
    startTime: initial?.startTime ?? '18:00',
    endTime: initial?.endTime ?? '19:30',
    location: initial?.location ?? '',
    instructorId: initial?.instructorId ?? '',
    maxStudents: initial?.maxStudents ?? '',
    isActive: initial?.isActive ?? true,
    programId: initial?.programId ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleDelete() {
    if (!isEdit) return
    if (!confirm('Delete this class permanently? This removes the class, its own discussion forum, and all of its sessions, registrations, and attendance history. Its class group (and the class group\'s forum) are not affected. To keep history, uncheck "Active" instead.')) return
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/classes/${initial!.id}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Failed to delete.'); setSaving(false); return }
    router.push('/admin/classes')
    router.refresh()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.instructorId) { setError('Title and instructor are required'); return }
    setSaving(true)
    setError('')

    const url = isEdit ? `/api/admin/classes/${initial!.id}` : '/api/admin/classes'
    const method = isEdit ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed to save.'); setSaving(false); return }
    router.push('/admin/classes')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Title *</label>
        <input type="text" value={form.title} onChange={e => update('title', e.target.value)}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          placeholder="e.g. Monday Night Gi" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Description <span className="normal-case font-normal text-ash">(optional)</span></label>
        <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={2}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
          placeholder="What this class covers…" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Type</label>
          <select value={form.type} onChange={e => update('type', e.target.value)}
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors">
            {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Day</label>
          <select value={form.dayOfWeek} onChange={e => update('dayOfWeek', e.target.value)}
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors">
            {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Start Time</label>
          <input type="time" value={form.startTime} onChange={e => update('startTime', e.target.value)}
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">End Time</label>
          <input type="time" value={form.endTime} onChange={e => update('endTime', e.target.value)}
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Instructor *</label>
        <select value={form.instructorId} onChange={e => update('instructorId', e.target.value)}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors">
          <option value="">Select instructor…</option>
          {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </div>

      {programs.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Class Group</label>
          <select value={form.programId} onChange={e => update('programId', e.target.value)}
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors">
            <option value="">No class group (ungrouped)</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Location</label>
          <input type="text" value={form.location} onChange={e => update('location', e.target.value)}
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
            placeholder="Mat room, etc." />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Max Members</label>
          <input type="number" value={form.maxStudents} onChange={e => update('maxStudents', e.target.value)}
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
            placeholder="Leave blank for unlimited" min="1" />
        </div>
      </div>

      {isEdit && (
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className={`w-5 h-5 border flex items-center justify-center transition-colors ${form.isActive ? 'bg-brand-red border-brand-red' : 'border-smoke'}`}
            onClick={() => update('isActive', !form.isActive)}
          >
            {form.isActive && <span className="text-paper text-xs leading-none">✓</span>}
          </div>
          <span className="text-sm text-ink">Active</span>
        </label>
      )}

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Class'}
        </button>
        <button type="button" onClick={() => router.push('/admin/classes')}
          className="px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors">
          Cancel
        </button>
        {isEdit && (
          <button type="button" onClick={handleDelete} disabled={saving}
            className="ml-auto px-6 py-3 border border-brand-red text-brand-red text-sm font-medium hover:bg-brand-red hover:text-paper transition-colors disabled:opacity-60">
            Delete Class
          </button>
        )}
      </div>
    </form>
  )
}
