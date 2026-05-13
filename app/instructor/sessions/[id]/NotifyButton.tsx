'use client'

import { useState } from 'react'

export function NotifyButton({
  sessionId,
  studentCount,
}: {
  sessionId: string
  studentCount: number
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<number | null>(null)

  async function send() {
    if (!title.trim()) return
    setSending(true)
    const res = await fetch(`/api/instructor/sessions/${sessionId}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    })
    const data = await res.json()
    setSending(false)
    setSent(data.sent ?? 0)
    setTitle('')
    setBody('')
    setTimeout(() => { setSent(null); setOpen(false) }, 2500)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
      >
        Notify Class
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
          <div className="bg-paper border border-smoke w-full max-w-sm p-6">
            <p className="font-display text-base font-bold text-ink mb-1">Notify Registered Students</p>
            <p className="text-xs text-ash mb-4">
              Sends a push notification and in-app alert to {studentCount} registered student{studentCount !== 1 ? 's' : ''}.
            </p>

            {sent !== null ? (
              <p className="text-sm text-green-700 font-medium py-4 text-center">✓ Sent to {sent} student{sent !== 1 ? 's' : ''}</p>
            ) : (
              <>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Title (required)"
                  className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors mb-3"
                />
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Message (optional)"
                  rows={3}
                  className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={send}
                    disabled={sending || !title.trim()}
                    className="flex-1 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-40"
                  >
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
