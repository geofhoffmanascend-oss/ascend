'use client'

import { useEffect, useState } from 'react'

type Waiver = { id: string; kind: string; version: number; title: string; body: string | null; fileUrl: string | null }

const inputCls = 'w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'

export function ChallengeHostingForm() {
  const [inHouse, setInHouse] = useState(false)
  const [open, setOpen] = useState(false)
  const [waivers, setWaivers] = useState<Waiver[]>([])
  const [savedFlags, setSavedFlags] = useState(false)
  const [loading, setLoading] = useState(true)

  // waiver publish form
  const [wTitle, setWTitle] = useState('Visitor / Challenge Competitor Waiver')
  const [wBody, setWBody] = useState('')
  const [wFile, setWFile] = useState('')
  const [pubMsg, setPubMsg] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/gym').then(r => r.json()).catch(() => ({})),
      fetch('/api/admin/waivers').then(r => r.json()).catch(() => ({ waivers: [] })),
    ]).then(([gym, w]) => {
      setInHouse(!!gym.hostsInHouseChallenges)
      setOpen(!!gym.hostsOpenChallenges)
      setWaivers(w.waivers ?? [])
      setLoading(false)
    })
  }, [])

  async function saveFlags(next: { inHouse?: boolean; open?: boolean }) {
    const newIn = next.inHouse ?? inHouse
    const newOpen = next.open ?? open
    setInHouse(newIn); setOpen(newOpen); setSavedFlags(false)
    await fetch('/api/admin/gym', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostsInHouseChallenges: newIn, hostsOpenChallenges: newOpen }),
    })
    setSavedFlags(true)
  }

  async function publishWaiver(e: React.FormEvent) {
    e.preventDefault()
    setPubMsg('')
    const res = await fetch('/api/admin/waivers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'visitor_challenge', title: wTitle, body: wBody, fileUrl: wFile }),
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) { setPubMsg(d.error ?? 'Failed'); return }
    const w = await fetch('/api/admin/waivers').then(r => r.json()).catch(() => ({ waivers: [] }))
    setWaivers(w.waivers ?? [])
    setWBody(''); setWFile('')
    setPubMsg('Published ✓')
  }

  const visitorWaiver = waivers.find(w => w.kind === 'visitor_challenge')

  if (loading) return <div className="border border-smoke bg-paper p-6 text-sm text-ash">Loading…</div>

  return (
    <div className="border border-smoke bg-paper p-6 flex flex-col gap-4">
      <p className="text-xs font-bold uppercase tracking-widest text-steel">Challenge Match Hosting</p>
      <p className="text-xs text-ash -mt-2">
        Let members run challenge matches at your gym. You are solely responsible for premises safety,
        insurance, and the legal waiver competitors sign.
      </p>

      <Toggle label="Host in-house challenges (your own members)" checked={inHouse} onChange={() => saveFlags({ inHouse: !inHouse })} />
      <Toggle label="Host open challenges (members from any gym)" checked={open} onChange={() => saveFlags({ open: !open })} />
      {savedFlags && <p className="text-xs text-green-600">Saved ✓</p>}

      <div className="border-t border-smoke pt-4 mt-2">
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Visitor / Challenge Waiver</p>
        {visitorWaiver ? (
          <p className="text-xs text-steel mb-3">
            Active: <span className="font-medium">{visitorWaiver.title}</span> (v{visitorWaiver.version}).
            Both competitors must e-sign this before a challenge is scheduled. Publishing a new version replaces it.
          </p>
        ) : (
          <p className="text-xs text-ash mb-3">No waiver yet. Without one, challenges skip the signing step. Upload your gym&apos;s own waiver text or a PDF link.</p>
        )}
        <form onSubmit={publishWaiver} className="flex flex-col gap-2">
          <input className={inputCls} value={wTitle} onChange={e => setWTitle(e.target.value)} placeholder="Waiver title" />
          <textarea className={inputCls} rows={4} value={wBody} onChange={e => setWBody(e.target.value)} placeholder="Paste your waiver text (or use a file URL below)…" />
          <input className={inputCls} value={wFile} onChange={e => setWFile(e.target.value)} placeholder="…or a PDF URL (optional)" />
          <div className="flex items-center gap-3">
            <button type="submit" className="px-5 py-2.5 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors">
              {visitorWaiver ? 'Publish New Version' : 'Publish Waiver'}
            </button>
            {pubMsg && <span className="text-sm text-steel">{pubMsg}</span>}
          </div>
        </form>
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} className="flex items-center justify-between gap-3 text-left">
      <span className="text-sm text-ink">{label}</span>
      <span className={`w-10 h-6 flex-shrink-0 rounded-full transition-colors relative ${checked ? 'bg-brand-red' : 'bg-smoke'}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-paper rounded-full transition-all ${checked ? 'left-[1.125rem]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}
