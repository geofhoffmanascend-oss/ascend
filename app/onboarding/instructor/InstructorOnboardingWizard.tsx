'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  userId: string
  redirectAfter: string
}

const TOTAL_STEPS = 3

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex gap-2 justify-center mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i + 1 === current
              ? 'bg-brand-red'
              : i + 1 < current
              ? 'bg-steel'
              : 'bg-smoke'
          }`}
        />
      ))}
    </div>
  )
}

export function InstructorOnboardingWizard({ userId, redirectAfter }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const inputCls = 'w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none'
  const labelCls = 'text-xs font-bold uppercase tracking-widest text-steel'
  const primaryBtn = 'px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60'
  const secondaryBtn = 'px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors'

  async function saveBio() {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio }),
    })
    if (!res.ok) throw new Error('Save failed')
  }

  async function markComplete() {
    const res = await fetch('/api/user/complete-onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'instructor' }),
    })
    if (!res.ok) throw new Error('Failed to mark complete')
  }

  async function handleNext(saveFn?: () => Promise<void>) {
    setSaving(true)
    setError('')
    try {
      if (saveFn) await saveFn()
      setStep(s => s + 1)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <StepDots current={step} />

      <div className="border border-smoke bg-paper p-8">
        {/* ── Step 1: Welcome ── */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 1 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-xl text-ink mb-2">You've been added as an instructor.</h2>
              <p className="text-sm text-slate">Here's a quick overview of your tools.</p>
            </div>

            <div className="border border-smoke p-5 flex flex-col gap-3">
              {[
                ['Sessions', 'View your upcoming classes and manage session details'],
                ['Attendance', 'Mark students present, view who checked in'],
                ['Student Notes', 'Private notes per student — only you and admins can see them'],
                ['Lesson Plans', 'Build and reuse structured plans for your classes'],
                ['Sub Requests', 'Release a session and let another instructor cover it'],
              ].map(([title, desc]) => (
                <div key={title} className="flex flex-col gap-0.5">
                  <div className="text-sm font-semibold text-ink">{title}</div>
                  <div className="text-xs text-slate">{desc}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button onClick={() => handleNext()} className={primaryBtn}>
                Got it →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Instructor Profile ── */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 2 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-xl text-ink mb-1">Your instructor profile</h2>
              <p className="text-sm text-slate">Your bio is visible to students on lesson requests.</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={5}
                className={inputCls}
                placeholder="Your background, specialties, teaching philosophy..."
              />
            </div>

            {error && <p className="text-sm text-brand-red">{error}</p>}

            <div className="flex justify-between">
              <button onClick={() => setStep(s => s - 1)} className={secondaryBtn}>← Back</button>
              <button
                onClick={() => handleNext(saveBio)}
                disabled={saving}
                className={primaryBtn}
              >
                {saving ? 'Saving…' : 'Next →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Complete ── */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 3 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-2xl text-ink mb-2">You're ready to teach.</h2>
              <p className="text-sm text-slate">Jump in whenever you're ready.</p>
            </div>

            <div className="flex flex-col gap-3 border-t border-smoke pt-5">
              <Link href="/instructor" className="flex items-center justify-between py-2 text-sm text-ink hover:text-brand-red transition-colors">
                <span>Your Dashboard</span>
                <span className="text-ash">→</span>
              </Link>
              <Link href="/instructor/classes" className="flex items-center justify-between py-2 text-sm text-ink hover:text-brand-red transition-colors border-t border-smoke">
                <span>Your Classes</span>
                <span className="text-ash">→</span>
              </Link>
              <Link href="/lessons" className="flex items-center justify-between py-2 text-sm text-ink hover:text-brand-red transition-colors border-t border-smoke">
                <span>Lesson Requests</span>
                <span className="text-ash">→</span>
              </Link>
            </div>

            {error && <p className="text-sm text-brand-red">{error}</p>}

            <div className="flex justify-between">
              <button onClick={() => setStep(s => s - 1)} className={secondaryBtn}>← Back</button>
              <button
                onClick={async () => {
                  setSaving(true)
                  setError('')
                  try {
                    await markComplete()
                    router.push(redirectAfter)
                    router.refresh()
                  } catch {
                    setError('Failed to complete setup.')
                    setSaving(false)
                  }
                }}
                disabled={saving}
                className={primaryBtn}
              >
                {saving ? 'Finishing…' : 'Go to Instructor Dashboard'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
