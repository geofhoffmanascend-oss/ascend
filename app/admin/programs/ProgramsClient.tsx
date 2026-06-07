'use client'

import { useState } from 'react'
import Link from 'next/link'

type Program = { id: string; name: string; description: string | null; classCount: number; forumId: string | null }

export function ProgramsClient({ initial }: { initial: Program[] }) {
  const [programs, setPrograms] = useState<Program[]>(initial)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  const inputCls = 'w-full px-4 py-2.5 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'
  const labelCls = 'text-xs font-bold uppercase tracking-widest text-steel'

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Class group name is required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create program')
      setPrograms(ps => [...ps, { id: data.program.id, name: data.program.name, description: data.program.description, classCount: 0, forumId: null }])
      setName(''); setDescription('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function startEdit(p: Program) {
    setEditing(p.id); setEditName(p.name); setEditDesc(p.description ?? ''); setError('')
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) { setError('Class group name is required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/programs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setPrograms(ps => ps.map(p => p.id === id ? { ...p, name: data.program.name, description: data.program.description } : p))
      setEditing(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function createForum(p: Program) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/programs/${p.id}/forum`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create forum')
      setPrograms(ps => ps.map(x => x.id === p.id ? { ...x, forumId: data.forumId } : x))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(p: Program) {
    const parts: string[] = []
    if (p.classCount > 0) parts.push(`Its ${p.classCount} class${p.classCount !== 1 ? 'es' : ''} will stay but become ungrouped.`)
    if (p.forumId) parts.push('Its forum will remain (delete it separately from Forum moderation if you want it gone).')
    const msg = `Delete the "${p.name}" class group?${parts.length ? '\n\n' + parts.join(' ') : ''}`
    if (!confirm(msg)) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/programs/${p.id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed to delete') }
      setPrograms(ps => ps.filter(x => x.id !== p.id))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Existing programs */}
      <div className="flex flex-col gap-2">
        {programs.length === 0 && <p className="text-ash text-sm italic">No class groups yet. Create one below.</p>}
        {programs.map(p => (
          <div key={p.id} className="border border-smoke bg-paper p-4">
            {editing === p.id ? (
              <div className="flex flex-col gap-3">
                <input value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} placeholder="Class group name" />
                <input value={editDesc} onChange={e => setEditDesc(e.target.value)} className={inputCls} placeholder="Description (optional)" />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(p.id)} disabled={saving} className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60">Save</button>
                  <button onClick={() => setEditing(null)} className="px-4 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink">{p.name}</p>
                  {p.description && <p className="text-xs text-slate mt-0.5">{p.description}</p>}
                  <p className="text-xs text-ash mt-1">
                    {p.classCount} class{p.classCount !== 1 ? 'es' : ''}
                    {p.forumId
                      ? <> · <Link href={`/forum/${p.forumId}`} className="text-brand-red hover:underline">View forum →</Link></>
                      : <> · <button onClick={() => createForum(p)} disabled={saving} className="text-brand-red hover:underline disabled:opacity-60">Create forum</button></>}
                  </p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <button onClick={() => startEdit(p)} className="text-xs font-semibold text-steel hover:text-ink transition-colors">Edit</button>
                  <button onClick={() => remove(p)} className="text-xs font-semibold text-brand-red hover:underline">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-brand-red">{error}</p>}

      {/* Create new */}
      <form onSubmit={create} className="border border-smoke bg-paper p-5 flex flex-col gap-4">
        <p className="font-display text-lg text-ink">New Class Group</p>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Name <span className="text-brand-red">*</span></label>
          <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Basics" />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Description <span className="normal-case font-normal text-ash">(optional)</span></label>
          <input value={description} onChange={e => setDescription(e.target.value)} className={inputCls} placeholder="Fundamentals for new students" />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="px-5 py-2.5 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60">
            {saving ? 'Saving…' : 'Add Class Group'}
          </button>
        </div>
      </form>
    </div>
  )
}
