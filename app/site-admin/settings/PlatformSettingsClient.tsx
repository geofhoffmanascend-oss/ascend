'use client'

import { useState } from 'react'
import type { PlatformFlags } from '@/lib/platformSettings'

const TOGGLES: { key: keyof PlatformFlags; label: string; description: string; dangerOff?: boolean }[] = [
  {
    key: 'scheduleReadOnly',
    label: 'Schedule Read-Only',
    description: 'When ON, students cannot register for classes or check in. Instructors and admins are unaffected. Use before launch or during maintenance.',
    dangerOff: false, // "off" here means read-only is disabled (normal operation)
  },
  {
    key: 'allowGymForumCreation',
    label: 'Gym Forum Creation',
    description: 'Allow members to create community forums for their gym. Disable to prevent new gym forums before you are ready to moderate them.',
  },
  {
    key: 'allowBeltForumPosting',
    label: 'Belt Forum Posting',
    description: 'Allow users to post in the public belt forums. Disable if belt forums are not yet seeded or you want to open them gradually.',
  },
  {
    key: 'allowEventSubmission',
    label: 'Community Event Submission',
    description: 'Allow any authenticated user to submit events to the public calendar. Disable before launch while the approval workflow is being tested.',
  },
  {
    key: 'allowTournamentRegistration',
    label: 'Tournament Registration',
    description: 'Allow students to register for tournament divisions. Disable to freeze registrations while brackets are being set up.',
  },
  {
    key: 'galleryUploadEnabled',
    label: 'Gallery Uploads',
    description: 'Allow users to upload photos and video links. Disable if Cloudinary credentials are not configured or during a media freeze.',
  },
  {
    key: 'storeEnabled',
    label: 'Gear Store',
    description: 'Show the store to students. Disable before products are added or before the gym is ready to fulfil orders.',
  },
]

export function PlatformSettingsClient({ initial }: { initial: PlatformFlags }) {
  const [flags, setFlags] = useState<PlatformFlags>(initial)
  const [saving, setSaving] = useState<keyof PlatformFlags | null>(null)
  const [saved, setSaved] = useState<keyof PlatformFlags | null>(null)

  async function toggle(key: keyof PlatformFlags) {
    const newVal = !flags[key]
    setSaving(key)
    const res = await fetch('/api/site-admin/platform-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: newVal }),
    })
    if (res.ok) {
      setFlags(f => ({ ...f, [key]: newVal }))
      setSaved(key)
      setTimeout(() => setSaved(null), 2000)
    }
    setSaving(null)
  }

  // scheduleReadOnly is inverted — the toggle label says "read-only mode" so ON = restricted
  function displayValue(key: keyof PlatformFlags): boolean {
    return flags[key]
  }

  function isOn(key: keyof PlatformFlags): boolean {
    if (key === 'scheduleReadOnly') return flags[key] // ON = read-only mode active
    return flags[key] // ON = feature enabled
  }

  return (
    <div className="flex flex-col gap-4">
      {TOGGLES.map(({ key, label, description }) => {
        const on = isOn(key)
        const isReadOnlyToggle = key === 'scheduleReadOnly'
        // For scheduleReadOnly: ON is a warning state (restricted); for others: OFF is the warning state
        const isWarning = isReadOnlyToggle ? on : !on

        return (
          <div key={key} className={`border bg-paper p-5 ${isWarning ? 'border-amber-300' : 'border-smoke'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-ink">{label}</p>
                  {isWarning && (
                    <span className="text-xs font-bold uppercase tracking-wide text-amber-600 border border-amber-300 px-1.5 py-0.5">
                      {isReadOnlyToggle ? 'Active' : 'Disabled'}
                    </span>
                  )}
                  {saved === key && (
                    <span className="text-xs text-green-600 font-medium">Saved ✓</span>
                  )}
                </div>
                <p className="text-xs text-ash leading-relaxed">{description}</p>
              </div>

              <button
                onClick={() => toggle(key)}
                disabled={saving === key}
                className={`flex-shrink-0 relative w-11 h-6 rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                  on ? 'bg-brand-red' : 'bg-smoke'
                }`}
                role="switch"
                aria-checked={on}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-paper shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="mt-2 pt-2 border-t border-smoke">
              <p className={`text-xs font-medium ${on && !isReadOnlyToggle ? 'text-green-600' : isReadOnlyToggle && on ? 'text-amber-600' : 'text-ash'}`}>
                {isReadOnlyToggle
                  ? on ? 'Schedule is in read-only mode — students cannot register or check in' : 'Normal — students can register and check in'
                  : on ? 'Enabled — feature is available to users' : 'Disabled — feature is hidden from users'
                }
              </p>
            </div>
          </div>
        )
      })}

      <p className="text-xs text-ash mt-2">
        Changes apply immediately. Site admins and gym admins bypass all feature toggles.
      </p>
    </div>
  )
}
