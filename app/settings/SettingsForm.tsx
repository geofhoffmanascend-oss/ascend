'use client'

import { useState, useCallback } from 'react'
import { JOURNAL_PROMPTS } from '@/lib/journalPrompts'
import { PushPermissionButton } from '@/app/components/PushPermissionButton'
import { Toast } from '@/app/components/Toast'
import { ALL_GROUPS, GROUP_LABELS, GROUP_DESCRIPTIONS } from '@/lib/classGroups'
import { GymPicker } from '@/app/components/GymPicker'
import type { ClassGroup } from '@prisma/client'

type Prefs = {
  notifyClassUpdates:    boolean
  notifyInstructorNotes: boolean
  notifyPrivateMessages: boolean
  notifyCheckinPrompts:  boolean
  notifyFeedbackPrompts: boolean
  notifyByEmail:         boolean
  allowDmsFromStudents:  boolean
  allowMediaTagging:     boolean
  defaultJournalPrompts: string | null
}

type ForumRow = { id: string; title: string; type: string; classGroup: string | null; subscribed: boolean }

type Props = {
  userId: string
  initial: Prefs
  forums: ForumRow[]
  hiddenClassGroups: ClassGroup[]
  currentGym: { id: string; name: string } | null
}

const CATEGORY_LABELS = { wellness: 'Wellness', training: 'Training', reflection: 'Reflection' }

export function SettingsForm({ userId, initial, forums: initialForums, hiddenClassGroups: initialHidden, currentGym }: Props) {
  const [prefs, setPrefs] = useState<Prefs>(initial)
  const [hiddenGroups, setHiddenGroups] = useState<ClassGroup[]>(initialHidden)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const clearToast = useCallback(() => setToast(null), [])

  // Gym
  const [selectedGym, setSelectedGym] = useState<{ id: string; name: string } | null>(currentGym)
  const [gymSaving, setGymSaving] = useState(false)
  const [gymSaved, setGymSaved] = useState(false)

  async function saveGym() {
    setGymSaving(true)
    if (selectedGym) {
      // Join gym membership
      await fetch(`/api/gyms/${selectedGym.id}/membership`, { method: 'PUT' })
      // Update user.gymId
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId: selectedGym.id }),
      })
    } else {
      // Leave gym
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId: null }),
      })
    }
    setGymSaved(true)
    setTimeout(() => setGymSaved(false), 3000)
    setGymSaving(false)
  }

  const allPromptKeys = JOURNAL_PROMPTS.map(p => p.key)
  const enabledPromptKeys: string[] = prefs.defaultJournalPrompts
    ? JSON.parse(prefs.defaultJournalPrompts)
    : allPromptKeys

  function toggle(field: keyof Omit<Prefs, 'defaultJournalPrompts'>) {
    setPrefs(p => {
      const next = { ...p, [field]: !p[field] }
      if (field === 'allowDmsFromStudents' && !next.allowDmsFromStudents) {
        setToast('Students will now send you a message request instead of a direct message. You can approve or decline requests from your Messages inbox.')
      }
      if (field === 'allowMediaTagging' && !next.allowMediaTagging) {
        setToast('People can no longer tag you in photos. Existing tags are not affected.')
      }
      return next
    })
    setSaved(false)
  }

  function togglePrompt(key: string) {
    const current = enabledPromptKeys.includes(key)
      ? enabledPromptKeys.filter(k => k !== key)
      : [...enabledPromptKeys, key]
    setPrefs(p => ({ ...p, defaultJournalPrompts: JSON.stringify(current) }))
    setSaved(false)
  }

  function toggleHiddenGroup(group: ClassGroup) {
    setHiddenGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    )
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await Promise.all([
      fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      }),
      fetch('/api/user/class-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hiddenClassGroups: hiddenGroups }),
      }),
    ])
    setSaving(false)
    setSaved(true)
  }

  const generalForums = initialForums.filter(f => f.type !== 'class_forum' && f.type !== 'group_forum')
  const classForums   = initialForums.filter(f => f.type === 'class_forum')
  const groupForums   = initialForums.filter(f => f.type === 'group_forum')

  return (
    <div className="flex flex-col gap-6">

      {/* Home Gym */}
      <section className="border border-smoke bg-paper p-6 flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Home Gym</p>
        <GymPicker value={selectedGym} onChange={setSelectedGym} onCreateNew={() => {}} />
        {selectedGym && (
          <div className="flex items-center gap-2 px-3 py-2 bg-mist border border-smoke text-sm text-ink">
            <svg className="w-4 h-4 text-brand-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{selectedGym.name}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={saveGym}
            disabled={gymSaving}
            className="px-5 py-2.5 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {gymSaving ? 'Saving…' : 'Save Gym'}
          </button>
          {gymSaved && <span className="text-sm text-green-600">Saved ✓</span>}
          {selectedGym && (
            <button onClick={() => setSelectedGym(null)} className="text-sm text-ash hover:text-ink transition-colors">
              Remove gym
            </button>
          )}
        </div>
      </section>

      <section className="border border-smoke bg-paper p-6 flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Push Notifications</p>
        <p className="text-xs text-ash -mt-2">Receive real-time alerts on this device.</p>
        <PushPermissionButton />
      </section>

      <section className="border border-smoke bg-paper p-6 flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Notification Types</p>
        <p className="text-xs text-ash -mt-2">Choose which notifications you'd like to receive.</p>
        <Toggle label="Class updates"                                    checked={prefs.notifyClassUpdates}    onChange={() => toggle('notifyClassUpdates')} />
        <Toggle label="Instructor notes"                                 checked={prefs.notifyInstructorNotes} onChange={() => toggle('notifyInstructorNotes')} />
        <Toggle label="Private messages"                                 checked={prefs.notifyPrivateMessages} onChange={() => toggle('notifyPrivateMessages')} />
        <Toggle label="Check-in reminders (15 min before class)"        checked={prefs.notifyCheckinPrompts}  onChange={() => toggle('notifyCheckinPrompts')} />
        <Toggle label="Post-class feedback prompts (1 hr after class)"  checked={prefs.notifyFeedbackPrompts} onChange={() => toggle('notifyFeedbackPrompts')} />
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
        <Toggle
          label="Allow photo tagging"
          description="When off, no one can tag you in gallery photos."
          checked={prefs.allowMediaTagging}
          onChange={() => toggle('allowMediaTagging')}
        />
      </section>

      {/* Schedule preferences */}
      <section className="border border-smoke bg-paper p-6 flex flex-col gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Schedule Preferences</p>
          <p className="text-xs text-ash mt-1">Hide class groups you don't attend — they won't appear on your schedule. This only affects your view; admins can independently restrict your registration access.</p>
        </div>
        <div className="flex flex-col gap-3">
          {ALL_GROUPS.map(group => (
            <label key={group} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!hiddenGroups.includes(group)}
                onChange={() => toggleHiddenGroup(group)}
                className="mt-0.5 accent-brand-red"
              />
              <div>
                <p className="text-sm text-ink font-medium">{GROUP_LABELS[group]}</p>
                <p className="text-xs text-ash">{GROUP_DESCRIPTIONS[group]}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Forum subscriptions — saved immediately per toggle */}
      <ForumSubscriptionsSection generalForums={generalForums} classForums={classForums} groupForums={groupForums} />

      <section className="border border-smoke bg-paper p-6 flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Default Journal Prompts</p>
        <p className="text-xs text-ash -mt-2">These prompts are pre-selected when you open a new guided journal entry.</p>
        {(['wellness', 'training', 'reflection'] as const).map(cat => (
          <div key={cat}>
            <p className="text-xs font-bold text-steel uppercase tracking-widest mb-2">{CATEGORY_LABELS[cat]}</p>
            <div className="flex flex-col gap-2">
              {JOURNAL_PROMPTS.filter(p => p.category === cat).map(p => (
                <label key={p.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabledPromptKeys.includes(p.key)}
                    onChange={() => togglePrompt(p.key)}
                    className="accent-brand-red"
                  />
                  <span className="text-sm text-ink">{p.question}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {saved && <p className="text-sm text-steel">Saved.</p>}
      </div>

      {toast && <Toast message={toast} type="info" onClose={clearToast} durationMs={6000} />}
    </div>
  )
}

function ForumSubscriptionsSection({
  generalForums,
  classForums,
  groupForums,
}: {
  generalForums: ForumRow[]
  classForums: ForumRow[]
  groupForums: ForumRow[]
}) {
  const [subs, setSubs] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    ;[...generalForums, ...classForums, ...groupForums].forEach(f => { map[f.id] = f.subscribed })
    return map
  })
  const [pending, setPending] = useState<string | null>(null)

  async function toggleForum(forumId: string) {
    const current = subs[forumId]
    setPending(forumId)
    const method = current ? 'DELETE' : 'POST'
    const res = await fetch(`/api/forums/${forumId}/subscribe`, { method })
    if (res.ok) {
      setSubs(s => ({ ...s, [forumId]: !current }))
    }
    setPending(null)
  }

  const hasAny = generalForums.length > 0 || classForums.length > 0 || groupForums.length > 0
  if (!hasAny) return null

  return (
    <section className="border border-smoke bg-paper p-6 flex flex-col gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Forum Subscriptions</p>
        <p className="text-xs text-ash mt-1">Subscribed forums send you a notification when new posts are made. Class forums are auto-subscribed when you register for a class.</p>
      </div>

      {generalForums.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-steel/60">General</p>
          {generalForums.map(f => (
            <ForumToggle
              key={f.id}
              forum={f}
              subscribed={subs[f.id] ?? false}
              loading={pending === f.id}
              onToggle={() => toggleForum(f.id)}
            />
          ))}
        </div>
      )}

      {classForums.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-steel/60">Class Forums</p>
          {classForums.map(f => (
            <ForumToggle
              key={f.id}
              forum={f}
              subscribed={subs[f.id] ?? false}
              loading={pending === f.id}
              onToggle={() => toggleForum(f.id)}
            />
          ))}
        </div>
      )}

      {groupForums.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-steel/60">Class Group Forums</p>
          <p className="text-xs text-ash -mt-1">One forum per class group — subscribe to follow discussions across all classes in that group.</p>
          {groupForums.map(f => (
            <ForumToggle
              key={f.id}
              forum={f}
              subscribed={subs[f.id] ?? false}
              loading={pending === f.id}
              onToggle={() => toggleForum(f.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function ForumToggle({
  forum,
  subscribed,
  loading,
  onToggle,
}: {
  forum: ForumRow
  subscribed: boolean
  loading: boolean
  onToggle: () => void
}) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${loading ? 'opacity-50' : ''}`}>
      <div className="relative shrink-0" onClick={loading ? undefined : onToggle}>
        <input type="checkbox" className="sr-only" checked={subscribed} onChange={() => {}} />
        <div className={`w-10 h-5 rounded-full transition-colors ${subscribed ? 'bg-brand-red' : 'bg-smoke'}`} />
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-paper rounded-full shadow transition-transform ${subscribed ? 'translate-x-5' : ''}`} />
      </div>
      <span className="text-sm text-ink font-medium">{forum.title}</span>
    </label>
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
