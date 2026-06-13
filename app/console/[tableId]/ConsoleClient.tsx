'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { fmtClock } from '@/lib/matchScore'
import { QRCodeUrl } from '@/app/components/QRCode'

type Side = 'a' | 'b'
type SideScore = { points: number; advantages: number; penalties: number }
type Action = { key: string; label: string; points: number }
type RulesetConfig = { name: string; actions: Action[]; advantages: boolean; penalties: boolean; fullRulesUrl: string | null }

type EventRow = { id: string; side: string | null; type: string; value: number; voided: boolean; meta: unknown; createdAt: string }

type TableState = {
  id: string; label: string; status: string; publicSlug: string
  aName: string | null; aClub: string | null; bName: string | null; bClub: string | null
  rulesetId: string | null; rulesetConfig: RulesetConfig | null
  clockStatus: string; remainingMs: number; anchorTs: number | null; periodMs: number; period: number
  winnerSide: string | null; winBy: string | null
}

type Caps = { canScore: boolean; canTime: boolean; isManager: boolean }

type Payload = { serverNow: number; caps: Caps; table: TableState; score: { a: SideScore; b: SideScore }; events: EventRow[] }

export function ConsoleClient({ tableId }: { tableId: string }) {
  const [data, setData] = useState<Payload | null>(null)
  const [err, setErr] = useState('')
  const offsetRef = useRef(0) // Date.now() - estServerNow
  const [, force] = useState(0) // tick for clock interpolation
  const [origin, setOrigin] = useState('')

  useEffect(() => { setOrigin(window.location.origin) }, [])

  const load = useCallback(async () => {
    try {
      const t0 = Date.now()
      const res = await fetch(`/api/tables/${tableId}`, { cache: 'no-store' })
      const rtt = Date.now() - t0
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setErr(j.error || `Error ${res.status}`)
        return
      }
      const j: Payload = await res.json()
      offsetRef.current = Date.now() - j.serverNow - rtt / 2
      setErr('')
      setData(j)
    } catch {
      setErr('Network error')
    }
  }, [tableId])

  // poll every 1s
  useEffect(() => {
    load()
    const id = setInterval(load, 1000)
    return () => clearInterval(id)
  }, [load])

  // interpolation tick (display only)
  useEffect(() => {
    const id = setInterval(() => force(n => n + 1), 100)
    return () => clearInterval(id)
  }, [])

  if (err && !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-brand-red font-bold">{err}</p>
        <Link href="/console" className="text-sm text-slate hover:text-ink mt-4 inline-block">← Console</Link>
      </div>
    )
  }
  if (!data) return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-slate">Loading…</div>

  const { table, score, events, caps } = data
  const rc = table.rulesetConfig
  const done = table.status === 'done'

  const estServerNow = () => Date.now() - offsetRef.current
  const displayMs = () => {
    if (table.clockStatus !== 'running' || table.anchorTs == null) return Math.max(0, table.remainingMs)
    return Math.max(0, table.remainingMs - (estServerNow() - table.anchorTs))
  }
  const remaining = displayMs()
  const running = table.clockStatus === 'running'

  // optimistic local patch + server write
  function patchTable(p: Partial<TableState>) {
    setData(d => d ? { ...d, table: { ...d.table, ...p } } : d)
  }
  async function postClock(action: string, extra: Record<string, unknown>) {
    await fetch(`/api/tables/${tableId}/clock`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    })
    load()
  }

  function toggleClock() {
    if (running) {
      const rem = displayMs()
      patchTable({ clockStatus: 'stopped', anchorTs: null, remainingMs: rem, status: 'paused' })
      postClock('stop', { remainingMs: rem })
    } else {
      const anchor = Math.round(estServerNow())
      const rem = displayMs()
      patchTable({ clockStatus: 'running', anchorTs: anchor, remainingMs: rem, status: 'live' })
      postClock('start', { anchorTs: anchor, remainingMs: rem })
    }
  }

  function adjust(deltaMs: number) {
    const rem = Math.max(0, displayMs() + deltaMs)
    if (running) {
      const anchor = Math.round(estServerNow())
      patchTable({ remainingMs: rem, anchorTs: anchor })
      postClock('adjust', { remainingMs: rem, anchorTs: anchor })
    } else {
      patchTable({ remainingMs: rem })
      postClock('adjust', { remainingMs: rem })
    }
  }

  function nextPeriod() {
    patchTable({ period: table.period + 1, clockStatus: 'stopped', anchorTs: null, remainingMs: table.periodMs })
    postClock('period', {})
  }

  async function postScore(side: Side | null, type: string, value: number) {
    await fetch(`/api/tables/${tableId}/score`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ side, type, value }),
    })
    load()
  }

  async function voidEvent(eventId: string) {
    await fetch(`/api/tables/${tableId}/score/${eventId}/void`, { method: 'POST' })
    load()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <Link href="/console" className="text-sm text-slate hover:text-ink">← Console</Link>
        <span className="text-xs font-bold uppercase tracking-widest text-steel">{table.label} · {rc?.name ?? ''}</span>
      </div>

      {/* Clock */}
      <div className="border border-smoke bg-paper p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Period {table.period}{done ? ' · Final' : ''}</p>
        <p className={`font-display font-bold tabular-nums leading-none my-2 ${running ? 'text-brand-red' : 'text-ink'}`} style={{ fontSize: '5rem' }}>
          {fmtClock(remaining)}
        </p>
        {remaining <= 0 && !done && <p className="text-brand-red font-bold tracking-widest">TIME</p>}

        {caps.canTime && !done && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <button onClick={toggleClock} className={`font-bold text-sm tracking-wide px-8 py-3 transition-colors ${running ? 'bg-ink text-paper hover:bg-steel' : 'bg-brand-red text-paper hover:bg-red-700'}`}>
              {running ? 'Stop' : 'Start'}
            </button>
            <button onClick={() => adjust(10000)} className="border border-smoke text-steel text-sm font-medium px-3 py-3 hover:border-steel hover:text-ink transition-colors">+10s</button>
            <button onClick={() => adjust(-10000)} className="border border-smoke text-steel text-sm font-medium px-3 py-3 hover:border-steel hover:text-ink transition-colors">−10s</button>
            <button onClick={nextPeriod} className="border border-smoke text-steel text-sm font-medium px-3 py-3 hover:border-steel hover:text-ink transition-colors">Next period</button>
          </div>
        )}
      </div>

      {/* Score + scoring controls */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <SideColumn side="a" name={table.aName} club={table.aClub} s={score.a} rc={rc} canScore={caps.canScore && !done} onScore={postScore} accent="brand-red" winner={table.winnerSide === 'a'} />
        <SideColumn side="b" name={table.bName} club={table.bClub} s={score.b} rc={rc} canScore={caps.canScore && !done} onScore={postScore} accent="ink" winner={table.winnerSide === 'b'} />
      </div>

      {/* Finish */}
      {caps.canScore && (
        <FinishPanel tableId={tableId} done={done} winnerSide={table.winnerSide} winBy={table.winBy}
          aName={table.aName} bName={table.bName} onFinished={load} />
      )}

      {/* Events log */}
      <div className="mt-6">
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-2">Recent events</p>
        {events.length === 0 ? (
          <p className="text-sm text-ash">No events yet.</p>
        ) : (
          <ul className="space-y-1">
            {events.slice(0, 15).map(e => (
              <li key={e.id} className={`flex items-center justify-between text-sm border border-smoke px-3 py-2 ${e.voided ? 'opacity-40 line-through' : ''}`}>
                <span className="text-steel">
                  {e.side ? `[${e.side.toUpperCase()}] ` : ''}{e.type}{e.value ? ` ${e.value > 0 ? '+' : ''}${e.value}` : ''}
                </span>
                {caps.canScore && ['points', 'advantage', 'penalty'].includes(e.type) && (
                  <button onClick={() => voidEvent(e.id)} className="text-xs text-slate hover:text-brand-red">
                    {e.voided ? 'Restore' : 'Undo'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Scoreboard share */}
      <div className="mt-8 border-t border-smoke pt-6 flex flex-col sm:flex-row items-center gap-6">
        {origin && <QRCodeUrl url={`${origin}/scoreboard/${table.publicSlug}`} size={140} caption="Scan to view scoreboard" />}
        <div className="text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Public scoreboard</p>
          <a href={`/scoreboard/${table.publicSlug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-red font-bold break-all">
            {origin}/scoreboard/{table.publicSlug} ↗
          </a>
          <p className="text-xs text-ash mt-1">No login required — open on a TV or share with spectators.</p>
        </div>
      </div>
    </div>
  )
}

function SideColumn({ side, name, club, s, rc, canScore, onScore, accent, winner }: {
  side: Side; name: string | null; club: string | null; s: SideScore; rc: RulesetConfig | null
  canScore: boolean; onScore: (side: Side, type: string, value: number) => void; accent: string; winner: boolean
}) {
  const header = accent === 'brand-red' ? 'text-brand-red' : 'text-ink'
  return (
    <div className={`border bg-paper p-4 ${winner ? 'border-brand-red border-2' : 'border-smoke'}`}>
      <p className={`text-xs font-bold uppercase tracking-widest ${header}`}>{side.toUpperCase()}{winner ? ' · WINNER' : ''}</p>
      <p className="font-display font-bold text-ink text-lg leading-tight truncate">{name}</p>
      {club && <p className="text-xs text-ash truncate">{club}</p>}

      <div className="flex items-end gap-3 my-3">
        <span className="font-display font-bold text-ink tabular-nums" style={{ fontSize: '3rem', lineHeight: 1 }}>{s.points}</span>
        <span className="text-xs text-slate pb-1">adv {s.advantages} · pen {s.penalties}</span>
      </div>

      {canScore && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1">
            {(rc?.actions ?? []).map(a => (
              <button key={a.key} onClick={() => onScore(side, 'points', a.points)}
                className="border border-smoke text-steel text-xs font-medium px-2 py-2 hover:border-steel hover:text-ink transition-colors">
                {a.label} +{a.points}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button onClick={() => onScore(side, 'points', 1)} className="border border-smoke text-steel text-xs font-medium px-2 py-2 hover:border-steel hover:text-ink">+1</button>
            {rc?.advantages && <button onClick={() => onScore(side, 'advantage', 1)} className="border border-smoke text-steel text-xs font-medium px-2 py-2 hover:border-steel hover:text-ink">Adv</button>}
            {rc?.penalties && <button onClick={() => onScore(side, 'penalty', 1)} className="border border-smoke text-steel text-xs font-medium px-2 py-2 hover:border-steel hover:text-ink">Pen</button>}
          </div>
        </div>
      )}
    </div>
  )
}

function FinishPanel({ tableId, done, winnerSide, winBy, aName, bName, onFinished }: {
  tableId: string; done: boolean; winnerSide: string | null; winBy: string | null
  aName: string | null; bName: string | null; onFinished: () => void
}) {
  const [open, setOpen] = useState(false)
  const [winner, setWinner] = useState<'a' | 'b' | 'draw'>('a')
  const [by, setBy] = useState('points')
  const [saving, setSaving] = useState(false)

  if (done) {
    const label = winnerSide ? `${winnerSide === 'a' ? aName : bName} (${winnerSide.toUpperCase()})` : 'Draw'
    return (
      <div className="mt-4 border border-ink bg-ink text-paper p-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-ash">Final result</p>
        <p className="font-display font-bold text-lg">{label}{winBy ? ` · by ${winBy}` : ''}</p>
      </div>
    )
  }

  async function finish() {
    setSaving(true)
    await fetch(`/api/tables/${tableId}/finish`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerSide: winner === 'draw' ? null : winner, winBy: winner === 'draw' ? 'draw' : by }),
    })
    setSaving(false)
    setOpen(false)
    onFinished()
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-4 w-full bg-ink text-paper font-bold text-sm tracking-wide py-3 hover:bg-steel transition-colors">
        Finish Match
      </button>
    )
  }

  const cls = 'border border-smoke text-sm font-medium px-3 py-2'
  return (
    <div className="mt-4 border border-smoke bg-mist p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-steel mb-2">Declare result</p>
      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={() => setWinner('a')} className={`${cls} ${winner === 'a' ? 'bg-brand-red text-paper border-brand-red' : 'text-steel'}`}>{aName} wins</button>
        <button onClick={() => setWinner('b')} className={`${cls} ${winner === 'b' ? 'bg-brand-red text-paper border-brand-red' : 'text-steel'}`}>{bName} wins</button>
        <button onClick={() => setWinner('draw')} className={`${cls} ${winner === 'draw' ? 'bg-ink text-paper border-ink' : 'text-steel'}`}>Draw</button>
      </div>
      {winner !== 'draw' && (
        <select value={by} onChange={e => setBy(e.target.value)} className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm mb-3">
          <option value="points">By points</option>
          <option value="submission">By submission</option>
          <option value="decision">By decision</option>
          <option value="dq">By disqualification</option>
          <option value="forfeit">By forfeit</option>
        </select>
      )}
      <div className="flex gap-2">
        <button onClick={finish} disabled={saving} className="bg-brand-red text-paper font-bold text-sm px-6 py-2 hover:bg-red-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Confirm'}
        </button>
        <button onClick={() => setOpen(false)} className="border border-smoke text-steel text-sm font-medium px-4 py-2 hover:border-steel hover:text-ink">Cancel</button>
      </div>
    </div>
  )
}
