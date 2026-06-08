'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const WEIGHT_CLASSES = [
  'Rooster', 'Light-Feather', 'Feather', 'Light', 'Middle',
  'Medium-Heavy', 'Heavy', 'Super-Heavy', 'Ultra-Heavy',
]

type Visibility = 'public' | 'members' | 'private'

const PRIVACY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'members', label: 'Members' },
  { value: 'private', label: 'Private' },
]

const PRIVACY_DEFAULTS: Record<string, Visibility> = {
  bio: 'members',
  phone: 'private',
  emergencyContact: 'private',
  weightClass: 'members',
  competitions: 'members',
}

type Props = {
  userId: string
  initial: {
    name: string
    bio: string
    phone: string
    emergencyContact: string
    avatarUrl: string
    weightClass: string
  }
  profilePrivacy: Record<string, string>
}

function PrivacySelect({ field, privacy, onChange }: { field: string; privacy: Record<string, string>; onChange: (field: string, value: string) => void }) {
  const value = (privacy[field] as Visibility) ?? PRIVACY_DEFAULTS[field] ?? 'members'
  return (
    <select
      value={value}
      onChange={e => onChange(field, e.target.value)}
      className="text-xs px-2 py-1 border border-smoke bg-paper text-steel focus:outline-none focus:border-brand-red transition-colors"
      title="Who can see this field"
    >
      {PRIVACY_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export function EditProfileForm({ userId, initial, profilePrivacy: initialPrivacy }: Props) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [privacy, setPrivacy] = useState<Record<string, string>>(initialPrivacy)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function uploadAvatar(file: File) {
    setError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      update('avatarUrl', data.url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  function updatePrivacy(field: string, value: string) {
    setPrivacy(p => ({ ...p, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, profilePrivacy: privacy }),
    })

    if (!res.ok) {
      setError('Failed to save. Please try again.')
      setSaving(false)
      return
    }

    router.push('/profile')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={e => update('name', e.target.value)}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          placeholder="Your full name"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Bio</label>
          <PrivacySelect field="bio" privacy={privacy} onChange={updatePrivacy} />
        </div>
        <textarea
          value={form.bio}
          onChange={e => update('bio', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
          placeholder="A little about your training background…"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Phone</label>
          <PrivacySelect field="phone" privacy={privacy} onChange={updatePrivacy} />
        </div>
        <input
          type="tel"
          value={form.phone}
          onChange={e => update('phone', e.target.value)}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          placeholder="(555) 000-0000"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Emergency Contact</label>
          <PrivacySelect field="emergencyContact" privacy={privacy} onChange={updatePrivacy} />
        </div>
        <input
          type="text"
          value={form.emergencyContact}
          onChange={e => update('emergencyContact', e.target.value)}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          placeholder="Name — (555) 000-0000"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Profile Picture</label>
        <div className="flex items-center gap-4">
          {form.avatarUrl
            ? <img src={form.avatarUrl} alt="Avatar preview" className="w-16 h-16 rounded-full object-cover border border-smoke flex-shrink-0" />
            : <div className="w-16 h-16 rounded-full bg-mist border border-smoke flex-shrink-0" />}
          <div className="flex flex-col gap-2">
            <label className="px-4 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors cursor-pointer self-start">
              {uploading ? 'Uploading…' : 'Upload a photo'}
              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }} />
            </label>
            {form.avatarUrl && (
              <button type="button" onClick={() => update('avatarUrl', '')} className="text-xs text-brand-red hover:underline self-start">Remove</button>
            )}
          </div>
        </div>
        <input
          type="url"
          value={form.avatarUrl}
          onChange={e => update('avatarUrl', e.target.value)}
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          placeholder="…or paste an image URL"
        />
      </div>

      <p className="text-xs text-ash -mt-2">
        <span className="font-medium">Public</span> fields are visible to anyone.{' '}
        <span className="font-medium">Members</span> fields are visible to logged-in users.{' '}
        <span className="font-medium">Private</span> fields are visible only to you and admins.
      </p>

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/profile')}
          className="px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
