'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const TOTAL_STEPS = 2

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

export function AdminOnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const primaryBtn = 'px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60'
  const secondaryBtn = 'px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors'

  async function markComplete() {
    const res = await fetch('/api/user/complete-onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' }),
    })
    if (!res.ok) throw new Error('Failed to mark complete')
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
              <h2 className="font-display text-xl text-ink mb-1">See everything. Run a tighter gym.</h2>
              <p className="text-sm text-slate">You have admin access. Here's what you can do.</p>
            </div>

            <div className="border border-smoke p-5 flex flex-col gap-3">
              {[
                ['User Management', 'View all members, assign roles, manage class access'],
                ['Class Management', 'Create and edit recurring classes and schedules'],
                ['Attendance Reports', 'Track attendance by class, instructor, or student'],
                ['Forum Moderation', 'Pin posts, manage forum access by class group'],
                ['Store', 'Manage products, track orders, mark pickups'],
                ['Settings', 'Gym review URL and global configuration'],
              ].map(([title, desc]) => (
                <div key={title} className="flex flex-col gap-0.5">
                  <div className="text-sm font-semibold text-ink">{title}</div>
                  <div className="text-xs text-slate">{desc}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button onClick={() => setStep(2)} className={primaryBtn}>
                Got it →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Quick Setup Checklist ── */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 2 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-xl text-ink mb-1">Quick setup checklist</h2>
              <p className="text-sm text-slate">A few things to check before you get started.</p>
            </div>

            <div className="flex flex-col gap-4 border border-smoke p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-4 h-4 border border-smoke flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-ink">
                    <Link href="/admin/settings" className="hover:text-brand-red transition-colors underline underline-offset-2">
                      Set your public review URL
                    </Link>
                  </div>
                  <div className="text-xs text-slate">Where students are sent after a great class experience</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-4 h-4 border border-smoke flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-ink">
                    <Link href="/admin/classes" className="hover:text-brand-red transition-colors underline underline-offset-2">
                      Create your first class (or check existing classes)
                    </Link>
                  </div>
                  <div className="text-xs text-slate">Set up recurring class schedule</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-4 h-4 border border-smoke flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-ink">
                    <Link href="/admin/users" className="hover:text-brand-red transition-colors underline underline-offset-2">
                      Review your users
                    </Link>
                  </div>
                  <div className="text-xs text-slate">Assign roles, manage class access per member</div>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-brand-red">{error}</p>}

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className={secondaryBtn}>← Back</button>
              <button
                onClick={async () => {
                  setSaving(true)
                  setError('')
                  try {
                    await markComplete()
                    router.push('/admin')
                    router.refresh()
                  } catch {
                    setError('Failed to complete setup.')
                    setSaving(false)
                  }
                }}
                disabled={saving}
                className={primaryBtn}
              >
                {saving ? 'Finishing…' : 'All done — Go to Admin Dashboard'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
