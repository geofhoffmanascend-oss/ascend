'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { BeltBadge } from '@/app/components/BeltBadge'
import { GYM_SETUP_ITEMS } from '@/lib/gymSetupItems'

type Member = {
  id: string
  name: string | null
  belt: string | null
  roles: string[]
}

const TOTAL_STEPS = 3

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex gap-2 justify-center mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i + 1 === current ? 'bg-brand-red' : i + 1 < current ? 'bg-steel' : 'bg-smoke'
          }`}
        />
      ))}
    </div>
  )
}

export function OwnerOnboardingWizard({
  userId,
  gymName,
  gymSlug,
  memberCount,
  memberPreview,
}: {
  userId: string
  gymName: string
  gymSlug: string
  memberCount: number
  memberPreview: Member[]
}) {
  const router = useRouter()
  const { update } = useSession()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const primaryBtn = 'px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60'
  const secondaryBtn = 'px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors'

  async function finish() {
    setSaving(true)
    setError('')
    try {
      // D-DONE — mark both granted roles onboarded, then flag onboarding done.
      for (const role of ['admin', 'instructor']) {
        const res = await fetch('/api/user/complete-onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        })
        if (!res.ok) throw new Error('Failed to complete setup')
      }
      const done = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingDone: true }),
      })
      if (!done.ok) throw new Error('Failed to complete setup')
      // Re-mint the JWT cookie so middleware admits the admin role on /admin.
      await update()
      router.push('/admin')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div>
      <StepDots current={step} />

      <div className="border border-smoke bg-paper p-8">
        {/* ── Step 1: Who's already here (38.4) ── */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 1 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-xl text-ink mb-1">Who's already at {gymName}</h2>
              <p className="text-sm text-slate">
                {memberCount > 0
                  ? `${memberCount} other ${memberCount === 1 ? 'person is' : 'people are'} already affiliated with your gym on AscendIt. They'll be part of your roster.`
                  : "You're the first person from your gym on AscendIt. As athletes join and pick your gym, they'll show up here as your roster."}
              </p>
            </div>

            {memberPreview.length > 0 && (
              <div className="border border-smoke divide-y divide-smoke">
                {memberPreview.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-medium text-ink">{m.name ?? 'Unnamed'}</span>
                    {m.belt && <BeltBadge belt={m.belt as any} stripes={0} />}
                  </div>
                ))}
                {memberCount > memberPreview.length && (
                  <div className="px-4 py-2 text-xs text-slate">+ {memberCount - memberPreview.length} more</div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={() => setStep(2)} className={primaryBtn}>Next →</button>
            </div>
          </div>
        )}

        {/* ── Step 2: Setup checklist (38.3) ── */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 2 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-xl text-ink mb-1">Get your gym running</h2>
              <p className="text-sm text-slate">
                Here's what to set up. You can do these now or anytime from your admin dashboard —
                your progress is tracked there.
              </p>
            </div>

            <div className="flex flex-col border border-smoke divide-y divide-smoke">
              {GYM_SETUP_ITEMS.map(item => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="group flex items-center justify-between gap-3 p-4 hover:bg-mist transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium text-ink group-hover:text-brand-red transition-colors">{item.title}</div>
                    <div className="text-xs text-slate">{item.desc}</div>
                  </div>
                  <span className="text-ash group-hover:text-brand-red transition-colors flex-shrink-0">→</span>
                </Link>
              ))}
            </div>
            <p className="text-xs text-ash -mt-2">
              You can do these now or anytime — your admin dashboard tracks which are done.
            </p>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className={secondaryBtn}>← Back</button>
              <button onClick={() => setStep(3)} className={primaryBtn}>Next →</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Finish ── */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 3 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-xl text-ink mb-1">You're all set</h2>
              <p className="text-sm text-slate">
                {gymName} is live on AscendIt. Your admin dashboard has a setup checklist you can
                finish whenever you're ready.
              </p>
            </div>

            <div className="border border-smoke p-5 flex flex-col gap-2 text-sm text-slate">
              <p>
                <Link href={`/gyms/${gymSlug}`} className="text-brand-red hover:underline">View your public gym page →</Link>
              </p>
              <p className="text-xs text-ash">
                Want a personal athlete profile too? You can build one anytime from your profile settings —
                it's separate from your gym.
              </p>
            </div>

            {error && <p className="text-sm text-brand-red">{error}</p>}

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className={secondaryBtn}>← Back</button>
              <button onClick={finish} disabled={saving} className={primaryBtn}>
                {saving ? 'Finishing…' : 'Go to Admin Dashboard →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
