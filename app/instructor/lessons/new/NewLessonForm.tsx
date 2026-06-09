'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Student = { id: string; name: string | null; belt: string }

function StudentSearch({ label, value, onChange }: {
  label: string
  value: Student | null
  onChange: (s: Student | null) => void
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!q.trim()) { setResults([]); return }
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setLoading(true)
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&limit=6`)
      const data = await res.json()
      setResults(data.users ?? [])
      setLoading(false)
    }, 300)
  }, [q])

  if (value) {
    return (
      <div className="flex items-center justify-between border border-smoke bg-mist px-4 py-3">
        <span className="text-sm text-ink">{value.name ?? '(no name)'} <span className="text-ash capitalize">· {value.belt}</span></span>
        <button onClick={() => { onChange(null); setQ('') }} className="text-xs text-ash hover:text-brand-red transition-colors">Remove</button>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder={`Search for ${label}…`}
        className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
      />
      {(results.length > 0 || loading) && (
        <div className="absolute z-10 top-full left-0 right-0 border border-smoke bg-paper shadow-sm">
          {loading && <div className="px-4 py-3 text-xs text-ash">Searching…</div>}
          {results.map(u => (
            <button
              key={u.id}
              onClick={() => { onChange(u); setQ(''); setResults([]) }}
              className="w-full text-left px-4 py-3 text-sm text-ink hover:bg-mist transition-colors border-b border-smoke last:border-0"
            >
              {u.name ?? '(no name)'} <span className="text-ash capitalize">· {u.belt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function NewLessonForm() {
  const [student, setStudent] = useState<Student | null>(null)
  const [uke, setUke] = useState<Student | null>(null)
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState('60')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [price, setPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!student || !scheduledAt) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/instructor/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: student.id,
        ukeId: uke?.id ?? null,
        scheduledAt,
        durationMins: parseInt(duration) || 60,
        location: location || null,
        notes: notes || null,
        price: price ? parseInt(price) : null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Error creating lesson'); return }
    router.push(`/lessons/${data.lessonId}`)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-steel mb-2">Primary Member *</label>
        <StudentSearch label="member" value={student} onChange={setStudent} />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-steel mb-2">Second Member (optional)</label>
        <StudentSearch label="second member" value={uke} onChange={setUke} />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-steel mb-2">Date & Time *</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={e => setScheduledAt(e.target.value)}
          required
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-steel mb-2">Duration (min)</label>
          <select
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          >
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
            <option value="120">120 min</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-steel mb-2">Price (USD, optional)</label>
          <input
            type="number"
            min="0"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-steel mb-2">Location (optional)</label>
        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Mat 1, back room…"
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-steel mb-2">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Goals, focus areas, instructions for member…"
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
        />
      </div>

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <button
        type="submit"
        disabled={saving || !student || !scheduledAt}
        className="py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? 'Scheduling…' : 'Schedule Lesson'}
      </button>
    </form>
  )
}
