'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Message = { id: string; content: string; createdAt: string; author: { name: string | null } }

const STATUS_ACTIONS: Record<string, { label: string; next: string }[]> = {
  pending: [
    { label: 'Confirm', next: 'confirmed' },
    { label: 'Decline', next: 'cancelled' },
  ],
  confirmed: [
    { label: 'Mark Complete', next: 'completed' },
    { label: 'Cancel', next: 'cancelled' },
  ],
  completed: [],
  cancelled: [],
}

export function LessonDetailClient({
  lessonId,
  status: initStatus,
  isInstructor,
  messages: initMessages,
}: {
  lessonId: string
  status: string
  isInstructor: boolean
  messages: Message[]
}) {
  const router = useRouter()
  const [status, setStatus] = useState(initStatus)
  const [messages, setMessages] = useState(initMessages)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  async function updateStatus(next: string) {
    const res = await fetch(`/api/lessons/${lessonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) { setStatus(next); router.refresh() }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    const res = await fetch(`/api/lessons/${lessonId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (res.ok) {
      const msg = await res.json()
      setMessages(m => [...m, msg])
      setContent('')
    }
    setSaving(false)
  }

  const actions = isInstructor ? (STATUS_ACTIONS[status] ?? []) : []

  return (
    <div className="flex flex-col gap-6">
      {/* Status actions */}
      {actions.length > 0 && (
        <div className="border border-smoke bg-paper p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Actions</p>
          <div className="flex gap-3">
            {actions.map(a => (
              <button
                key={a.next}
                onClick={() => updateStatus(a.next)}
                className={`px-4 py-2 text-sm font-bold tracking-wide transition-colors ${a.next === 'cancelled' ? 'border border-smoke text-steel hover:border-brand-red hover:text-brand-red' : 'bg-brand-red text-paper hover:bg-brand-red-dark'}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message thread */}
      <div className="border border-smoke bg-paper p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">Messages</p>
        {messages.length === 0 && <p className="text-ash text-sm italic mb-4">No messages yet.</p>}
        <div className="flex flex-col gap-3 mb-4">
          {messages.map(m => (
            <div key={m.id}>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-medium text-ink">{m.author.name ?? 'Unknown'}</p>
                <p className="text-xs text-ash">{new Date(m.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
              </div>
              <p className="text-sm text-ink">{m.content}</p>
            </div>
          ))}
        </div>
        {status !== 'cancelled' && status !== 'completed' && (
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={e => setContent(e.target.value)}
              className="flex-1 px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
              placeholder="Send a message…"
            />
            <button
              type="submit"
              disabled={saving || !content.trim()}
              className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60"
            >
              {"'ScendIt"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
