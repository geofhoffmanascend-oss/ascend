'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GYM_SETUP_ITEMS, type GymSetupProgress } from '@/lib/gymSetupItems'

// Phase 38.3 — stateful "Finish setting up your gym" checklist on the admin
// dashboard. Persists to Gym.setupProgress via PUT /api/admin/gym-setup.
// Hides itself once every item is checked.
export function GymSetupCard({ initial }: { initial: GymSetupProgress }) {
  const [progress, setProgress] = useState<GymSetupProgress>(initial)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const allDone = GYM_SETUP_ITEMS.every(i => progress[i.key])
  if (allDone) return null

  const doneCount = GYM_SETUP_ITEMS.filter(i => progress[i.key]).length

  async function toggle(key: keyof GymSetupProgress) {
    const next = !progress[key]
    setSavingKey(key)
    setProgress(p => ({ ...p, [key]: next }))
    try {
      await fetch('/api/admin/gym-setup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: next }),
      })
    } catch {
      // revert on failure
      setProgress(p => ({ ...p, [key]: !next }))
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="border border-brand-red bg-paper p-6 mb-8">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="font-display text-lg text-ink">Finish setting up your gym</h2>
        <span className="text-xs text-slate">{doneCount} of {GYM_SETUP_ITEMS.length} done</span>
      </div>
      <p className="text-sm text-slate mb-4">Complete these to get the most out of AscendIt.</p>

      <div className="flex flex-col gap-3">
        {GYM_SETUP_ITEMS.map(item => {
          const checked = progress[item.key]
          return (
            <div key={item.key} className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggle(item.key)}
                disabled={savingKey === item.key}
                aria-pressed={checked}
                aria-label={`Mark "${item.title}" ${checked ? 'not done' : 'done'}`}
                className={`mt-0.5 w-4 h-4 flex-shrink-0 border flex items-center justify-center transition-colors ${
                  checked ? 'bg-brand-red border-brand-red text-paper' : 'border-smoke hover:border-steel'
                }`}
              >
                {checked && (
                  <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <div>
                <div className={`text-sm font-medium ${checked ? 'text-ash line-through' : 'text-ink'}`}>
                  <Link href={item.href} className="hover:text-brand-red transition-colors underline underline-offset-2">
                    {item.title}
                  </Link>
                </div>
                <div className="text-xs text-slate">{item.desc}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
