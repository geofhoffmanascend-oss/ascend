'use client'

import { useState } from 'react'
import { GYM_FEATURE_LABELS, type GymFeatureFlags } from '@/lib/gymFeatures'

export function GymFeaturesForm({ initial }: { initial: GymFeatureFlags }) {
  const [flags, setFlags] = useState<GymFeatureFlags>(initial)
  const [savingKey, setSavingKey] = useState<keyof GymFeatureFlags | null>(null)
  const [error, setError] = useState('')

  async function toggle(key: keyof GymFeatureFlags) {
    const next = !flags[key]
    setFlags(f => ({ ...f, [key]: next }))
    setSavingKey(key)
    setError('')
    try {
      const res = await fetch('/api/admin/gym-features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: next }),
      })
      if (!res.ok) throw new Error('save failed')
    } catch {
      setFlags(f => ({ ...f, [key]: !next })) // revert
      setError('Failed to save. Please try again.')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="border border-smoke bg-paper p-6 flex flex-col gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Gym Features</p>
        <p className="text-xs text-ash mt-1">
          Turn off features your gym doesn’t use. Disabled features are hidden from your members.
          As an admin you always keep access.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-smoke">
        {GYM_FEATURE_LABELS.map(({ key, label, hint }) => (
          <div key={key} className="flex items-center justify-between gap-4 py-3">
            <div>
              <div className="text-sm font-medium text-ink">{label}</div>
              <div className="text-xs text-ash">{hint}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={flags[key]}
              disabled={savingKey === key}
              onClick={() => toggle(key)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
                flags[key] ? 'bg-brand-red' : 'bg-smoke'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-paper transition-transform ${
                  flags[key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-brand-red">{error}</p>}
    </div>
  )
}
