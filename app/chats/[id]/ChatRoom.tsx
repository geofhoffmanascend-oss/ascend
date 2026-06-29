'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Message = { id: string; content: string; imageUrl: string | null; createdAt: string; authorId: string; authorName: string }
type Member = { id: string; name: string }
type Request = { id: string; userId: string; name: string }
type SearchResult = { id: string; name: string | null }

export function ChatRoom({
  chatId, title, gymName, meId, initialMessages, members, requests,
}: {
  chatId: string; title: string; gymName: string | null; meId: string
  initialMessages: Message[]; members: Member[]; requests: Request[]
}) {
  const router = useRouter()
  const [messages, setMessages] = useState(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView() }, [messages.length])

  async function send() {
    if (!text.trim() && !image) return
    setSending(true)
    const res = await fetch(`/api/forums/${chatId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text.trim() || '📷', imageUrl: image }),
    })
    setSending(false)
    if (res.ok) {
      const post = await res.json()
      setMessages(m => [...m, { id: post.id, content: post.content, imageUrl: image, createdAt: new Date().toISOString(), authorId: meId, authorName: 'You' }])
      setText(''); setImage(null)
    } else {
      const d = await res.json().catch(() => ({})); alert(d.error ?? 'Could not send.')
    }
  }

  async function uploadImage(file: File) {
    setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch(`/api/forums/${chatId}/upload`, { method: 'POST', body: fd })
    setUploading(false)
    if (res.ok) { const { url } = await res.json(); setImage(url) }
    else alert('Upload failed.')
  }

  async function actRequest(reqId: string, action: 'approve' | 'decline') {
    const res = await fetch(`/api/group-chats/${chatId}/requests/${reqId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
    })
    if (res.ok) router.refresh()
  }

  async function leave() {
    if (!confirm('Leave this chat?')) return
    await fetch(`/api/group-chats/${chatId}/leave`, { method: 'POST' })
    router.push('/chats')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ minHeight: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-smoke pb-3 mb-3">
        <div className="min-w-0">
          <Link href="/chats" className="text-xs text-ash hover:text-ink">← Chats</Link>
          <h1 className="font-display text-lg text-ink truncate">{title}</h1>
          {gymName && <p className="text-xs text-slate">{gymName}</p>}
        </div>
        <button onClick={() => setShowPanel(s => !s)} className="text-xs border border-smoke text-steel px-3 py-1.5 hover:border-steel">
          {members.length} members
        </button>
      </div>

      {/* Members / requests / invite panel */}
      {showPanel && (
        <div className="border border-smoke bg-paper p-4 mb-3 flex flex-col gap-4">
          <InvitePanel chatId={chatId} memberIds={members.map(m => m.id)} onInvited={() => router.refresh()} />
          {requests.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-2">Requests to join</p>
              {requests.map(r => (
                <div key={r.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-ink">{r.name} would like to join</span>
                  <span className="flex gap-2">
                    <button onClick={() => actRequest(r.id, 'approve')} className="text-xs bg-brand-red text-paper font-bold px-3 py-1">Approve</button>
                    <button onClick={() => actRequest(r.id, 'decline')} className="text-xs border border-smoke text-steel px-3 py-1">Decline</button>
                  </span>
                </div>
              ))}
            </div>
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-2">Members</p>
            <div className="flex flex-wrap gap-1.5">
              {members.map(m => (
                <Link key={m.id} href={`/profile/${m.id}`} className="text-xs bg-mist text-steel px-2 py-1 hover:text-ink">{m.name}</Link>
              ))}
            </div>
          </div>
          <button onClick={leave} className="text-xs text-brand-red hover:underline self-start">Leave chat</button>
        </div>
      )}

      {/* Pending requests inline notice (when panel closed) */}
      {!showPanel && requests.length > 0 && (
        <button onClick={() => setShowPanel(true)} className="text-xs text-brand-red mb-2 self-start">
          {requests.length} {requests.length === 1 ? 'person wants' : 'people want'} to join — review →
        </button>
      )}

      {/* Messages */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto mb-3">
        {messages.length === 0 && <p className="text-sm text-slate text-center my-8">No messages yet. Say hi 👋</p>}
        {messages.map(m => {
          const mine = m.authorId === meId
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              {!mine && <span className="text-[11px] text-ash px-1">{m.authorName}</span>}
              <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${mine ? 'bg-brand-red text-paper' : 'bg-mist text-ink'}`}>
                {m.imageUrl && <img src={m.imageUrl} alt="" className="rounded mb-1 max-h-60 object-cover" />}
                {m.content !== '📷' && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-smoke pt-3">
        {image && (
          <div className="flex items-center gap-2 mb-2">
            <img src={image} alt="" className="h-12 w-12 object-cover rounded" />
            <button onClick={() => setImage(null)} className="text-xs text-brand-red">Remove</button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <label className="px-3 py-2 border border-smoke text-steel text-sm cursor-pointer hover:border-steel shrink-0">
            {uploading ? '…' : '📷'}
            <input type="file" accept="image/*" className="hidden" disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f) }} />
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            rows={1}
            placeholder="Message…"
            className="flex-1 px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red resize-none"
          />
          <button onClick={send} disabled={sending || (!text.trim() && !image)} className="bg-brand-red text-paper font-bold text-sm px-4 py-2 hover:bg-red-700 transition-colors disabled:opacity-50 shrink-0">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

function InvitePanel({ chatId, memberIds, onInvited }: { chatId: string; memberIds: string[]; onInvited: () => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  async function search(value: string) {
    setQ(value)
    if (value.trim().length < 2) { setResults([]); return }
    setSearching(true)
    const res = await fetch(`/api/users/search?all=1&q=${encodeURIComponent(value.trim())}`)
    setSearching(false)
    if (res.ok) setResults(await res.json())
  }

  async function invite(userId: string) {
    const res = await fetch(`/api/group-chats/${chatId}/invite`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }),
    })
    if (res.ok) { setQ(''); setResults([]); onInvited() }
    else { const d = await res.json().catch(() => ({})); alert(d.error ?? 'Could not invite.') }
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-steel mb-2">Invite</p>
      <input
        value={q}
        onChange={e => search(e.target.value)}
        placeholder="Search people by name…"
        className="w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red"
      />
      {searching && <p className="text-xs text-ash mt-1">Searching…</p>}
      {results.length > 0 && (
        <div className="flex flex-col gap-1 mt-2">
          {results.map(u => {
            const already = memberIds.includes(u.id)
            return (
              <div key={u.id} className="flex items-center justify-between">
                <span className="text-sm text-ink">{u.name ?? 'User'}</span>
                {already
                  ? <span className="text-xs text-ash">In chat</span>
                  : <button onClick={() => invite(u.id)} className="text-xs bg-brand-red text-paper font-bold px-3 py-1">Add</button>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
