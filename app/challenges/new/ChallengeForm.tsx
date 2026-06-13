'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RULESETS, getRuleset } from '@/lib/rulesets'
import { GymPicker } from '@/app/components/GymPicker'

const inputCls = 'w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'
const labelCls = 'text-xs font-bold uppercase tracking-widest text-steel'

export function ChallengeForm({ opponentId, opponentName }: { opponentId: string; opponentName: string }) {
  const router = useRouter()
  const [rulesetId, setRulesetId] = useState(RULESETS[0].id)
  const [minutes, setMinutes] = useState(String(RULESETS[0].periodMs / 60000))
  const [hostGym, setHostGym] = useState<{ id: string; name: string } | null>(null)
  const [scheduledAt, setScheduledAt] = useState('')
  const [location, setLocation] = useState('')
  const [message, setMessage] = useState('')
  const [agree, setAgree] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const ruleset = getRuleset(rulesetId)!

  function onRulesetChange(id: string) {
    setRulesetId(id)
    const r = getRuleset(id)
    if (r) setMinutes(String(r.periodMs / 60000))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!agree) { setError('Please acknowledge the risk + terms to continue.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengedId: opponentId,
          rulesetId,
          periodMs: Math.round(parseFloat(minutes) * 60000),
          hostGymId: hostGym?.id ?? null,
          scheduledAt: scheduledAt || null,
          location,
          message,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send challenge')
      router.push(`/challenges/${data.challenge.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className={labelCls}>Ruleset</label>
        <select className={inputCls + ' mt-1'} value={rulesetId} onChange={e => onRulesetChange(e.target.value)}>
          {RULESETS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <div className="mt-2 border border-smoke bg-mist p-3">
          <ul className="text-xs text-steel space-y-1 list-disc list-inside">
            {ruleset.summary.slice(0, 6).map((s, i) => <li key={i}>{s}</li>)}
          </ul>
          {ruleset.fullRulesUrl && <a href={ruleset.fullRulesUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs font-bold text-brand-red">Full rules ↗</a>}
        </div>
      </div>

      <div>
        <label className={labelCls}>Match time (minutes)</label>
        <input type="number" min="0.5" step="0.5" className={inputCls + ' mt-1 max-w-[140px]'} value={minutes} onChange={e => setMinutes(e.target.value)} required />
      </div>

      <div>
        <label className={labelCls}>Host gym (optional)</label>
        <p className="text-xs text-ash mb-1">Must be a gym that hosts challenge matches. Leave blank to settle later.</p>
        <GymPicker value={hostGym} onChange={setHostGym} onCreateNew={() => {}} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Proposed date/time</label>
          <input type="datetime-local" className={inputCls + ' mt-1'} value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Location note</label>
          <input className={inputCls + ' mt-1'} value={location} onChange={e => setLocation(e.target.value)} placeholder="Mat 1, main gym…" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Message to {opponentName} (optional)</label>
        <textarea className={inputCls + ' mt-1'} rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Friendly roll, gi, etc." />
      </div>

      <label className="flex items-start gap-2 text-xs text-steel">
        <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5" />
        <span>I understand participation is at my own risk, the host gym&apos;s own waiver governs the event, and I hold AscendIt harmless for any injury, dispute, or outcome.</span>
      </label>

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <button type="submit" disabled={saving} className="bg-brand-red text-paper font-bold text-sm tracking-wide px-6 py-3 hover:bg-red-700 transition-colors disabled:opacity-50">
        {saving ? 'Sending…' : 'Send Challenge'}
      </button>
    </form>
  )
}
