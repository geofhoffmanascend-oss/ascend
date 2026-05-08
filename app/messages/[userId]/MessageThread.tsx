'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  id: string
  body: string
  createdAt: string
  sender: { id: string; name: string | null; avatarUrl: string | null }
}

type Props = {
  messages: Message[]
  currentUserId: string
  recipientId: string
  canSend: boolean
}

export function MessageThread({ messages: initial, currentUserId, recipientId, canSend }: Props) {
  const [messages, setMessages] = useState(initial)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    setError('')

    const res = await fetch(`/api/messages/${recipientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to send.')
      setSending(false)
      return
    }

    const msg = await res.json()
    setMessages(ms => [...ms, { ...msg, createdAt: msg.createdAt }])
    setBody('')
    setSending(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 min-h-[200px] max-h-[60vh] overflow-y-auto border border-smoke bg-paper p-4">
        {messages.length === 0 && (
          <p className="text-ash text-sm text-center mt-8">No messages yet. Say hello!</p>
        )}
        {messages.map(msg => {
          const mine = msg.sender.id === currentUserId
          return (
            <div key={msg.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              <div className={`max-w-[75%] px-3 py-2 text-sm leading-relaxed ${
                mine
                  ? 'bg-brand-red text-paper'
                  : 'bg-mist text-ink border border-smoke'
              }`}>
                <p>{msg.body}</p>
                <p className={`text-[10px] mt-1 ${mine ? 'text-paper/70' : 'text-ash'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {canSend ? (
        <form onSubmit={send} className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="px-5 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60"
          >
            Send
          </button>
        </form>
      ) : (
        <p className="text-xs text-ash italic text-center border border-smoke bg-paper p-3">
          This user is not accepting direct messages from students.
        </p>
      )}

      {error && <p className="text-sm text-brand-red">{error}</p>}
    </div>
  )
}
