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
  canReview = false,
  messages: initMessages,
}: {
  lessonId: string
  status: string
  isInstructor: boolean
  canReview?: boolean
  messages: Message[]
}) {
  const router = useRouter()
  const [status, setStatus] = useState(initStatus)
  const [messages, setMessages] = useState(initMessages)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewed, setReviewed] = useState(false)
  const [reviewError, setReviewError] = useState('')

  async function submitReview() {
    if (rating < 1) { setReviewError('Pick a star rating.'); return }
    setReviewError('')
    const res = await fetch(`/api/lessons/${lessonId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment: reviewComment }),
    })
    if (res.ok) { setReviewed(true); router.refresh() }
    else { const d = await res.json().catch(() => ({})); setReviewError(d.error ?? 'Could not submit review.') }
  }

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

  // Instructor gets the full confirm/complete/cancel set; the requester can
  // cancel their own pending or confirmed lesson.
  const actions = isInstructor
    ? (STATUS_ACTIONS[status] ?? [])
    : (status === 'pending' || status === 'confirmed')
      ? [{ label: status === 'pending' ? 'Cancel request' : 'Cancel lesson', next: 'cancelled' }]
      : []

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

      {/* Review (requester, completed lesson, not yet reviewed) */}
      {canReview && !reviewed && (
        <div className="border border-smoke bg-paper p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Rate this lesson</p>
          <div className="flex items-center gap-1 mb-3" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHoverRating(n)}
                className={`text-2xl leading-none transition-colors ${(hoverRating || rating) >= n ? 'text-brand-red' : 'text-smoke'}`}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}>★</button>
            ))}
          </div>
          <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3}
            placeholder="How was the lesson? (optional)"
            className="w-full px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors mb-3" />
          {reviewError && <p className="text-sm text-brand-red mb-2">{reviewError}</p>}
          <button onClick={submitReview} className="px-5 py-2.5 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors">Submit review</button>
        </div>
      )}
      {reviewed && (
        <div className="border border-smoke bg-paper p-5">
          <p className="text-sm text-ink">✓ Thanks for your review.</p>
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
