'use client'

import { useState } from 'react'

type SessionOption = { id: string; label: string }

export function QRScanForm({ sessions }: { sessions: SessionOption[] }) {
  const [token, setToken] = useState('')
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? '')
  const [result, setResult] = useState<{ ok: boolean; student?: string; class?: string; error?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token.trim()) return
    setLoading(true)
    setResult(null)

    const res = await fetch('/api/checkin/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrToken: token.trim(), classSessionId: sessionId || undefined }),
    })

    const data = await res.json()
    setResult(res.ok ? { ok: true, student: data.student, class: data.class } : { ok: false, error: data.error })
    if (res.ok) setToken('')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {sessions.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Class Session</label>
          <select
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          >
            <option value="">— Auto-detect —</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <p className="text-xs text-ash">Leave as auto-detect to find the student's current class automatically.</p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">QR Token</label>
        <input
          type="text"
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="Scan or paste token…"
          autoFocus
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors font-mono"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !token.trim()}
        className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60"
      >
        {loading ? 'Checking in…' : 'Check In Student'}
      </button>

      {result && (
        <div className={`border p-4 ${result.ok ? 'border-green-400 bg-green-50' : 'border-brand-red bg-red-50'}`}>
          {result.ok ? (
            <p className="text-sm font-medium text-green-800">
              ✓ {result.student} checked in for <strong>{result.class}</strong>
            </p>
          ) : (
            <p className="text-sm text-brand-red">{result.error}</p>
          )}
        </div>
      )}
    </form>
  )
}
