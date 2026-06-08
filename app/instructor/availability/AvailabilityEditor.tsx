'use client'

import { useEffect, useState } from 'react'

type Entry = {
  id: string
  kind: 'recurring' | 'oneoff' | 'block'
  dayOfWeek: string | null
  date: string | null
  startTime: string
  endTime: string
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABEL: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' }

const input = 'px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'

export function AvailabilityEditor() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [outside, setOutside] = useState(false)
  const [loading, setLoading] = useState(true)
  const [kind, setKind] = useState<'recurring' | 'oneoff' | 'block'>('recurring')
  const [dayOfWeek, setDayOfWeek] = useState('monday')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('16:00')
  const [endTime, setEndTime] = useState('18:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/instructor/availability').then(r => r.json()).then(d => {
      setEntries(d.entries ?? [])
      setOutside(d.acceptsOutsideOrg ?? false)
      setLoading(false)
    })
  }, [])

  async function add() {
    setError('')
    if (kind !== 'recurring' && !date) { setError('Pick a date'); return }
    setSaving(true)
    const res = await fetch('/api/instructor/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, dayOfWeek, date: date || undefined, startTime, endTime }),
    })
    const data = await res.json()
    if (res.ok) setEntries(e => [...e, data.entry])
    else setError(data.error ?? 'Failed to add')
    setSaving(false)
  }

  async function remove(id: string) {
    await fetch(`/api/instructor/availability/${id}`, { method: 'DELETE' })
    setEntries(e => e.filter(x => x.id !== id))
  }

  async function toggleOutside() {
    const next = !outside
    setOutside(next)
    await fetch('/api/instructor/availability', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acceptsOutsideOrg: next }) })
  }

  const recurring = entries.filter(e => e.kind === 'recurring')
  const oneoff = entries.filter(e => e.kind === 'oneoff')
  const blocks = entries.filter(e => e.kind === 'block')

  function fmtDate(d: string | null) {
    return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : ''
  }

  function Row({ e, label }: { e: Entry; label: string }) {
    return (
      <div className="flex items-center justify-between border border-smoke bg-paper px-3 py-2">
        <span className="text-sm text-ink">{label} · {e.startTime}–{e.endTime}</span>
        <button onClick={() => remove(e.id)} className="text-xs font-semibold text-brand-red hover:underline">Remove</button>
      </div>
    )
  }

  if (loading) return <div className="h-32 bg-mist animate-pulse border border-smoke" />

  return (
    <div className="flex flex-col gap-6">
      {/* Add form */}
      <div className="border border-smoke bg-paper p-5 flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Add availability</p>
        <div className="flex flex-wrap gap-2">
          <select value={kind} onChange={e => setKind(e.target.value as any)} className={input}>
            <option value="recurring">Weekly (recurring)</option>
            <option value="oneoff">One-off date</option>
            <option value="block">Block / time off</option>
          </select>
          {kind === 'recurring' ? (
            <select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} className={input}>
              {DAYS.map(d => <option key={d} value={d}>{DAY_LABEL[d]}</option>)}
            </select>
          ) : (
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={input} />
          )}
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={input} />
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={input} />
        </div>
        {error && <p className="text-sm text-brand-red">{error}</p>}
        <button onClick={add} disabled={saving} className="self-start px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60">
          {saving ? 'Adding…' : 'Add'}
        </button>
      </div>

      {recurring.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Weekly</p>
          {recurring.map(e => <Row key={e.id} e={e} label={DAY_LABEL[e.dayOfWeek ?? ''] ?? e.dayOfWeek ?? ''} />)}
        </section>
      )}
      {oneoff.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">One-off</p>
          {oneoff.map(e => <Row key={e.id} e={e} label={fmtDate(e.date)} />)}
        </section>
      )}
      {blocks.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Blocked</p>
          {blocks.map(e => <Row key={e.id} e={e} label={`${fmtDate(e.date)} (off)`} />)}
        </section>
      )}

      <label className="flex items-start gap-3 cursor-pointer border border-smoke bg-paper p-5">
        <input type="checkbox" checked={outside} onChange={toggleOutside} className="mt-0.5 accent-brand-red" />
        <div>
          <p className="text-sm font-medium text-ink">Accept requests from outside my gym</p>
          <p className="text-xs text-ash">Lets members from other gyms find and request private lessons with you.</p>
        </div>
      </label>
    </div>
  )
}
