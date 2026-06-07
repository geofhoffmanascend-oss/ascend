'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function MyInvitePage() {
  const [path, setPath] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/invites').then(r => r.json()).then(d => setPath(d.path ?? null))
  }, [])

  useEffect(() => {
    if (!path) return
    const full = `${window.location.origin}${path}`
    setUrl(full)
    QRCode.toDataURL(full, { width: 180, margin: 1, color: { dark: '#0A0A0A', light: '#FAFAFA' } }).then(setQr)
  }, [path])

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Invite</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Invite friends to AscendIt</h1>
        <p className="text-slate text-sm mt-2">Share your personal link. Anyone who joins through it automatically follows you (and you follow them).</p>
      </div>

      {!url ? (
        <div className="h-32 bg-mist animate-pulse border border-smoke" />
      ) : (
        <div className="border border-smoke bg-paper p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-widest text-steel">Your invite link</label>
            <div className="flex gap-2">
              <input readOnly value={url} className="flex-1 px-4 py-3 border border-smoke bg-mist text-ink text-sm" onFocus={e => e.target.select()} />
              <button onClick={copy} className="px-4 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors whitespace-nowrap">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          {qr && (
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Invite QR code" className="w-44 h-44 border border-smoke" />
              <p className="text-xs text-ash">Or have them scan this</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
