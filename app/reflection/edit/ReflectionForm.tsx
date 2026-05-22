'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Reflection {
  whyStarted: string | null
  challenges: string | null
  goals: string | null
  privacy: 'public' | 'members' | 'private'
}

const PRIVACY_OPTIONS = [
  { value: 'public',  label: 'Public',  desc: 'Anyone can see this (shareable link)' },
  { value: 'members', label: 'Members', desc: 'Logged-in members only' },
  { value: 'private', label: 'Private', desc: 'Only me and admins' },
] as const

export function ReflectionForm({ existing }: { existing: Reflection | null }) {
  const router = useRouter()
  const [whyStarted, setWhyStarted] = useState(existing?.whyStarted ?? '')
  const [challenges, setChallenges] = useState(existing?.challenges ?? '')
  const [goals, setGoals] = useState(existing?.goals ?? '')
  const [privacy, setPrivacy] = useState<'public' | 'members' | 'private'>(existing?.privacy ?? 'private')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const inputCls = 'w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none'
  const labelCls = 'text-xs font-bold uppercase tracking-widest text-steel'

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whyStarted, challenges, goals, privacy }),
      })
      if (!res.ok) throw new Error('Save failed')
      router.push('/profile')
      router.refresh()
    } catch {
      setError('Failed to save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Why did you start training Jiu-Jitsu?</label>
        <textarea
          value={whyStarted}
          onChange={e => setWhyStarted(e.target.value)}
          rows={4}
          className={inputCls}
          placeholder="What brought you to the mat?"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelCls}>What challenges or obstacles have you faced — and how can you overcome them?</label>
        <textarea
          value={challenges}
          onChange={e => setChallenges(e.target.value)}
          rows={4}
          className={inputCls}
          placeholder="Injuries, consistency, nerves, schedule..."
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelCls}>What are your goals? What are you hoping to learn or achieve?</label>
        <textarea
          value={goals}
          onChange={e => setGoals(e.target.value)}
          rows={4}
          className={inputCls}
          placeholder="Compete, get fit, self-defense, earn my blue belt..."
        />
      </div>

      <div className="flex flex-col gap-3">
        <label className={labelCls}>Visibility</label>
        <div className="flex flex-col gap-2">
          {PRIVACY_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="privacy"
                value={opt.value}
                checked={privacy === opt.value}
                onChange={() => setPrivacy(opt.value)}
                className="mt-0.5 accent-brand-red"
              />
              <div>
                <div className="text-sm font-medium text-ink">{opt.label}</div>
                <div className="text-xs text-slate">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Reflection'}
        </button>
        <button
          onClick={() => router.push('/profile')}
          className="px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
