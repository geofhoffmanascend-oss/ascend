'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStatus('loading')
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) {
      setStatus('sent')
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Something went wrong. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <div className="min-h-full bg-paper flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="inline-block bg-brand-red px-3 py-1 mb-4">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
              Reset Password
            </span>
          </div>
          <h1 className="font-display text-2xl text-ink">Forgot your password?</h1>
          <p className="text-sm text-ash mt-2">
            Enter your account email and we&apos;ll send you a link to set a new password.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink border border-smoke bg-mist p-4">
              If an account exists for <span className="font-medium">{email}</span>, a reset link is on its way.
              The link expires in 1 hour.
            </p>
            <Link
              href="/login"
              className="w-full py-3 bg-brand-red text-paper font-bold text-sm tracking-wide text-center hover:bg-red-700 transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-widest text-steel">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              {error && <p className="text-sm text-brand-red">{error}</p>}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {status === 'loading' ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <p className="mt-6 text-sm text-ash text-center">
              Remembered it?{' '}
              <Link href="/login" className="text-ink font-medium hover:text-brand-red transition-colors">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
