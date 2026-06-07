'use client'

import { useState } from 'react'

export function InviteInstructor() {
  const [mode, setMode] = useState<'single' | 'approve'>('single')
  const [url, setUrl] = useState('')
  const [working, setWorking] = useState(false)
  const [copied, setCopied] = useState(false)

  async function generate() {
    setWorking(true)
    setUrl('')
    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'gym_instructor', grantOnAccept: mode === 'single' }),
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
      <p className="text-xs font-bold uppercase tracking-widest text-steel">Invite an Instructor</p>
      <div className="flex flex-col gap-2 text-sm">
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="radio" name="mode" checked={mode === 'single'} onChange={() => { setMode('single'); setUrl('') }} className="mt-0.5 accent-brand-red" />
          <span><span className="font-medium text-ink">Single-use link</span> — grants instructor on signup, then expires. Can't be forwarded.</span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="radio" name="mode" checked={mode === 'approve'} onChange={() => { setMode('approve'); setUrl('') }} className="mt-0.5 accent-brand-red" />
          <span><span className="font-medium text-ink">Approve after signup</span> — they join as a member and request instructor; you approve below.</span>
        </label>
      </div>
      {url ? (
        <div className="flex gap-2">
          <input readOnly value={url} onFocus={e => e.target.select()} className="flex-1 px-3 py-2 border border-smoke bg-mist text-ink text-sm" />
          <button onClick={copy} className="px-4 py-2 bg-brand-red text-paper font-bold text-sm hover:bg-red-700 transition-colors whitespace-nowrap">{copied ? 'Copied!' : 'Copy'}</button>
        </div>
      ) : (
        <button onClick={generate} disabled={working} className="self-start px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60">
          {working ? 'Generating…' : 'Generate invite link'}
        </button>
      )}
    </div>
  )
}
