'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RULESETS, getRuleset } from '@/lib/rulesets'
import { CHALLENGE_STATUS_LABELS } from '../status'

type Party = { id: string; name: string | null }
type Challenge = {
  id: string; status: string
  challenger: Party; challenged: Party
  hostGym: { id: string; name: string } | null
  rulesetName: string; rulesetId: string | null; periodMs: number | null
  scheduledAt: string | null; location: string | null; message: string | null
  lastActorId: string | null; winnerId: string | null; winBy: string | null
}
type Waiver = { id: string; title: string; body: string | null; fileUrl: string | null; version: number; signed: boolean }

const inputCls = 'w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'
const labelCls = 'text-xs font-bold uppercase tracking-widest text-steel'
const primaryBtn = 'bg-brand-red text-paper font-bold text-sm tracking-wide px-5 py-2 hover:bg-red-700 transition-colors disabled:opacity-50'
const secondaryBtn = 'border border-smoke text-steel text-sm font-medium px-4 py-2 hover:border-steel hover:text-ink transition-colors disabled:opacity-50'

export function ChallengeDetailClient({ viewerId, isHostAdmin, canRespond, canWithdraw, waiver, table, challenge }: {
  viewerId: string; isHostAdmin: boolean; canRespond: boolean; canWithdraw: boolean
  waiver: Waiver | null; table: { id: string; publicSlug: string } | null; challenge: Challenge
}) {
  const router = useRouter()
  const c = challenge
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [countering, setCountering] = useState(false)
  const [typedName, setTypedName] = useState('')

  const oppName = c.challenger.id === viewerId ? c.challenged.name : c.challenger.name
  const amParty = c.challenger.id === viewerId || c.challenged.id === viewerId

  async function act(url: string, body?: unknown, method = 'POST') {
    setBusy(true); setError('')
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Failed')
      if (url.endsWith('/table') && d.table) { window.open(`/console/${d.table.id}`, '_blank') }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const minutes = c.periodMs ? (c.periodMs / 60000) : null

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="font-display text-2xl font-bold text-ink">vs {oppName ?? 'Unknown'}</h1>
        <span className="text-xs font-bold uppercase tracking-widest text-steel border border-smoke px-2 py-1">{CHALLENGE_STATUS_LABELS[c.status] ?? c.status}</span>
      </div>

      {/* Terms */}
      <div className="border border-smoke bg-paper p-4 space-y-1.5 text-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Terms</p>
        <Row k="Competitors" v={`${c.challenger.name ?? '?'} vs ${c.challenged.name ?? '?'}`} />
        <Row k="Ruleset" v={c.rulesetName} />
        {minutes != null && <Row k="Match time" v={`${minutes} min`} />}
        <Row k="Host gym" v={c.hostGym?.name ?? '—'} />
        {c.scheduledAt && <Row k="When" v={new Date(c.scheduledAt).toLocaleString()} />}
        {c.location && <Row k="Where" v={c.location} />}
        {c.message && <Row k="Note" v={c.message} />}
      </div>

      {c.status === 'completed' && (
        <div className="mt-4 border border-ink bg-ink text-paper p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-ash">Result</p>
          <p className="font-display font-bold text-lg">
            {c.winnerId ? `${c.winnerId === c.challenger.id ? c.challenger.name : c.challenged.name} won` : 'Draw'}{c.winBy ? ` · by ${c.winBy}` : ''}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-brand-red mt-3">{error}</p>}

      {/* Negotiation */}
      {canRespond && !countering && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => act(`/api/challenges/${c.id}`, { action: 'accept' }, 'PATCH')} disabled={busy} className={primaryBtn}>Accept terms</button>
          <button onClick={() => setCountering(true)} disabled={busy} className={secondaryBtn}>Counter</button>
          <button onClick={() => act(`/api/challenges/${c.id}`, { action: 'decline' }, 'PATCH')} disabled={busy} className={secondaryBtn}>Decline</button>
        </div>
      )}
      {canWithdraw && (
        <div className="mt-4">
          <button onClick={() => act(`/api/challenges/${c.id}`, { action: 'withdraw' }, 'PATCH')} disabled={busy} className={secondaryBtn}>Withdraw offer</button>
          <p className="text-xs text-ash mt-1">Waiting on {oppName ?? 'the other competitor'} to respond.</p>
        </div>
      )}

      {countering && (
        <CounterForm
          defaults={{ rulesetId: c.rulesetId ?? RULESETS[0].id, minutes: minutes ?? 10, location: c.location ?? '', message: '' }}
          busy={busy}
          onCancel={() => setCountering(false)}
          onSubmit={(body) => { setCountering(false); act(`/api/challenges/${c.id}`, { action: 'counter', ...body }, 'PATCH') }}
        />
      )}

      {/* Waiver e-sign */}
      {amParty && c.status === 'accepted' && waiver && !waiver.signed && (
        <div className="mt-4 border border-smoke bg-mist p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Sign waiver — {waiver.title} (v{waiver.version})</p>
          {waiver.body && <div className="text-xs text-steel whitespace-pre-wrap max-h-40 overflow-y-auto border border-smoke bg-paper p-2 my-2">{waiver.body}</div>}
          {waiver.fileUrl && <a href={waiver.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-brand-red">Open waiver PDF ↗</a>}
          <div className="flex items-center gap-2 mt-2">
            <input className={inputCls + ' max-w-xs'} placeholder="Type your full legal name" value={typedName} onChange={e => setTypedName(e.target.value)} />
            <button onClick={() => act(`/api/challenges/${c.id}/sign`, { typedName })} disabled={busy || !typedName.trim()} className={primaryBtn}>Sign</button>
          </div>
        </div>
      )}
      {amParty && c.status === 'accepted' && waiver && waiver.signed && (
        <p className="mt-4 text-sm text-steel">You&apos;ve signed the waiver. Waiting for {oppName ?? 'the other competitor'} to sign.</p>
      )}
      {amParty && c.status === 'accepted' && !waiver && (
        <p className="mt-4 text-sm text-steel">Terms accepted. Waiting for the host gym to approve.</p>
      )}

      {/* Host gym approval */}
      {isHostAdmin && c.status === 'gym_pending' && (
        <div className="mt-4 border border-smoke bg-paper p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-2">Host gym approval</p>
          <p className="text-sm text-slate mb-3">Both competitors have signed. Approve to schedule this challenge.</p>
          <button onClick={() => act(`/api/challenges/${c.id}/approve`, {})} disabled={busy} className={primaryBtn}>Approve & schedule</button>
        </div>
      )}

      {/* Run on console */}
      {c.status === 'scheduled' && (
        <div className="mt-4 border border-smoke bg-paper p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-2">Live console</p>
          {table ? (
            <div className="flex flex-wrap gap-3">
              {isHostAdmin && <a href={`/console/${table.id}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-brand-red">Open console ↗</a>}
              <a href={`/scoreboard/${table.publicSlug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-steel hover:text-ink">Scoreboard ↗</a>
            </div>
          ) : isHostAdmin ? (
            <button onClick={() => act(`/api/challenges/${c.id}/table`, {})} disabled={busy} className={primaryBtn}>Start match on console</button>
          ) : (
            <p className="text-sm text-slate">Waiting for the host gym to start the match.</p>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return <p><span className="text-ash">{k}:</span> <span className="text-ink">{v}</span></p>
}

function CounterForm({ defaults, busy, onCancel, onSubmit }: {
  defaults: { rulesetId: string; minutes: number; location: string; message: string }
  busy: boolean
  onCancel: () => void
  onSubmit: (body: { rulesetId: string; periodMs: number; scheduledAt: string | null; location: string; message: string }) => void
}) {
  const [rulesetId, setRulesetId] = useState(defaults.rulesetId)
  const [minutes, setMinutes] = useState(String(defaults.minutes))
  const [scheduledAt, setScheduledAt] = useState('')
  const [location, setLocation] = useState(defaults.location)
  const [message, setMessage] = useState('')

  return (
    <div className="mt-4 border border-smoke bg-mist p-4 space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-steel">Counter-offer</p>
      <div>
        <label className={labelCls}>Ruleset</label>
        <select className={inputCls + ' mt-1'} value={rulesetId} onChange={e => { setRulesetId(e.target.value); const r = getRuleset(e.target.value); if (r) setMinutes(String(r.periodMs / 60000)) }}>
          {RULESETS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Minutes</label>
          <input type="number" min="0.5" step="0.5" className={inputCls + ' mt-1'} value={minutes} onChange={e => setMinutes(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Date/time</label>
          <input type="datetime-local" className={inputCls + ' mt-1'} value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Location</label>
        <input className={inputCls + ' mt-1'} value={location} onChange={e => setLocation(e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Note</label>
        <input className={inputCls + ' mt-1'} value={message} onChange={e => setMessage(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSubmit({ rulesetId, periodMs: Math.round(parseFloat(minutes) * 60000), scheduledAt: scheduledAt || null, location, message })}
          disabled={busy}
          className={primaryBtn}
        >Send counter</button>
        <button onClick={onCancel} disabled={busy} className={secondaryBtn}>Cancel</button>
      </div>
    </div>
  )
}
