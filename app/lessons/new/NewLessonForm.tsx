'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Person = { id: string; name: string | null }
type Day = { date: string; slots: string[] }
type Pick = { date: string; time: string }

const input = 'w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'
const label = 'text-xs font-bold uppercase tracking-widest text-steel'
const pad = (n: number) => String(n).padStart(2, '0')

function fmtSlot(s: string) {
  const [h, m] = s.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'; const hr = h % 12 || 12
  return `${hr}:${pad(m)} ${ap}`
}
function fmtDayShort(d: string) {
  return new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function NewLessonForm({ instructors, students, initialInstructorId = '' }: { instructors: Person[]; students: Person[]; initialInstructorId?: string }) {
  const router = useRouter()
  const [instructorId, setInstructorId] = useState(initialInstructorId)
  const [days, setDays] = useState<Day[] | null>(null)
  const [loadingAvail, setLoadingAvail] = useState(false)
  const [ym, setYm] = useState(() => { const d = new Date(); return { y: d.getUTCFullYear(), m: d.getUTCMonth() } })
  const [activeDay, setActiveDay] = useState('')
  const [picks, setPicks] = useState<Pick[]>([])
  const [fallback, setFallback] = useState('')
  const [durationMins, setDurationMins] = useState('60')
  const [ukeId, setUkeId] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setDays(null); setActiveDay(''); setPicks([]); setFallback('')
    if (!instructorId) return
    setLoadingAvail(true)
    fetch(`/api/instructors/${instructorId}/availability?weeks=8`)
      .then(r => r.json())
      .then((d: { days: Day[] }) => {
        setDays(d.days ?? [])
        if (d.days?.length) {
          const [y, m] = d.days[0].date.split('-').map(Number)
          setYm({ y, m: m - 1 })
        }
      })
      .finally(() => setLoadingAvail(false))
  }, [instructorId])

  const availByDate = useMemo(() => new Map((days ?? []).map(d => [d.date, d.slots])), [days])
  const hasAvailability = days !== null && days.length > 0
  const activeSlots = availByDate.get(activeDay) ?? []

  // Month grid cells (UTC)
  const cells = useMemo(() => {
    const first = new Date(Date.UTC(ym.y, ym.m, 1))
    const lead = first.getUTCDay()
    const count = new Date(Date.UTC(ym.y, ym.m + 1, 0)).getUTCDate()
    const arr: (string | null)[] = Array(lead).fill(null)
    for (let d = 1; d <= count; d++) arr.push(`${ym.y}-${pad(ym.m + 1)}-${pad(d)}`)
    return arr
  }, [ym])

  const monthLabel = new Date(Date.UTC(ym.y, ym.m, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const todayStr = new Date().toISOString().split('T')[0]

  function togglePick(date: string, time: string) {
    setPicks(p => p.some(x => x.date === date && x.time === time)
      ? p.filter(x => !(x.date === date && x.time === time))
      : [...p, { date, time }])
  }
  const isPicked = (date: string, time: string) => picks.some(x => x.date === date && x.time === time)
  const pickCountFor = (date: string) => picks.filter(x => x.date === date).length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!instructorId) { setError('Pick an instructor'); return }

    const slots: string[] = []
    if (hasAvailability) {
      if (picks.length === 0) { setError('Select at least one time'); return }
      for (const p of picks) slots.push(`${p.date}T${p.time}:00.000Z`)
    } else {
      if (!fallback) { setError('Pick a date and time'); return }
      slots.push(fallback)
    }

    setSaving(true)
    let failed = 0
    for (const scheduledAt of slots) {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId, scheduledAt, durationMins: Number(durationMins), ukeId: ukeId || null, location, notes }),
      })
      if (!res.ok) failed++
    }
    if (failed === slots.length) { setError('Failed to submit request(s).'); setSaving(false); return }
    router.push('/lessons')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className={label}>Instructor *</label>
        <select value={instructorId} onChange={e => setInstructorId(e.target.value)} className={input}>
          <option value="">Select instructor…</option>
          {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </div>

      {instructorId && (
        loadingAvail ? (
          <div className="h-48 bg-mist animate-pulse border border-smoke" />
        ) : hasAvailability ? (
          <div className="flex flex-col gap-3">
            {/* Calendar */}
            <div className="border border-smoke bg-paper p-4">
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => setYm(s => ({ y: s.m === 0 ? s.y - 1 : s.y, m: (s.m + 11) % 12 }))} className="px-2 py-1 text-steel hover:text-ink text-sm">←</button>
                <p className="text-sm font-medium text-ink">{monthLabel}</p>
                <button type="button" onClick={() => setYm(s => ({ y: s.m === 11 ? s.y + 1 : s.y, m: (s.m + 1) % 12 }))} className="px-2 py-1 text-steel hover:text-ink text-sm">→</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="text-[10px] font-bold text-ash uppercase">{d}</div>)}
                {cells.map((date, i) => {
                  if (!date) return <div key={i} />
                  const avail = availByDate.has(date)
                  const day = Number(date.split('-')[2])
                  const picked = pickCountFor(date)
                  return (
                    <button key={i} type="button" disabled={!avail} onClick={() => setActiveDay(date)}
                      className={`aspect-square text-sm flex flex-col items-center justify-center border transition-colors ${
                        activeDay === date ? 'border-brand-red bg-brand-red/5'
                        : avail ? 'border-smoke bg-paper hover:border-steel cursor-pointer'
                        : 'border-transparent text-ash cursor-default'
                      } ${date === todayStr ? 'font-bold' : ''}`}>
                      <span className={avail ? 'text-ink' : ''}>{day}</span>
                      {avail && <span className={`mt-0.5 w-1.5 h-1.5 rounded-full ${picked > 0 ? 'bg-brand-red' : 'bg-steel/40'}`} />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Slots for the active day */}
            {activeDay && (
              <div className="flex flex-col gap-1">
                <label className={label}>{fmtDayShort(activeDay)} — tap times to add</label>
                <div className="flex flex-wrap gap-2">
                  {activeSlots.map(s => (
                    <button key={s} type="button" onClick={() => togglePick(activeDay, s)}
                      className={`px-3 py-2 text-xs font-semibold border transition-colors ${isPicked(activeDay, s) ? 'bg-brand-red border-brand-red text-paper' : 'border-smoke text-steel hover:border-steel hover:text-ink'}`}>
                      {fmtSlot(s)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected times */}
            {picks.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className={label}>Selected ({picks.length})</label>
                <div className="flex flex-wrap gap-2">
                  {[...picks].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map(p => (
                    <span key={`${p.date}${p.time}`} className="inline-flex items-center gap-1 px-2 py-1 bg-mist border border-smoke text-xs text-ink">
                      {fmtDayShort(p.date)} {fmtSlot(p.time)}
                      <button type="button" onClick={() => togglePick(p.date, p.time)} className="text-brand-red font-bold">✕</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-xs text-ash border border-smoke bg-mist px-3 py-2">This instructor hasn't published availability — pick a date/time to request and they'll confirm.</p>
            <label className={label}>Date & Time *</label>
            <input type="datetime-local" value={fallback} onChange={e => setFallback(e.target.value)} className={input} />
          </div>
        )
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className={label}>Duration</label>
          <select value={durationMins} onChange={e => setDurationMins(e.target.value)} className={input}>
            <option value="30">30 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
            <option value="120">120 min</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={label}>Uke (optional)</label>
          <select value={ukeId} onChange={e => setUkeId(e.target.value)} className={input}>
            <option value="">None</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={label}>Location</label>
        <input type="text" value={location} onChange={e => setLocation(e.target.value)} className={input} placeholder="Mat room, private gym, etc." />
      </div>

      <div className="flex flex-col gap-1">
        <label className={label}>Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={`${input} resize-none`} placeholder="What do you want to work on?" />
      </div>

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60">
          {saving ? 'Submitting…' : picks.length > 1 ? `Request ${picks.length} Lessons` : 'Request Lesson'}
        </button>
        <button type="button" onClick={() => router.push('/lessons')} className="px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
