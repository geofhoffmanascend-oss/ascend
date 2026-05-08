'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Person = { id: string; name: string | null }

export function NewLessonForm({ instructors, students }: { instructors: Person[]; students: Person[] }) {
  const router = useRouter()
  const [form, setForm] = useState({
    instructorId: '',
    scheduledAt: '',
    durationMins: '60',
    ukeId: '',
    location: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.instructorId || !form.scheduledAt) { setError('Instructor and date/time are required'); return }
    setSaving(true)
    setError('')

    const res = await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, durationMins: Number(form.durationMins), ukeId: form.ukeId || null }),
    })

    if (!res.ok) { setError('Failed to submit request.'); setSaving(false); return }
    router.push('/lessons')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Instructor *</label>
        <select
          value={form.instructorId}
          onChange={e => update('instructorId', e.target.value)}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
        >
          <option value="">Select instructor…</option>
          {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Date & Time *</label>
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={e => update('scheduledAt', e.target.value)}
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Duration</label>
          <select
            value={form.durationMins}
            onChange={e => update('durationMins', e.target.value)}
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          >
            <option value="30">30 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
            <option value="120">120 min</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Uke (optional)</label>
        <select
          value={form.ukeId}
          onChange={e => update('ukeId', e.target.value)}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
        >
          <option value="">None</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Location</label>
        <input
          type="text"
          value={form.location}
          onChange={e => update('location', e.target.value)}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          placeholder="Mat room, private gym, etc."
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => update('notes', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
          placeholder="What do you want to work on?"
        />
      </div>

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60"
        >
          {saving ? 'Submitting…' : 'Request Lesson'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/lessons')}
          className="px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
