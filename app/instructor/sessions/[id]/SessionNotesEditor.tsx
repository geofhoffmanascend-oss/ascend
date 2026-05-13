'use client'

import { useState } from 'react'

export function SessionNotesEditor({
  sessionId,
  initialNotes,
  initialPublic,
}: {
  sessionId: string
  initialNotes: string | null
  initialPublic: boolean
}) {
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [pub, setPub] = useState(initialPublic)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    setSaved(false)
    await fetch(`/api/instructor/sessions/${sessionId}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionNotes: notes, notesPublic: pub }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="border border-smoke bg-paper p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Session Notes</p>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={pub} onChange={() => setPub(v => !v)} />
            <div className={`w-8 h-4 rounded-full transition-colors ${pub ? 'bg-brand-red' : 'bg-smoke'}`} />
            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-paper rounded-full shadow transition-transform ${pub ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-xs text-steel">{pub ? 'Visible to students' : 'Private'}</span>
        </label>
      </div>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Techniques covered, class plan, coaching notes…"
        rows={5}
        className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
      />
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-ash">
          {pub ? 'Students committed to this session can read these notes.' : 'Only you can see these notes.'}
        </p>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-40"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Notes'}
        </button>
      </div>
    </div>
  )
}
