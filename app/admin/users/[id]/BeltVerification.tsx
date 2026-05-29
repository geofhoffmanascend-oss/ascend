'use client'

import { useState } from 'react'

interface Props {
  userId: string
  userName: string
  belt: string
  initialVerified: boolean
  verifierName: string | null
}

export function BeltVerification({ userId, userName, belt, initialVerified, verifierName }: Props) {
  const [verified, setVerified] = useState(initialVerified)
  const [verifier, setVerifier] = useState(verifierName)
  const [confirming, setConfirming] = useState(false)
  const [working, setWorking] = useState(false)

  async function verify() {
    setWorking(true)
    const res = await fetch(`/api/admin/users/${userId}/verify-belt`, { method: 'PUT' })
    if (res.ok) { setVerified(true); setVerifier('you') }
    setWorking(false)
    setConfirming(false)
  }

  async function revoke() {
    setWorking(true)
    await fetch(`/api/admin/users/${userId}/verify-belt`, { method: 'DELETE' })
    setVerified(false)
    setVerifier(null)
    setWorking(false)
  }

  const beltLabel = belt.charAt(0).toUpperCase() + belt.slice(1)

  return (
    <div className="border border-smoke bg-paper p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">Belt Verification</p>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink">{beltLabel} Belt</p>
          {verified ? (
            <p className="text-xs text-green-600 mt-0.5">
              ✓ Verified{verifier ? ` by ${verifier}` : ''}
            </p>
          ) : (
            <p className="text-xs text-ash mt-0.5 italic">Self-reported — not yet verified</p>
          )}
        </div>
        <div className="flex-shrink-0">
          {verified ? (
            <button
              onClick={revoke}
              disabled={working}
              className="px-4 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors disabled:opacity-50"
            >
              {working ? 'Revoking…' : 'Revoke'}
            </button>
          ) : confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ash">Verify {userName}&apos;s {beltLabel}?</span>
              <button onClick={verify} disabled={working} className="px-3 py-1.5 bg-brand-red text-paper text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
                {working ? 'Saving…' : 'Confirm'}
              </button>
              <button onClick={() => setConfirming(false)} className="text-xs text-ash hover:text-ink transition-colors">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="px-4 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
            >
              Verify Belt
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
