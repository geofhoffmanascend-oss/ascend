'use client'

import { useState, useCallback } from 'react'
import { JOURNAL_PROMPTS } from '@/lib/journalPrompts'
import { PushPermissionButton } from '@/app/components/PushPermissionButton'
import { Toast } from '@/app/components/Toast'
import { GymPicker } from '@/app/components/GymPicker'

type Prefs = {
  notifyInstructorNotes: boolean
  notifyPrivateMessages: boolean
  notifyGroupChats:      boolean
  notifyForumActivity:   boolean
  notifyCheckinPrompts:  boolean
  notifyFeedbackPrompts: boolean
  notifyByEmail:         boolean
  allowDmsFromStudents:  boolean
  allowMediaTagging:     boolean
  competeTournaments:    boolean
  acceptsChallenges:     boolean
  defaultJournalPrompts: string | null
}

type ForumRow = { id: string; title: string; type: string; classGroup: string | null; subscribed: boolean }
type ConnectedChat = { id: string; title: string; gymName: string | null; members: number; requested: boolean }

type Props = {
  userId: string
  initial: Prefs
  forums: ForumRow[]
  connectedChats: ConnectedChat[]
  currentGym: { id: string; name: string } | null
}

const CATEGORY_LABELS = { wellness: 'Wellness', training: 'Training', reflection: 'Reflection' }

export function SettingsForm({ userId, initial, forums: initialForums, connectedChats, currentGym }: Props) {
  const [prefs, setPrefs] = useState<Prefs>(initial)
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
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Competition</p>
        <Toggle
          label="Compete in tournaments"
          description="Show interest in in-house tournaments your gym runs."
          checked={prefs.competeTournaments}
          onChange={() => toggle('competeTournaments')}
        />
        <Toggle
          label="Accept challenge matches"
          description="Adds a 'Challenge' button to your public profile so other members can propose a match. You can turn this off anytime."
          checked={prefs.acceptsChallenges}
          onChange={() => toggle('acceptsChallenges')}
        />
      </section>

      <section className="border border-smoke bg-paper p-6 flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Push Notifications</p>
        <p className="text-xs text-ash -mt-2">Receive real-time alerts on this device.</p>
        <PushPermissionButton />
      </section>

      <section className="border border-smoke bg-paper p-6 flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Notification Types</p>
        <p className="text-xs text-ash -mt-2">Choose which notifications you'd like to receive.</p>
        <Toggle
          label="Direct messages"
          description="When someone sends you a direct message."
          checked={prefs.notifyPrivateMessages} onChange={() => toggle('notifyPrivateMessages')} />
        <Toggle
          label="Group chats"
          description="New messages in group chats you're part of."
          checked={prefs.notifyGroupChats} onChange={() => toggle('notifyGroupChats')} />
        <Toggle
          label="Forum activity"
          description="New posts in any forum you're subscribed to."
          checked={prefs.notifyForumActivity} onChange={() => toggle('notifyForumActivity')} />
        <Toggle
          label="Instructor messages"
          description="A direct message from an instructor you have an upcoming or past private lesson with."
          checked={prefs.notifyInstructorNotes} onChange={() => toggle('notifyInstructorNotes')} />
        <Toggle
          label="Class check-in reminders"
          description="A reminder 15 minutes before a class you've registered for. Only applies at participating gyms."
          checked={prefs.notifyCheckinPrompts} onChange={() => toggle('notifyCheckinPrompts')} />
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

      {/* Forum subscriptions (public forums only) — saved immediately per toggle */}
      <ForumSubscriptionsSection forums={initialForums} />

      {/* Group chats you can request to join (via people you follow / who follow you) */}
      <ConnectedChatsSection chats={connectedChats} />

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

function ForumSubscriptionsSection({ forums }: { forums: ForumRow[] }) {
  const [subs, setSubs] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    forums.forEach(f => { map[f.id] = f.subscribed })
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

  if (forums.length === 0) return null

  return (
    <section className="border border-smoke bg-paper p-6 flex flex-col gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Forum Subscriptions</p>
        <p className="text-xs text-ash mt-1">Get a notification when new posts are made in the public forums you subscribe to.</p>
      </div>
      <div className="flex flex-col gap-3">
        {forums.map(f => (
          <ForumToggle key={f.id} forum={f} subscribed={subs[f.id] ?? false} loading={pending === f.id} onToggle={() => toggleForum(f.id)} />
        ))}
      </div>
    </section>
  )
}

function ConnectedChatsSection({ chats }: { chats: ConnectedChat[] }) {
  const [requested, setRequested] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    chats.forEach(c => { map[c.id] = c.requested })
    return map
  })
  const [pending, setPending] = useState<string | null>(null)

  async function request(chatId: string) {
    setPending(chatId)
    const res = await fetch(`/api/group-chats/${chatId}/join`, { method: 'POST' })
    if (res.ok) setRequested(r => ({ ...r, [chatId]: true }))
    setPending(null)
  }

  if (chats.length === 0) return null

  return (
    <section className="border border-smoke bg-paper p-6 flex flex-col gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Group Chats You Can Join</p>
        <p className="text-xs text-ash mt-1">Chats that people you’re connected to are part of. Request to join, and any member can approve you.</p>
      </div>
      <div className="flex flex-col gap-2">
        {chats.map(c => (
          <div key={c.id} className="flex items-center justify-between gap-3 border border-smoke px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm text-ink font-medium truncate">{c.title}</p>
              <p className="text-xs text-ash">{c.gymName ? `${c.gymName} · ` : ''}{c.members} {c.members === 1 ? 'member' : 'members'}</p>
            </div>
            {requested[c.id]
              ? <span className="text-xs text-slate shrink-0">Requested</span>
              : <button onClick={() => request(c.id)} disabled={pending === c.id} className="text-xs bg-brand-red text-paper font-bold px-3 py-1.5 disabled:opacity-50 shrink-0">Request</button>}
          </div>
        ))}
      </div>
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
