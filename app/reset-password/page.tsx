'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PasswordInput } from '@/app/components/PasswordInput'

function ResetPasswordForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setStatus('loading')
    setError('')
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    if (res.ok) {
      setStatus('done')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
      setStatus('error')
    }
  }

  if (!token) return (
    <p className="text-sm text-brand-red">Invalid reset link.</p>
  )

  if (status === 'done') return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink">Password updated. You can now sign in with your new password.</p>
      <button onClick={() => router.push('/login')}
        className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors">
        Go to Sign In
      </button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">New Password</label>
        <PasswordInput value={password} onChange={setPassword} required autoComplete="new-password"
          placeholder="At least 8 characters" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Confirm Password</label>
        <PasswordInput value={confirm} onChange={setConfirm} required autoComplete="new-password"
          placeholder="Repeat password" />
      </div>
      {error && <p className="text-sm text-brand-red">{error}</p>}
      <button type="submit" disabled={status === 'loading'}
        className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60">
        {status === 'loading' ? 'Saving…' : 'Set New Password'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Reset Password</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Set a new password</h1>
      </div>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
