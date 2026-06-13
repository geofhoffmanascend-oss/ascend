'use client'

import { useState } from 'react'
import { BracketView, type BracketMatch, type BracketParticipant } from '@/app/components/BracketView'

type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'coral' | 'red'
const BELTS: Belt[] = ['white', 'blue', 'purple', 'brown', 'black']

interface Registration {
  id: string
  userId: string
  confirmed: boolean
  seed: number | null
  createdAt: string
  user: { id: string; name: string | null; belt: string; stripes: number }
}

interface Match {
  id: string
  round: number
  position: number
  participantA: string | null
  participantB: string | null
  result: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface Division {
  id: string
  name: string
  beltMin: string
  beltMax: string
  weightClass: string | null
  ageGroup: string | null
  createdAt: string
  registrations: Registration[]
  matches: Match[]
}

interface Tournament {
  id: string
  title: string
  description: string | null
  date: string
  format: string
  status: string
  isPublic: boolean
  divisions: Division[]
}

type TableLink = { id: string; publicSlug: string; status: string }
type TableByMatch = Record<string, TableLink>

const STATUS_ORDER = ['draft', 'open', 'in_progress', 'complete']
const STATUS_LABELS: Record<string, string> = { draft: 'Draft', open: 'Open', in_progress: 'In Progress', complete: 'Complete' }

const inputCls = 'w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'
const labelCls = 'text-xs font-bold uppercase tracking-widest text-steel'
const primaryBtn = 'px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50'
const secondaryBtn = 'px-4 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors disabled:opacity-50'

export function TournamentManageClient({ tournament: initial, tableByMatch: initialTables = {} }: { tournament: Tournament; tableByMatch?: TableByMatch }) {
  const [tournament, setTournament] = useState(initial)
  const [tableByMatch, setTableByMatch] = useState<TableByMatch>(initialTables)
  const [tab, setTab] = useState<'setup' | 'registrations' | 'brackets'>('setup')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Division form
  const [showDivForm, setShowDivForm] = useState(false)
  const [divName, setDivName] = useState('')
  const [divBeltMin, setDivBeltMin] = useState<Belt>('white')
  const [divBeltMax, setDivBeltMax] = useState<Belt>('black')
  const [divWeight, setDivWeight] = useState('')
  const [divAge, setDivAge] = useState('')

  async function updateStatus(status: string) {
    setSaving(true)
    const res = await fetch(`/api/admin/tournaments/${tournament.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const data = await res.json()
      setTournament(prev => ({ ...prev, status: data.tournament.status }))
    }
    setSaving(false)
  }

  async function addDivision(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/admin/tournaments/${tournament.id}/divisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: divName, beltMin: divBeltMin, beltMax: divBeltMax, weightClass: divWeight, ageGroup: divAge }),
    })
    if (res.ok) {
      const data = await res.json()
      setTournament(prev => ({ ...prev, divisions: [...prev.divisions, { ...data.division, registrations: [], matches: [] }] }))
      setShowDivForm(false)
      setDivName(''); setDivWeight(''); setDivAge('')
    }
    setSaving(false)
  }

  async function removeDivision(divId: string) {
    await fetch(`/api/admin/tournaments/${tournament.id}/divisions/${divId}`, { method: 'DELETE' })
    setTournament(prev => ({ ...prev, divisions: prev.divisions.filter(d => d.id !== divId) }))
  }

  async function toggleConfirm(regId: string, divId: string, confirmed: boolean) {
    await fetch(`/api/admin/tournaments/${tournament.id}/registrations/${regId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmed }),
    })
    setTournament(prev => ({
      ...prev,
      divisions: prev.divisions.map(d => d.id !== divId ? d : {
        ...d,
        registrations: d.registrations.map(r => r.id === regId ? { ...r, confirmed } : r),
      }),
    }))
  }

  async function seedDivision(divId: string) {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/tournaments/${tournament.id}/divisions/${divId}/seed`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setTournament(prev => ({
        ...prev,
        divisions: prev.divisions.map(d => d.id !== divId ? d : { ...d, matches: data.matches }),
      }))
    } else {
      const data = await res.json()
      setError(data.error ?? 'Seeding failed.')
    }
    setSaving(false)
  }

  async function refreshBracket() {
    const fresh = await fetch(`/api/admin/tournaments/${tournament.id}`)
    if (fresh.ok) {
      const freshData = await fresh.json()
      setTournament(prev => ({
        ...prev,
        status: freshData.tournament.status,
        divisions: freshData.tournament.divisions,
      }))
      if (freshData.tableByMatch) setTableByMatch(freshData.tableByMatch)
    }
  }

  async function saveMatchResult(matchId: string, result: string, notes: string) {
    const res = await fetch(`/api/admin/tournaments/${tournament.id}/matches/${matchId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result, notes }),
    })
    if (res.ok) await refreshBracket()
  }

  // Phase 58 M2 — send a bracket match to a live match-console table.
  async function sendToTable(matchId: string) {
    setError('')
    const res = await fetch(`/api/admin/tournaments/${tournament.id}/matches/${matchId}/table`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setTableByMatch(prev => ({ ...prev, [matchId]: { id: data.table.id, publicSlug: data.table.publicSlug, status: 'idle' } }))
      window.open(`/console/${data.table.id}`, '_blank')
    } else {
      setError(data.error ?? 'Could not create table.')
    }
  }

  const currentStatusIdx = STATUS_ORDER.indexOf(tournament.status)
  const nextStatus = STATUS_ORDER[currentStatusIdx + 1]

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-2">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Tournament</span>
          </div>
          <h1 className="font-display text-2xl text-ink">{tournament.title}</h1>
          <p suppressHydrationWarning className="text-sm text-ash mt-1">
            {new Date(tournament.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            {' · '}{tournament.format.replace('_', ' ')}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs font-bold uppercase tracking-wide text-steel border border-smoke px-2 py-1">
            {STATUS_LABELS[tournament.status]}
          </span>
          {nextStatus && (
            <button onClick={() => updateStatus(nextStatus)} disabled={saving} className={primaryBtn}>
              → {STATUS_LABELS[nextStatus]}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-smoke mb-6">
        {(['setup', 'registrations', 'brackets'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors capitalize ${
              tab === t ? 'border-brand-red text-ink' : 'border-transparent text-ash hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-brand-red mb-4">{error}</p>}

      {/* Setup tab */}
      {tab === 'setup' && (
        <div className="flex flex-col gap-6">
          <div className="border border-smoke bg-paper p-6">
            <p className={`${labelCls} mb-4`}>Divisions</p>
            <div className="flex flex-col gap-2 mb-4">
              {tournament.divisions.map(div => (
                <div key={div.id} className="flex items-center justify-between gap-3 border border-smoke p-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{div.name}</p>
                    <p className="text-xs text-ash capitalize">
                      {div.beltMin}–{div.beltMax} belt
                      {div.weightClass && ` · ${div.weightClass}`}
                      {div.ageGroup && ` · ${div.ageGroup}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ash">
                    <span>{div.registrations.length} registered</span>
                    {tournament.status === 'draft' && (
                      <button onClick={() => removeDivision(div.id)} className="text-ash hover:text-brand-red transition-colors">✕</button>
                    )}
                  </div>
                </div>
              ))}
              {tournament.divisions.length === 0 && <p className="text-sm text-ash italic">No divisions yet.</p>}
            </div>

            {tournament.status === 'draft' && !showDivForm && (
              <button onClick={() => setShowDivForm(true)} className={secondaryBtn}>+ Add Division</button>
            )}

            {showDivForm && (
              <form onSubmit={addDivision} className="border border-smoke p-4 flex flex-col gap-3 mt-2">
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Division Name *</label>
                  <input value={divName} onChange={e => setDivName(e.target.value)} className={inputCls} placeholder="Adult Male Blue/Purple · Light" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Belt Min</label>
                    <select value={divBeltMin} onChange={e => setDivBeltMin(e.target.value as Belt)} className={inputCls}>
                      {BELTS.map(b => <option key={b} value={b} className="capitalize">{b}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Belt Max</label>
                    <select value={divBeltMax} onChange={e => setDivBeltMax(e.target.value as Belt)} className={inputCls}>
                      {BELTS.map(b => <option key={b} value={b} className="capitalize">{b}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Weight Class</label>
                    <input value={divWeight} onChange={e => setDivWeight(e.target.value)} className={inputCls} placeholder="Under 170 lbs" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Age Group</label>
                    <input value={divAge} onChange={e => setDivAge(e.target.value)} className={inputCls} placeholder="Adult" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className={primaryBtn}>Add</button>
                  <button type="button" onClick={() => setShowDivForm(false)} className={secondaryBtn}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Registrations tab */}
      {tab === 'registrations' && (
        <div className="flex flex-col gap-6">
          {tournament.divisions.map(div => (
            <div key={div.id} className="border border-smoke bg-paper p-6">
              <div className="flex items-center justify-between mb-4">
                <p className={labelCls}>{div.name}</p>
                {div.registrations.filter(r => r.confirmed).length >= 2 && tournament.status === 'in_progress' && div.matches.length === 0 && (
                  <button onClick={() => seedDivision(div.id)} disabled={saving} className={primaryBtn}>
                    Generate Brackets
                  </button>
                )}
              </div>
              {div.registrations.length === 0 ? (
                <p className="text-sm text-ash italic">No registrations yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {div.registrations.map(reg => (
                    <div key={reg.id} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-ink">{reg.user.name ?? '(no name)'}</p>
                        <p className="text-xs text-ash capitalize">{reg.user.belt} belt · {reg.user.stripes} stripe{reg.user.stripes !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {reg.confirmed
                          ? <span className="text-xs text-green-600 font-medium">✓ Confirmed</span>
                          : <span className="text-xs text-ash italic">Pending</span>
                        }
                        <button
                          onClick={() => toggleConfirm(reg.id, div.id, !reg.confirmed)}
                          className="text-xs text-ash hover:text-ink underline"
                        >
                          {reg.confirmed ? 'Unconfirm' : 'Confirm'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {tournament.divisions.length === 0 && <p className="text-sm text-ash italic">No divisions — add them in Setup first.</p>}
        </div>
      )}

      {/* Brackets tab */}
      {tab === 'brackets' && (
        <div className="flex flex-col gap-8">
          {tournament.divisions.map(div => {
            const participants: BracketParticipant[] = div.registrations.map(r => ({
              id: r.user.id,
              name: r.user.name,
              belt: r.user.belt,
            }))

            return (
              <div key={div.id}>
                <p className={`${labelCls} mb-4`}>{div.name}</p>
                {div.matches.length === 0 ? (
                  <p className="text-sm text-ash italic">
                    Brackets not generated yet. Confirm participants in the Registrations tab, then use Generate Brackets.
                  </p>
                ) : (
                  <BracketView
                    matches={div.matches as BracketMatch[]}
                    participants={participants}
                    format={tournament.format as 'single_elim' | 'round_robin' | 'double_elim'}
                    isAdmin
                    onResultSave={saveMatchResult}
                    tableByMatch={tableByMatch}
                    onSendToTable={sendToTable}
                  />
                )}
              </div>
            )
          })}
          {tournament.divisions.length === 0 && <p className="text-sm text-ash italic">No divisions yet.</p>}
        </div>
      )}
    </div>
  )
}
