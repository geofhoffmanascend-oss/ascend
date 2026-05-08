'use client'

import { useState } from 'react'

type Note = { id: string; content: string; createdAt: string; instructorName: string }

export function NotesClient({ studentId, initial }: { studentId: string; initial: Note[] }) {
  const [notes, setNotes] = useState(initial)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  async function addNote(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    const res = await fetch('/api/instructor/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, content }),
    })
    if (res.ok) {
      const note = await res.json()
      setNotes(n => [{ ...note, instructorName: 'You', createdAt: note.createdAt }, ...n])
      setContent('')
    }
    setSaving(false)
  }

  async function deleteNote(id: string) {
    await fetch(`/api/instructor/notes/${id}`, { method: 'DELETE' })
    setNotes(n => n.filter(x => x.id !== id))
  }

  return (
    <div className="border border-smoke bg-paper p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">Private Notes</p>
      <form onSubmit={addNote} className="flex gap-2 mb-5">
        <input
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          className="flex-1 px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          placeholder="Add a note…"
        />
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60"
        >
          Add
        </button>
      </form>

      {notes.length === 0 && <p className="text-ash text-sm italic">No notes yet.</p>}
      <div className="flex flex-col gap-3">
        {notes.map(note => (
          <div key={note.id} className="flex items-start gap-3 group">
            <div className="flex-1">
              <p className="text-sm text-ink">{note.content}</p>
              <p className="text-xs text-ash mt-0.5">
                {note.instructorName} · {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => deleteNote(note.id)}
              className="text-ash hover:text-brand-red transition-colors text-xs opacity-0 group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
