'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DAY_VALUES, CLASS_TYPE_VALUES, CLASS_TYPE_LABELS, DAY_LABELS, formatTime,
} from '@/lib/personalTraining'

type PersonalClass = {
  id: string; label: string; type: string; dayOfWeek: string
  startTime: string; endTime: string | null; location: string | null
}
type CheckIn = { id: string; date: string; label: string | null; note: string | null }

export function MyTrainingClient({
  personalClasses, checkIns, todayDow, checkedInTodayClassIds, adHocToday, streak, last30,
}: {
  personalClasses: PersonalClass[]
  checkIns: CheckIn[]
  todayDow: string
  checkedInTodayClassIds: string[]
  adHocToday: boolean
  streak: number
  last30: number
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const checkedSet = new Set(checkedInTodayClassIds)

  const todaySlots = personalClasses.filter((p) => p.dayOfWeek === todayDow)

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true)
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        alert(j.error ?? 'Something went wrong.')
        return false
      }
      router.refresh()
      return true
    } finally {
      setBusy(false)
    }
  }

  const checkIn = (personalClassId?: string) => call('/api/self-checkin', 'POST', personalClassId ? { personalClassId } : {})
  const undo = (id: string) => call(`/api/self-checkin/${id}`, 'DELETE')
  const removeClass = (id: string) => confirm('Remove this from your schedule?') && call(`/api/personal-classes/${id}`, 'DELETE')

  // Group schedule by day
  const byDay = DAY_VALUES.map((d) => ({ day: d, items: personalClasses.filter((p) => p.dayOfWeek === d) }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <span className="inline-block bg-brand-red px-3 py-1 font-display text-xs font-bold tracking-widest uppercase text-paper mb-2">
          My Training
        </span>
        <h1 className="font-display text-2xl text-ink">Track your own consistency</h1>
        <p className="text-sm text-slate mt-1">
          Build your own weekly schedule and check in each time you train — no gym required.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-smoke bg-paper p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Week Streak</p>
          <p className="font-display text-3xl text-brand-red">{streak}</p>
          <p className="text-xs text-slate">consecutive weeks trained</p>
        </div>
        <div className="border border-smoke bg-paper p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Last 30 Days</p>
          <p className="font-display text-3xl text-ink">{last30}</p>
          <p className="text-xs text-slate">sessions logged</p>
        </div>
      </div>

      {/* Today */}
      <section className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Today</p>
        <div className="flex flex-col gap-2">
          {todaySlots.map((s) => {
            const checked = checkedSet.has(s.id)
            return (
              <div key={s.id} className="flex items-center justify-between border border-smoke bg-paper px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{s.label}</p>
                  <p className="text-xs text-slate">{formatTime(s.startTime)} · {CLASS_TYPE_LABELS[s.type] ?? s.type}</p>
                </div>
                {checked ? (
                  <span className="text-sm font-bold text-brand-red">✓ Checked in</span>
                ) : (
                  <button onClick={() => checkIn(s.id)} disabled={busy}
                    className="bg-brand-red text-paper font-bold text-sm px-4 py-2 hover:bg-red-700 transition-colors disabled:opacity-50">
                    Check in
                  </button>
                )}
              </div>
            )
          })}
          {todaySlots.length === 0 && (
            <p className="text-sm text-slate">No sessions scheduled today.</p>
          )}
          {/* Ad-hoc */}
          {adHocToday ? (
            <p className="text-sm text-slate mt-1">✓ You logged an extra session today.</p>
          ) : (
            <button onClick={() => checkIn()} disabled={busy}
              className="self-start mt-1 border border-smoke text-steel text-sm font-medium px-4 py-2 hover:border-steel hover:text-ink transition-colors disabled:opacity-50">
              + Log a session (not on my schedule)
            </button>
          )}
        </div>
      </section>

      {/* Weekly schedule */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">My Weekly Schedule</p>
          <button onClick={() => setShowForm((v) => !v)}
            className="text-sm font-bold text-brand-red hover:underline">
            {showForm ? 'Close' : '+ Add a class'}
          </button>
        </div>

        {showForm && <AddClassForm busy={busy} onDone={() => { setShowForm(false); router.refresh() }} />}

        <div className="flex flex-col gap-3 mt-3">
          {byDay.filter((d) => d.items.length > 0).map((d) => (
            <div key={d.day}>
              <p className="text-xs font-bold uppercase tracking-widest text-steel/60 mb-1">{DAY_LABELS[d.day]}</p>
              <div className="flex flex-col gap-1">
                {d.items.map((s) => (
                  <div key={s.id} className="flex items-center justify-between border border-smoke bg-paper px-4 py-2">
                    <div>
                      <span className="text-sm text-ink">{s.label}</span>
                      <span className="text-xs text-slate ml-2">{formatTime(s.startTime)} · {CLASS_TYPE_LABELS[s.type] ?? s.type}</span>
                    </div>
                    <button onClick={() => removeClass(s.id)} disabled={busy}
                      className="text-xs text-slate hover:text-brand-red">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {personalClasses.length === 0 && !showForm && (
            <p className="text-sm text-slate">No personal classes yet. Add your weekly training times above.</p>
          )}
        </div>
      </section>

      {/* Recent */}
      <section>
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Recent Sessions</p>
        {checkIns.length === 0 ? (
          <p className="text-sm text-slate">Nothing logged yet.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {checkIns.slice(0, 15).map((c) => (
              <div key={c.id} className="flex items-center justify-between border-b border-smoke py-2">
                <div>
                  <span className="text-sm text-ink">{c.label ?? 'Training session'}</span>
                  <span className="text-xs text-slate ml-2">{c.date}</span>
                </div>
                <button onClick={() => undo(c.id)} disabled={busy} className="text-xs text-slate hover:text-brand-red">Undo</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function AddClassForm({ busy, onDone }: { busy: boolean; onDone: () => void }) {
  const [label, setLabel] = useState('')
  const [day, setDay] = useState(DAY_VALUES[0])
  const [time, setTime] = useState('18:00')
  const [type, setType] = useState(CLASS_TYPE_VALUES[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    if (!label.trim()) { setError('Add a label (e.g. “Evening Gi”).'); return }
    setSaving(true)
    const res = await fetch('/api/personal-classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, dayOfWeek: day, startTime: time, type }),
    })
    setSaving(false)
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error ?? 'Could not save.'); return }
    onDone()
  }

  const input = 'w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red'

  return (
    <div className="border border-smoke bg-mist/40 p-4 flex flex-col gap-3">
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Label</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Evening Gi" className={input} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Day</label>
          <select value={day} onChange={(e) => setDay(e.target.value as typeof day)} className={input}>
            {DAY_VALUES.map((d) => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Time</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={input} />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={input}>
            {CLASS_TYPE_VALUES.map((t) => <option key={t} value={t}>{CLASS_TYPE_LABELS[t] ?? t}</option>)}
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-brand-red">{error}</p>}
      <button onClick={submit} disabled={saving || busy}
        className="self-start bg-brand-red text-paper font-bold text-sm px-4 py-2 hover:bg-red-700 transition-colors disabled:opacity-50">
        {saving ? 'Saving…' : 'Add to schedule'}
      </button>
    </div>
  )
}
