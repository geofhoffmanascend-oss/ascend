'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function ConfirmEmailContent() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setError('Invalid confirmation link.'); return }
    fetch('/api/auth/confirm-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then(async res => {
      if (res.ok) {
        setStatus('done')
      } else {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
        setStatus('error')
      }
    })
  }, [token])

  if (status === 'loading') return <p className="text-sm text-steel">Confirming…</p>

  if (status === 'done') return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink">Your email address has been updated. Please sign in again with your new address.</p>
      <button onClick={() => router.push('/login')}
        className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors">
        Go to Sign In
      </button>
    </div>
  )

  return <p className="text-sm text-brand-red">{error}</p>
}

export default function ConfirmEmailPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Email Change</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Confirm your new email</h1>
      </div>
      <Suspense>
        <ConfirmEmailContent />
      </Suspense>
    </div>
  )
}
