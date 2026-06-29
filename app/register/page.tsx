'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PasswordInput } from '@/app/components/PasswordInput'
import { SIMPLE_LAUNCH } from '@/lib/launchMode'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const intent = searchParams.get('intent') === 'owner' ? 'owner' : 'athlete'
  // Public-launch pivot: gym registration is paused — everyone registers as an athlete.
  const isOwner = !SIMPLE_LAUNCH && intent === 'owner'
  const inviteToken = searchParams.get('invite')
  const onboardingPath = isOwner ? '/onboarding/owner' : '/onboarding'

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Registration failed.')
      setLoading(false)
      return
    }

    await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    // Apply an invite if they came through one (mutual follow + any gym/instructor grant).
    if (inviteToken) {
      await fetch(`/api/invites/${inviteToken}/accept`, { method: 'POST' }).catch(() => {})
    }

    router.push(onboardingPath)
    router.refresh()
  }

  return (
    <div className="min-h-full bg-paper flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="inline-block bg-brand-red px-3 py-1 mb-4">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
              {isOwner ? 'Register a Gym' : 'New Account'}
            </span>
          </div>
          <h1 className="font-display text-2xl text-ink">
            {isOwner ? 'Register or claim your gym' : 'Join AscendIt'}
          </h1>
          <p className="text-slate text-sm mt-2">
            {isOwner
              ? "First create your account, then you'll add your gym and set it up."
              : 'Create your account to connect with your team and track your journey.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Smith' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-widest text-steel">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={e => update(key, e.target.value)}
                required
                className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
                placeholder={placeholder}
              />
            </div>
          ))}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-widest text-steel">Password</label>
            <PasswordInput
              value={form.password}
              onChange={v => update('password', v)}
              required
              autoComplete="new-password"
              placeholder="8+ characters"
            />
          </div>

          {error && <p className="text-sm text-brand-red">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="text-xs text-ash text-center">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="text-steel hover:text-ink underline underline-offset-2">Terms</Link> and{' '}
            <Link href="/privacy" className="text-steel hover:text-ink underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-smoke" />
          <span className="text-xs text-ash uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-smoke" />
        </div>

        <button
          onClick={() => signIn('google', { callbackUrl: onboardingPath })}
          className="mt-4 w-full py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-sm text-ash text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-ink font-medium hover:text-brand-red transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-full bg-paper" />}>
      <RegisterForm />
    </Suspense>
  )
}
