'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GymPicker } from '@/app/components/GymPicker'

const EVENT_TYPES = [
  { key: 'open_mat', label: 'Open Mat' },
  { key: 'competition', label: 'Competition' },
  { key: 'seminar', label: 'Seminar' },
  { key: 'other', label: 'Other' },
] as const

type EventType = typeof EVENT_TYPES[number]['key']

export default function NewEventPage() {
  const router = useRouter()
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [type, setType] = useState<EventType>('open_mat')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [gym, setGym] = useState<{ id: string; name: string } | null>(null)

  const inputCls = 'w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'
  const labelCls = 'text-xs font-bold uppercase tracking-widest text-steel'
  const primaryBtn = 'px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Title is required.'); return }
    if (!city.trim() || !state.trim()) { setError('City and state are required.'); return }
    if (!startDate) { setError('Start date is required.'); return }
    if (endDate && endDate <= startDate) { setError('End date must be after start date.'); return }

    setSaving(true)
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, type, description, location, address, city, state, zip, startDate, endDate: endDate || null, gymId: gym?.id }),
    })
    setSaving(false)

    if (res.ok) {
      setSubmitted(true)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to submit event.')
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="border border-smoke bg-paper p-8 text-center">
          <div className="inline-block bg-brand-red px-3 py-1 mb-4">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Submitted</span>
          </div>
          <h1 className="font-display text-xl text-ink mb-2">Event Submitted!</h1>
          <p className="text-sm text-ash mb-6">Your event is awaiting review. We&apos;ll notify you when it&apos;s approved.</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => { setSubmitted(false); setTitle(''); setDescription(''); setLocation(''); setAddress(''); setCity(''); setState(''); setZip(''); setStartDate(''); setEndDate(''); setGym(null) }} className="text-sm text-brand-red hover:underline">
              Submit another
            </button>
            <Link href="/events/my" className="text-sm text-steel hover:text-ink transition-colors">View your submissions →</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-3">
        <Link href="/events" className="text-xs text-ash hover:text-ink transition-colors">← Events</Link>
      </div>
      <div className="mb-6">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Submit</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Submit an Event</h1>
        <p className="text-sm text-ash mt-1">Open mats, competitions, and seminars are reviewed before publishing.</p>
      </div>

      <form onSubmit={submit} className="border border-smoke bg-paper p-6 flex flex-col gap-5">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Title <span className="text-brand-red">*</span></label>
          <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="e.g., Saturday Open Mat at BJJ Lab" />
        </div>

        {/* Type */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Type <span className="text-brand-red">*</span></label>
          <div className="flex gap-2 flex-wrap">
            {EVENT_TYPES.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(t.key)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${type === t.key ? 'bg-brand-red text-paper' : 'border border-smoke text-steel hover:border-steel hover:text-ink'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Format, rules, gear requirements…" />
        </div>

        {/* Location */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Venue Name</label>
          <input value={location} onChange={e => setLocation(e.target.value)} className={inputCls} placeholder="e.g., Gracie Barra Northside" />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>Street Address</label>
          <input value={address} onChange={e => setAddress(e.target.value)} className={inputCls} placeholder="123 Main St" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1 flex flex-col gap-1">
            <label className={labelCls}>City <span className="text-brand-red">*</span></label>
            <input value={city} onChange={e => setCity(e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>State <span className="text-brand-red">*</span></label>
            <input value={state} onChange={e => setState(e.target.value)} className={inputCls} maxLength={2} placeholder="CA" />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Zip</label>
            <input value={zip} onChange={e => setZip(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Start <span className="text-brand-red">*</span></label>
            <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>End (optional)</label>
            <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Gym affiliation */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Gym Affiliation (optional)</label>
          <p className="text-xs text-ash mb-1">Is this event hosted by a gym on AscendIt?</p>
          <GymPicker value={gym} onChange={setGym} onCreateNew={() => {}} />
        </div>

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className={primaryBtn}>
            {saving ? 'Submitting…' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  )
}
