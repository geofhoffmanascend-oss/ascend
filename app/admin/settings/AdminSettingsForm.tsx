'use client'

import { useState } from 'react'

export function AdminSettingsForm({ initial }: { initial: { reviewUrl: string } }) {
  const [reviewUrl, setReviewUrl] = useState(initial.reviewUrl)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewUrl }),
    })
    setSaving(false)
    setSaved(true)
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <div className="border border-smoke bg-paper p-6 flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Public Review Link</p>
        <p className="text-xs text-ash -mt-2">
          Where to send students who want to leave a public review. Recommend Google Business Profile —
          it shows in search results and requires no app.
        </p>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Review URL</label>
          <input
            type="url"
            value={reviewUrl}
            onChange={e => { setReviewUrl(e.target.value); setSaved(false) }}
            placeholder="https://g.page/r/your-gym/review"
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          />
          <p className="text-xs text-ash">
            Paste your Google Business Profile review link, Yelp page, or any public review site URL.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {saved && <p className="text-sm text-steel">Saved.</p>}
      </div>
    </form>
  )
}
