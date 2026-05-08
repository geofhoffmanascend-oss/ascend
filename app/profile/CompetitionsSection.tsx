'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Competition = {
  id: string
  name: string
  date: string
  location: string | null
  division: string | null
  weightClass: string | null
  result: string | null
  notes: string | null
}

const EMPTY_FORM = { name: '', date: '', location: '', division: '', weightClass: '', result: '', notes: '' }

export function CompetitionsSection({ competitions: initial }: { competitions: Competition[] }) {
  const router = useRouter()
  const [competitions, setCompetitions] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function addCompetition(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.date) return
    setSaving(true)

    const res = await fetch('/api/competitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      const comp = await res.json()
      setCompetitions(cs => [comp, ...cs])
      setForm(EMPTY_FORM)
      setShowForm(false)
      router.refresh()
    }
    setSaving(false)
  }

  async function deleteComp(id: string) {
    await fetch(`/api/competitions/${id}`, { method: 'DELETE' })
    setCompetitions(cs => cs.filter(c => c.id !== id))
  }

  return (
    <div className="border border-smoke bg-paper p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Competition History</p>
        <button
          onClick={() => setShowForm(s => !s)}
          className="text-xs font-bold uppercase tracking-widest text-brand-red hover:text-brand-red-dark transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addCompetition} className="flex flex-col gap-3 mb-5 pb-5 border-b border-smoke">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
              placeholder="Tournament name *"
              autoFocus
            />
            <input
              type="date"
              value={form.date}
              onChange={e => update('date', e.target.value)}
              className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
            />
            <input
              type="text"
              value={form.location}
              onChange={e => update('location', e.target.value)}
              className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
              placeholder="Location"
            />
            <input
              type="text"
              value={form.result}
              onChange={e => update('result', e.target.value)}
              className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
              placeholder="Result (e.g. Gold, 2nd place)"
            />
            <input
              type="text"
              value={form.division}
              onChange={e => update('division', e.target.value)}
              className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
              placeholder="Division"
            />
            <input
              type="text"
              value={form.weightClass}
              onChange={e => update('weightClass', e.target.value)}
              className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
              placeholder="Weight class"
            />
          </div>
          <textarea
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
            placeholder="Notes"
          />
          <div>
            <button
              type="submit"
              disabled={saving || !form.name.trim() || !form.date}
              className="px-5 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Add Competition'}
            </button>
          </div>
        </form>
      )}

      {competitions.length === 0 && !showForm && (
        <p className="text-ash text-sm italic">No competitions recorded yet.</p>
      )}

      {competitions.length > 0 && (
        <ul className="flex flex-col divide-y divide-smoke">
          {competitions.map(comp => (
            <li key={comp.id} className="py-4 first:pt-0 flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-ink text-sm font-medium">{comp.name}</p>
                  {comp.result && (
                    <span className="px-2 py-0.5 bg-brand-red text-paper text-xs font-bold tracking-wide">
                      {comp.result}
                    </span>
                  )}
                </div>
                <p className="text-ash text-xs">
                  {new Date(comp.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  {comp.location && ` · ${comp.location}`}
                </p>
                {(comp.division || comp.weightClass) && (
                  <p className="text-ash text-xs">
                    {[comp.division, comp.weightClass].filter(Boolean).join(' · ')}
                  </p>
                )}
                {comp.notes && <p className="text-slate text-xs mt-1">{comp.notes}</p>}
              </div>
              <button
                onClick={() => deleteComp(comp.id)}
                className="text-ash hover:text-brand-red transition-colors text-xs flex-shrink-0 mt-0.5"
                title="Delete"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
