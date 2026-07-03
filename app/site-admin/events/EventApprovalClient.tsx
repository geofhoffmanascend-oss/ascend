'use client'

import { useMemo, useState } from 'react'

type EventType = 'open_mat' | 'competition' | 'seminar' | 'other'
type Status = 'pending' | 'approved' | 'rejected'
type Bucket = 'pending' | 'approved' | 'past' | 'rejected'

interface Event {
  id: string
  title: string
  type: EventType
  description: string | null
  location: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  status: Status
  startDate: string
  endDate: string | null
  submittedBy: { name: string | null; email: string | null }
  gym: { name: string } | null
  createdAt: string
}

const TYPE_LABELS: Record<EventType, string> = {
  open_mat: 'Open Mat', competition: 'Competition', seminar: 'Seminar', other: 'Other',
}

const BUCKET_LABELS: Record<Bucket | 'all', string> = {
  all: 'All', pending: 'Pending', approved: 'Approved (upcoming)', past: 'Past', rejected: 'Rejected',
}

const STATUS_BADGE: Record<Bucket, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  past: 'bg-mist text-steel',
  rejected: 'bg-red-100 text-red-700',
}

function bucketOf(e: Event): Bucket {
  if (e.status === 'rejected') return 'rejected'
  if (new Date(e.startDate) < new Date()) return 'past'
  if (e.status === 'pending') return 'pending'
  return 'approved'
}

function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const secondaryBtn = 'px-3 py-1.5 border border-smoke text-steel text-xs font-medium hover:border-steel hover:text-ink transition-colors disabled:opacity-50'
const primaryBtn = 'px-3 py-1.5 bg-brand-red text-paper font-bold text-xs tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50'
const inputCls = 'w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'

interface EditForm {
  title: string; type: EventType; startDate: string; endDate: string
  location: string; address: string; city: string; state: string; zip: string; description: string
}

export function EventApprovalClient({ events: initial }: { events: Event[] }) {
  const [events, setEvents] = useState(initial)
  const [filter, setFilter] = useState<Bucket | 'all'>('all')
  const [query, setQuery] = useState('')
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [working, setWorking] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EditForm | null>(null)

  const counts = useMemo(() => {
    const c: Record<Bucket, number> = { pending: 0, approved: 0, past: 0, rejected: 0 }
    events.forEach(e => { c[bucketOf(e)]++ })
    return c
  }, [events])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return events.filter(e => {
      if (filter !== 'all' && bucketOf(e) !== filter) return false
      if (!q) return true
      return [e.title, e.location, e.city, e.state, e.gym?.name, e.submittedBy.name, e.submittedBy.email]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [events, filter, query])

  async function act(id: string, status: 'approved' | 'rejected', rejectionNote?: string) {
    setWorking(id)
    const res = await fetch(`/api/site-admin/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejectionNote }),
    })
    if (res.ok) {
      setEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e))
      setRejecting(null)
      setNote('')
    }
    setWorking(null)
  }

  async function del(id: string) {
    if (!confirm('Delete this event permanently?')) return
    setWorking(id)
    const res = await fetch(`/api/site-admin/events/${id}`, { method: 'DELETE' })
    if (res.ok) setEvents(prev => prev.filter(e => e.id !== id))
    setWorking(null)
  }

  function startEdit(e: Event) {
    setEditingId(e.id)
    setForm({
      title: e.title, type: e.type,
      startDate: toLocalInput(e.startDate),
      endDate: e.endDate ? toLocalInput(e.endDate) : '',
      location: e.location ?? '', address: e.address ?? '', city: e.city ?? '',
      state: e.state ?? '', zip: e.zip ?? '', description: e.description ?? '',
    })
  }

  async function saveEdit(id: string) {
    if (!form) return
    setWorking(id)
    const payload = {
      title: form.title, type: form.type,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      location: form.location, address: form.address, city: form.city,
      state: form.state, zip: form.zip, description: form.description,
    }
    const res = await fetch(`/api/site-admin/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const { event } = await res.json()
      setEvents(prev => prev.map(e => e.id === id ? {
        ...e,
        title: event.title, type: event.type, description: event.description,
        location: event.location, address: event.address, city: event.city,
        state: event.state, zip: event.zip,
        startDate: event.startDate, endDate: event.endDate,
      } : e))
      setEditingId(null)
      setForm(null)
    }
    setWorking(null)
  }

  const chips: (Bucket | 'all')[] = ['all', 'pending', 'approved', 'past', 'rejected']

  return (
    <div className="flex flex-col gap-4">
      {/* Search + chips */}
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search by title, location, gym, submitter…"
        className={inputCls}
      />
      <div className="flex gap-2 flex-wrap">
        {chips.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
              filter === c ? 'bg-brand-red text-paper' : 'bg-mist text-steel hover:text-ink'
            }`}
          >
            {BUCKET_LABELS[c]}{c !== 'all' && ` (${counts[c]})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-ash text-sm italic">No events match.</p>
      ) : filtered.map(event => {
        const bucket = bucketOf(event)
        const isEditing = editingId === event.id
        return (
          <div key={event.id} className="border border-smoke bg-paper p-5">
            {isEditing && form ? (
              /* EDIT FORM */
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-steel">Title</label>
                  <input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-steel">Type</label>
                    <select className={inputCls} value={form.type} onChange={e => setForm({ ...form, type: e.target.value as EventType })}>
                      {(Object.keys(TYPE_LABELS) as EventType[]).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-steel">Start</label>
                    <input type="datetime-local" className={inputCls} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-steel">End (optional)</label>
                    <input type="datetime-local" className={inputCls} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-steel">Venue / Location</label>
                    <input className={inputCls} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-steel">Address</label>
                    <input className={inputCls} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-xs font-bold uppercase tracking-widest text-steel">City</label><input className={inputCls} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                    <div><label className="text-xs font-bold uppercase tracking-widest text-steel">State</label><input className={inputCls} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} /></div>
                    <div><label className="text-xs font-bold uppercase tracking-widest text-steel">Zip</label><input className={inputCls} value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} /></div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-steel">Description</label>
                  <textarea rows={3} className={inputCls} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(event.id)} disabled={working === event.id} className={primaryBtn}>
                    {working === event.id ? 'Saving…' : 'Save changes'}
                  </button>
                  <button onClick={() => { setEditingId(null); setForm(null) }} className={secondaryBtn}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 ${STATUS_BADGE[bucket]}`}>{BUCKET_LABELS[bucket]}</span>
                      <span className="text-xs font-bold uppercase tracking-wide bg-mist text-steel px-2 py-0.5">{TYPE_LABELS[event.type]}</span>
                      <span suppressHydrationWarning className="text-xs text-ash">
                        {new Date(event.startDate).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-display text-base font-bold text-ink">{event.title}</p>
                    {(event.location || event.city) && (
                      <p className="text-xs text-ash mt-0.5">
                        {[event.location, [event.city, event.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {event.gym && <p className="text-xs text-steel mt-0.5">Gym: {event.gym.name}</p>}
                    {event.description && <p className="text-sm text-ash mt-2 line-clamp-3 whitespace-pre-line">{event.description}</p>}
                    <p suppressHydrationWarning className="text-xs text-ash mt-2">
                      Submitted by {event.submittedBy.name ?? event.submittedBy.email ?? 'Unknown'} · {new Date(event.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {rejecting === event.id ? (
                  <div className="flex flex-col gap-2 border-t border-smoke pt-3">
                    <input type="text" value={note} onChange={e => setNote(e.target.value)} className={inputCls} placeholder="Rejection reason (optional)" />
                    <div className="flex gap-2">
                      <button onClick={() => act(event.id, 'rejected', note)} disabled={!!working} className={primaryBtn}>
                        {working === event.id ? 'Rejecting…' : 'Confirm reject'}
                      </button>
                      <button onClick={() => { setRejecting(null); setNote('') }} className={secondaryBtn}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap border-t border-smoke pt-3">
                    {event.status !== 'approved' && (
                      <button onClick={() => act(event.id, 'approved')} disabled={!!working} className={primaryBtn}>
                        {working === event.id ? '…' : 'Approve'}
                      </button>
                    )}
                    {event.status !== 'rejected' && (
                      <button onClick={() => setRejecting(event.id)} disabled={!!working} className={secondaryBtn}>Reject</button>
                    )}
                    <button onClick={() => startEdit(event)} disabled={!!working} className={secondaryBtn}>Edit</button>
                    <button onClick={() => del(event.id)} disabled={!!working} className={`${secondaryBtn} hover:!border-brand-red hover:!text-brand-red`}>Delete</button>
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
