'use client'

import { useState } from 'react'

export function InviteMember() {
  const [url, setUrl] = useState('')
  const [working, setWorking] = useState(false)
  const [copied, setCopied] = useState(false)

  async function generate() {
    setWorking(true)
    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'gym_member' }),
    })
    const data = await res.json()
    if (res.ok) setUrl(`${window.location.origin}${data.path}`)
    setWorking(false)
  }

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-smoke bg-paper p-5 flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-widest text-steel">Invite a Member</p>
      <p className="text-xs text-ash -mt-1">Reusable link — anyone who joins through it becomes an active member of your gym and follows you.</p>
      {url ? (
        <div className="flex gap-2">
          <input readOnly value={url} onFocus={e => e.target.select()} className="flex-1 px-3 py-2 border border-smoke bg-mist text-ink text-sm" />
          <button onClick={copy} className="px-4 py-2 bg-brand-red text-paper font-bold text-sm hover:bg-red-700 transition-colors whitespace-nowrap">{copied ? 'Copied!' : 'Copy'}</button>
        </div>
      ) : (
        <button onClick={generate} disabled={working} className="self-start px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60">
          {working ? 'Generating…' : 'Generate member invite link'}
        </button>
      )}
    </div>
  )
}
