'use client'

import { useState } from 'react'

export function EmailActions({ userId, currentEmail }: { userId: string; currentEmail: string }) {
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [newEmail, setNewEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [emailError, setEmailError] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(false)

  async function sendReset() {
    setResetStatus('loading')
    const res = await fetch('/api/admin/send-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    setResetStatus(res.ok ? 'done' : 'error')
  }

  async function submitEmailChange(e: React.FormEvent) {
    e.preventDefault()
    setEmailError('')
    setEmailStatus('loading')
    const res = await fetch('/api/admin/update-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newEmail }),
    })
    if (res.ok) {
      setEmailStatus('done')
      setShowEmailForm(false)
    } else {
      const data = await res.json()
      setEmailError(data.error ?? 'Failed to send confirmation')
      setEmailStatus('error')
    }
  }

  return (
    <div className="border border-smoke bg-paper p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">Account Actions</p>
      <div className="flex flex-col gap-4">

        {/* Password reset */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink">Send Password Reset</p>
            <p className="text-xs text-ash">Emails a reset link to {currentEmail}</p>
          </div>
          <button
            onClick={sendReset}
            disabled={resetStatus === 'loading' || resetStatus === 'done'}
            className="px-4 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors disabled:opacity-60 shrink-0"
          >
            {resetStatus === 'loading' ? 'Sending…' : resetStatus === 'done' ? 'Sent ✓' : resetStatus === 'error' ? 'Failed — retry' : 'Send Reset'}
          </button>
        </div>

        {/* Email change */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink">Change Email Address</p>
              <p className="text-xs text-ash">Sends a confirmation link to the new address</p>
            </div>
            {!showEmailForm && emailStatus !== 'done' && (
              <button
                onClick={() => setShowEmailForm(true)}
                className="px-4 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors shrink-0"
              >
                Change Email
              </button>
            )}
            {emailStatus === 'done' && (
              <span className="text-xs text-green-700 font-medium shrink-0">Confirmation sent ✓</span>
            )}
          </div>

          {showEmailForm && emailStatus !== 'done' && (
            <form onSubmit={submitEmailChange} className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
                placeholder="new@email.com"
                className="flex-1 px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
              />
              <button type="submit" disabled={emailStatus === 'loading'}
                className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60">
                {emailStatus === 'loading' ? '…' : 'Send'}
              </button>
              <button type="button" onClick={() => { setShowEmailForm(false); setEmailError('') }}
                className="px-4 py-2 border border-smoke text-steel text-sm hover:border-steel transition-colors">
                Cancel
              </button>
            </form>
          )}
          {emailError && <p className="text-xs text-brand-red">{emailError}</p>}
        </div>

      </div>
    </div>
  )
}
