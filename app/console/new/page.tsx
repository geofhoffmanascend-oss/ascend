'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RULESETS, getRuleset } from '@/lib/rulesets'

export default function NewMatchPage() {
  const router = useRouter()
  const [label, setLabel] = useState('Table 1')
  const [aName, setAName] = useState('')
  const [aClub, setAClub] = useState('')
  const [bName, setBName] = useState('')
  const [bClub, setBClub] = useState('')
  const [rulesetId, setRulesetId] = useState(RULESETS[0].id)
  const [minutes, setMinutes] = useState(String(RULESETS[0].periodMs / 60000))
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
    setSaving(true)
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label, aName, aClub, bName, bClub, rulesetId,
          periodMs: Math.round(parseFloat(minutes) * 60000),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create match')
      router.push(`/console/${data.table.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
      setSaving(false)
    }
  }

  const labelCls = 'text-xs font-bold uppercase tracking-widest text-steel'
  const inputCls = 'w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/console" className="text-sm text-slate hover:text-ink">← Console</Link>
      <h1 className="font-display text-2xl font-bold text-ink mt-3 mb-6">New Match</h1>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className={labelCls}>Table / Mat label</label>
          <input className={inputCls + ' mt-1'} value={label} onChange={e => setLabel(e.target.value)} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-smoke p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red mb-2">Competitor A</p>
            <input className={inputCls} placeholder="Name" value={aName} onChange={e => setAName(e.target.value)} required />
            <input className={inputCls + ' mt-2'} placeholder="Club (optional)" value={aClub} onChange={e => setAClub(e.target.value)} />
          </div>
          <div className="border border-smoke p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-ink mb-2">Competitor B</p>
            <input className={inputCls} placeholder="Name" value={bName} onChange={e => setBName(e.target.value)} required />
            <input className={inputCls + ' mt-2'} placeholder="Club (optional)" value={bClub} onChange={e => setBClub(e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Ruleset</label>
          <select className={inputCls + ' mt-1'} value={rulesetId} onChange={e => onRulesetChange(e.target.value)}>
            {RULESETS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <div className="mt-3 border border-smoke bg-mist p-3">
            <ul className="text-xs text-steel space-y-1 list-disc list-inside">
              {ruleset.summary.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
            {ruleset.fullRulesUrl && (
              <a href={ruleset.fullRulesUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs font-bold text-brand-red">
                Full rules ↗
              </a>
            )}
          </div>
        </div>

        <div>
          <label className={labelCls}>Match time (minutes)</label>
          <input type="number" min="0.5" step="0.5" className={inputCls + ' mt-1 max-w-[140px]'} value={minutes} onChange={e => setMinutes(e.target.value)} required />
        </div>

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-brand-red text-paper font-bold text-sm tracking-wide px-6 py-3 hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create Match'}
        </button>
      </form>
    </div>
  )
}
