'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Instructor = { id: string; name: string | null }
type Program = { id: string; name: string }

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const DAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}
const TYPES = ['gi', 'nogi', 'open_mat', 'kids', 'competition_prep', 'seminar', 'fundamentals', 'nogi_fundamentals', 'muay_thai', 'wrestling', 'self_defense']
const TYPE_LABELS: Record<string, string> = {
  gi: 'Gi', nogi: 'No-Gi', open_mat: 'Open Mat', kids: 'Kids',
  competition_prep: 'Comp Prep', seminar: 'Seminar', fundamentals: 'Basics (Gi)',
  nogi_fundamentals: 'Basics (No-Gi)', muay_thai: 'Muay Thai',
  wrestling: 'Wrestling', self_defense: 'Self Defense',
}

const inputCls = 'w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'
const labelCls = 'text-xs font-bold uppercase tracking-widest text-steel'

export function ClassWizard({ instructors, programs }: { instructors: Instructor[]; programs: Program[] }) {
  const router = useRouter()
  const [programId, setProgramId] = useState('')
  const [form, setForm] = useState({
    title: '', type: 'gi', startTime: '18:00', endTime: '19:30', location: '', instructorId: '', maxStudents: '',
  })
  const [days, setDays] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }
  function toggleDay(d: string) {
    setDays(ds => ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d])
  }

  async function submit(addAnother: boolean) {
    setError('')
    setNotice('')
    if (!form.title.trim() || !form.instructorId) { setError('Title and instructor are required'); return }
    if (days.length === 0) { setError('Select at least one day'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/classes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, programId: programId || undefined, days }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create classes')

      const skipped = (data.skipped ?? []) as string[]
      const skipNote = skipped.length ? ` (skipped ${skipped.map(d => DAY_SHORT[d] ?? d).join(', ')} — already existed)` : ''

      if (addAnother) {
        setNotice(`Created ${data.created} class${data.created !== 1 ? 'es' : ''}${skipNote}. Add another below — program kept.`)
        setForm(f => ({ ...f, title: '' }))
        setDays([])
        setSaving(false)
      } else {
        router.push('/admin/classes')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Program */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Program</label>
        <select value={programId} onChange={e => setProgramId(e.target.value)} className={inputCls}>
          <option value="">No program (ungrouped)</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <p className="text-xs text-ash">
          {programs.length === 0 ? 'No programs yet. ' : ''}
          <Link href="/admin/programs" className="text-brand-red hover:underline">Manage programs →</Link>
        </p>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Title <span className="text-brand-red">*</span></label>
        <input value={form.title} onChange={e => update('title', e.target.value)} className={inputCls} placeholder="e.g. Evening Gi" />
      </div>

      {/* Days */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Days <span className="text-brand-red">*</span></label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(d => {
            const on = days.includes(d)
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                aria-pressed={on}
                className={`px-3 py-2 text-sm font-semibold border transition-colors ${
                  on ? 'bg-brand-red border-brand-red text-paper' : 'border-smoke text-steel hover:border-steel hover:text-ink'
                }`}
              >
                {DAY_SHORT[d]}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-ash">Creates one class per selected day, at the same time.</p>
      </div>

      {/* Type + times */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Type</label>
          <select value={form.type} onChange={e => update('type', e.target.value)} className={inputCls}>
            {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Instructor <span className="text-brand-red">*</span></label>
          <select value={form.instructorId} onChange={e => update('instructorId', e.target.value)} className={inputCls}>
            <option value="">Select…</option>
            {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Start Time</label>
          <input type="time" value={form.startTime} onChange={e => update('startTime', e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>End Time</label>
          <input type="time" value={form.endTime} onChange={e => update('endTime', e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Location</label>
          <input value={form.location} onChange={e => update('location', e.target.value)} className={inputCls} placeholder="Mat room…" />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Max Students</label>
          <input type="number" value={form.maxStudents} onChange={e => update('maxStudents', e.target.value)} className={inputCls} placeholder="Unlimited" min="1" />
        </div>
      </div>

      {notice && <p className="text-sm text-steel">{notice}</p>}
      {error && <p className="text-sm text-brand-red">{error}</p>}

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="button" onClick={() => submit(false)} disabled={saving}
          className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60">
          {saving ? 'Saving…' : 'Create & Finish'}
        </button>
        <button type="button" onClick={() => submit(true)} disabled={saving}
          className="px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors disabled:opacity-60">
          Create & Add Another
        </button>
      </div>
    </div>
  )
}
