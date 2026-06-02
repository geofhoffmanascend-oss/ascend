'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { mutate } from 'swr'
import { Toast } from '@/app/components/Toast'

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
  isRestricted: boolean
  requestStatus: 'pending' | 'approved' | null
}

export function MessageThread({ messages: initial, currentUserId, recipientId, isRestricted, requestStatus: initialRequestStatus }: Props) {
  const [messages, setMessages] = useState(initial)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null)
  const [requestStatus, setRequestStatus] = useState(initialRequestStatus)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastSeenId = useRef<string | undefined>(initial[initial.length - 1]?.id)

  const clearToast = useCallback(() => setToast(null), [])

  useEffect(() => {
    mutate('/api/messages/unread-count')
  }, [])

  // Poll for new messages so incoming messages appear without a manual refresh.
  useEffect(() => {
    let active = true
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages/${recipientId}`)
        if (!res.ok || !active) return
        const data: Message[] = await res.json()
        const nextLast = data[data.length - 1]
        if (!nextLast || nextLast.id === lastSeenId.current) return
        lastSeenId.current = nextLast.id
        setMessages(data)
        // If the newest message is from the other person, mark read + clear badge.
        if (nextLast.sender.id === recipientId) {
          fetch(`/api/messages/${recipientId}/read`, { method: 'PATCH' })
            .then(() => mutate('/api/messages/unread-count'))
            .catch(() => {})
        }
      } catch {
        // transient network errors are ignored; next tick retries
      }
    }, 5000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [recipientId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    if (requestStatus === 'pending') {
      setToast({ message: 'Your request is still pending. They haven\'t responded yet.', type: 'info' })
      return
    }
    setSending(true)

    const res = await fetch(`/api/messages/${recipientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })

    const data = await res.json()

    if (!res.ok) {
      setToast({ message: data.error ?? 'Failed to send.', type: 'error' })
      setSending(false)
      return
    }

    if (data.type === 'request') {
      if (data.status === 'created') {
        setRequestStatus('pending')
        setToast({ message: 'Message sent as a request — they\'ll be notified and can approve it.', type: 'info' })
        setBody('')
      } else if (data.status === 'pending') {
        setToast({ message: 'You already have a pending request with this user.', type: 'info' })
      }
      setSending(false)
      return
    }

    setMessages(ms => [...ms, { ...data, createdAt: data.createdAt }])
    lastSeenId.current = data.id
    setBody('')
    setSending(false)
  }

  const showRequestBanner = isRestricted && requestStatus === 'pending'
  const canType = !isRestricted || requestStatus === 'approved' || requestStatus === null

  return (
    <div className="flex flex-col gap-4">
      {showRequestBanner && (
        <div className="border border-smoke bg-mist px-4 py-3 text-xs text-steel">
          Your message request is pending. You'll be notified when they respond.
        </div>
      )}

      {isRestricted && requestStatus === null && (
        <div className="border border-smoke bg-mist px-4 py-3 text-xs text-steel">
          This user has restricted messages from students. Your first message will be sent as a request.
        </div>
      )}

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

      <form onSubmit={send} className="flex gap-2">
        <input
          type="text"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={
            requestStatus === 'pending'
              ? 'Request pending…'
              : isRestricted && requestStatus === null
              ? 'Send a message request…'
              : 'Type a message…'
          }
          disabled={!canType}
          className="flex-1 px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !body.trim() || requestStatus === 'pending'}
          className="px-5 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60"
        >
          {requestStatus === 'pending' ? 'Pending' : "'ScendIt"}
        </button>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  )
}
