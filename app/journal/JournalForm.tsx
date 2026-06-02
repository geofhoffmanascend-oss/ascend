'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { JOURNAL_PROMPTS, GuidedResponse } from '@/lib/journalPrompts'

type Props = {
  classSessionId: string | null
  defaultPromptKeys: string[]
  initial?: {
    id: string
    title: string | null
    isPrivate: boolean
    isGuided: boolean
    freeFormContent: string | null
    guidedResponses: GuidedResponse[] | null
  }
}

const CATEGORY_LABELS = { wellness: 'Wellness', training: 'Training', reflection: 'Reflection' }

export function JournalForm({ classSessionId, defaultPromptKeys, initial }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [isPrivate, setIsPrivate] = useState(initial?.isPrivate ?? false)
  const [isGuided, setIsGuided] = useState(initial?.isGuided ?? false)
  const [freeForm, setFreeForm] = useState(initial?.freeFormContent ?? '')
  const [responses, setResponses] = useState<Record<string, string>>(() => {
    if (initial?.guidedResponses) {
      return Object.fromEntries(initial.guidedResponses.map(r => [r.promptKey, r.answer]))
    }
    return {}
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const visiblePrompts = JOURNAL_PROMPTS.filter(p => defaultPromptKeys.includes(p.key))

  function setResponse(key: string, value: string) {
    setResponses(r => ({ ...r, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const guidedResponses: GuidedResponse[] = isGuided
      ? JOURNAL_PROMPTS
          .filter(p => responses[p.key]?.trim())
          .map(p => ({ promptKey: p.key, question: p.question, answer: responses[p.key].trim() }))
      : []

    const body = {
      classSessionId,
      title: title.trim() || null,
      isPrivate,
      isGuided,
      freeFormContent: !isGuided ? freeForm : null,
      guidedResponses: isGuided ? guidedResponses : null,
    }

    const url = initial ? `/api/training-logs/${initial.id}` : '/api/training-logs'
    const method = initial ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      setError('Failed to save. Please try again.')
      setSaving(false)
      return
    }

    const log = await res.json()
    router.push(`/journal/${log.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Optional title */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Title <span className="font-normal normal-case tracking-normal text-ash">(optional)</span></label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Back takes, guard passing…"
          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
        />
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap gap-6 border border-smoke bg-paper p-4">
        {/* Private toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={isPrivate} onChange={() => setIsPrivate(v => !v)} />
            <div className={`w-10 h-5 rounded-full transition-colors ${isPrivate ? 'bg-brand-red' : 'bg-smoke'}`} />
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-paper rounded-full shadow transition-transform ${isPrivate ? 'translate-x-5' : ''}`} />
          </div>
          <span className="text-sm text-ink font-medium">Private</span>
          <span
            className="text-xs text-ash border border-smoke px-1.5 py-0.5 cursor-help"
            title="Private entries are only visible to you — not your instructor."
          >
            ?
          </span>
        </label>

        {/* Guided toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={isGuided} onChange={() => setIsGuided(v => !v)} />
            <div className={`w-10 h-5 rounded-full transition-colors ${isGuided ? 'bg-brand-red' : 'bg-smoke'}`} />
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-paper rounded-full shadow transition-transform ${isGuided ? 'translate-x-5' : ''}`} />
          </div>
          <span className="text-sm text-ink font-medium">Guided</span>
        </label>
      </div>

      {/* Free-form */}
      {!isGuided && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">Training Notes</label>
          <textarea
            value={freeForm}
            onChange={e => setFreeForm(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
            placeholder="What did you work on today?…"
          />
        </div>
      )}

      {/* Guided prompts */}
      {isGuided && (
        <div className="flex flex-col gap-6">
          {(['wellness', 'training', 'reflection'] as const).map(cat => {
            const prompts = visiblePrompts.filter(p => p.category === cat)
            if (prompts.length === 0) return null
            return (
              <div key={cat}>
                <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">{CATEGORY_LABELS[cat]}</p>
                <div className="flex flex-col gap-4">
                  {prompts.map(p => (
                    <div key={p.key} className="flex flex-col gap-1">
                      <label className="text-sm text-ink">{p.question}</label>
                      {p.inputType === 'rating' ? (
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setResponse(p.key, String(n))}
                              className={`w-9 h-9 border text-sm font-bold transition-colors ${
                                responses[p.key] === String(n)
                                  ? 'bg-brand-red border-brand-red text-paper'
                                  : 'border-smoke text-steel hover:border-steel'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      ) : p.inputType === 'textarea' ? (
                        <textarea
                          value={responses[p.key] ?? ''}
                          onChange={e => setResponse(p.key, e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
                        />
                      ) : (
                        <input
                          type="text"
                          value={responses[p.key] ?? ''}
                          onChange={e => setResponse(p.key, e.target.value)}
                          className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : "'ScendIt"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
