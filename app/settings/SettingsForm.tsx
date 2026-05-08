'use client'

import { useState } from 'react'

type Prefs = {
  notifyClassUpdates:    boolean
  notifyInstructorNotes: boolean
  notifyPrivateMessages: boolean
  notifyCheckinPrompts:  boolean
  notifyFeedbackPrompts: boolean
  notifyByEmail:         boolean
  allowDmsFromStudents:  boolean
}

type Props = { userId: string; initial: Prefs }

export function SettingsForm({ userId, initial }: Props) {
  const [prefs, setPrefs] = useState<Prefs>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggle(field: keyof Prefs) {
    setPrefs(p => ({ ...p, [field]: !p[field] }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    })
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="flex flex-col gap-6">

      <section className="border border-smoke bg-paper p-6 flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Notification Types</p>
        <p className="text-xs text-ash -mt-2">Choose which notifications you'd like to receive.</p>

        <Toggle label="Class updates" checked={prefs.notifyClassUpdates} onChange={() => toggle('notifyClassUpdates')} />
        <Toggle label="Instructor notes" checked={prefs.notifyInstructorNotes} onChange={() => toggle('notifyInstructorNotes')} />
        <Toggle label="Private messages" checked={prefs.notifyPrivateMessages} onChange={() => toggle('notifyPrivateMessages')} />
        <Toggle label="Check-in reminders (15 min before class)" checked={prefs.notifyCheckinPrompts} onChange={() => toggle('notifyCheckinPrompts')} />
        <Toggle label="Post-class feedback prompts (1 hr after class)" checked={prefs.notifyFeedbackPrompts} onChange={() => toggle('notifyFeedbackPrompts')} />
      </section>

      <section className="border border-smoke bg-paper p-6 flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Email Notifications</p>
        <Toggle
          label="Send email copies of notifications"
          description="Receive an email for each in-app notification."
          checked={prefs.notifyByEmail}
          onChange={() => toggle('notifyByEmail')}
        />
      </section>

      <section className="border border-smoke bg-paper p-6 flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Direct Messages</p>
        <Toggle
          label="Allow messages from other students"
          description="When off, only instructors and admins can send you direct messages."
          checked={prefs.allowDmsFromStudents}
          onChange={() => toggle('allowDmsFromStudents')}
        />
      </section>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {saved && <p className="text-sm text-steel">Saved.</p>}
      </div>
    </div>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="relative mt-0.5 shrink-0">
        <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
        <div className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-brand-red' : 'bg-smoke'}`} />
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-paper rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
      <div>
        <p className="text-sm text-ink font-medium">{label}</p>
        {description && <p className="text-xs text-ash mt-0.5">{description}</p>}
      </div>
    </label>
  )
}
