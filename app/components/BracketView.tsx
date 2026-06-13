'use client'

import { useState } from 'react'

export interface BracketMatch {
  id: string
  round: number
  position: number
  participantA: string | null
  participantB: string | null
  result: string
  notes: string | null
}

export interface BracketParticipant {
  id: string
  name: string | null
  belt: string
}

export type TableLink = { id: string; publicSlug: string; status: string }

interface Props {
  matches: BracketMatch[]
  participants: BracketParticipant[]
  format: 'single_elim' | 'round_robin' | 'double_elim'
  isAdmin?: boolean
  onResultSave?: (matchId: string, result: string, notes: string) => Promise<void>
  tableByMatch?: Record<string, TableLink>
  onSendToTable?: (matchId: string) => Promise<void>
}

const RESULT_LABELS: Record<string, string> = {
  pending: 'Pending',
  participant_a_wins: 'Top wins',
  participant_b_wins: 'Bottom wins',
  draw: 'Draw',
  bye: 'Bye',
}

export function BracketView({ matches, participants, format, isAdmin = false, onResultSave, tableByMatch, onSendToTable }: Props) {
  const nameMap = Object.fromEntries(participants.map(p => [p.id, p.name ?? 'Unknown']))
  const shared = { nameMap, isAdmin, onResultSave, tableByMatch, onSendToTable }

  if (format === 'round_robin') {
    return <RoundRobinView matches={matches} {...shared} />
  }

  return <SingleElimView matches={matches} {...shared} />
}

type ViewProps = {
  matches: BracketMatch[]
  nameMap: Record<string, string>
  isAdmin: boolean
  onResultSave?: Props['onResultSave']
  tableByMatch?: Record<string, TableLink>
  onSendToTable?: Props['onSendToTable']
}

function SingleElimView({ matches, nameMap, isAdmin, onResultSave, tableByMatch, onSendToTable }: ViewProps) {
  const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b)

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 min-w-max pb-4">
        {rounds.map(round => {
          const roundMatches = matches.filter(m => m.round === round).sort((a, b) => a.position - b.position)
          const isFinal = round === Math.max(...rounds)
          return (
            <div key={round} className="flex flex-col gap-4 justify-around">
              <p className="text-xs font-bold uppercase tracking-widest text-steel text-center mb-1">
                {isFinal ? 'Final' : round === Math.max(...rounds) - 1 ? 'Semi' : `Round ${round}`}
              </p>
              {roundMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  nameMap={nameMap}
                  isAdmin={isAdmin}
                  onResultSave={onResultSave}
                  table={tableByMatch?.[match.id]}
                  onSendToTable={onSendToTable}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MatchCard({ match, nameMap, isAdmin, onResultSave, table, onSendToTable }: {
  match: BracketMatch
  nameMap: Record<string, string>
  isAdmin: boolean
  onResultSave?: Props['onResultSave']
  table?: TableLink
  onSendToTable?: Props['onSendToTable']
}) {
  const [editing, setEditing] = useState(false)
  const [result, setResult] = useState(match.result)
  const [notes, setNotes] = useState(match.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  const nameA = match.participantA ? nameMap[match.participantA] ?? 'TBD' : 'BYE'
  const nameB = match.participantB ? nameMap[match.participantB] ?? 'TBD' : 'BYE'

  const winnerA = match.result === 'participant_a_wins' || match.result === 'bye'
  const winnerB = match.result === 'participant_b_wins'
  const hasBoth = !!match.participantA && !!match.participantB

  async function save() {
    if (!onResultSave || result === 'pending') return
    setSaving(true)
    await onResultSave(match.id, result, notes)
    setEditing(false)
    setSaving(false)
  }

  async function send() {
    if (!onSendToTable) return
    setSending(true)
    await onSendToTable(match.id)
    setSending(false)
  }

  return (
    <div className="border border-smoke bg-paper w-48">
      <div className={`px-3 py-2 border-b border-smoke text-sm ${winnerA ? 'font-bold text-ink' : 'text-ash'}`}>
        {nameA}
      </div>
      <div className={`px-3 py-2 text-sm ${winnerB ? 'font-bold text-ink' : 'text-ash'}`}>
        {nameB}
      </div>
      {match.result !== 'pending' && !editing && (
        <div className="px-3 py-1 border-t border-smoke bg-mist">
          <p className="text-xs text-ash">{RESULT_LABELS[match.result]}</p>
        </div>
      )}
      {isAdmin && !editing && match.result === 'pending' && match.participantA && match.participantB && (
        <div className="px-3 py-1 border-t border-smoke">
          <button onClick={() => setEditing(true)} className="text-xs text-brand-red hover:underline">Enter result</button>
        </div>
      )}
      {isAdmin && !editing && match.result !== 'pending' && (
        <div className="px-3 py-1 border-t border-smoke">
          <button onClick={() => setEditing(true)} className="text-xs text-ash hover:text-ink">Edit</button>
        </div>
      )}
      {/* Phase 58 M2 — live match console */}
      {isAdmin && !editing && hasBoth && (table || (onSendToTable && match.result === 'pending')) && (
        <div className="px-3 py-1 border-t border-smoke flex flex-wrap items-center gap-x-3 gap-y-1">
          {table ? (
            <>
              <a href={`/console/${table.id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-red hover:underline">Console ↗</a>
              <a href={`/scoreboard/${table.publicSlug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-ash hover:text-ink">Scoreboard ↗</a>
            </>
          ) : (
            <button onClick={send} disabled={sending} className="text-xs text-steel hover:text-ink disabled:opacity-50">
              {sending ? '…' : 'Run on console'}
            </button>
          )}
        </div>
      )}
      {isAdmin && editing && (
        <div className="px-3 py-2 border-t border-smoke flex flex-col gap-2">
          <select value={result} onChange={e => setResult(e.target.value)} className="text-xs border border-smoke bg-paper px-1 py-0.5 w-full">
            <option value="pending" disabled>Select result…</option>
            <option value="participant_a_wins">{nameA} wins</option>
            <option value="participant_b_wins">{nameB} wins</option>
            <option value="draw">Draw</option>
          </select>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="text-xs border border-smoke bg-paper px-1 py-0.5 w-full"
          />
          <div className="flex gap-1">
            <button onClick={save} disabled={saving || result === 'pending'} className="text-xs px-2 py-0.5 bg-brand-red text-paper hover:bg-red-700 disabled:opacity-50">
              {saving ? '…' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} className="text-xs text-ash hover:text-ink">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

function RoundRobinView({ matches, nameMap, isAdmin, onResultSave, tableByMatch, onSendToTable }: ViewProps) {
  const participants = [...new Set(matches.flatMap(m => [m.participantA, m.participantB]).filter(Boolean) as string[])]

  // Compute standings
  const stats: Record<string, { wins: number; losses: number; draws: number }> = {}
  for (const p of participants) stats[p] = { wins: 0, losses: 0, draws: 0 }
  for (const m of matches) {
    if (!m.participantA || !m.participantB) continue
    if (m.result === 'participant_a_wins') { stats[m.participantA].wins++; stats[m.participantB].losses++ }
    else if (m.result === 'participant_b_wins') { stats[m.participantB].wins++; stats[m.participantA].losses++ }
    else if (m.result === 'draw') { stats[m.participantA].draws++; stats[m.participantB].draws++ }
  }
  const standings = participants
    .map(id => ({ id, ...stats[id], points: stats[id].wins * 2 + stats[id].draws }))
    .sort((a, b) => b.points - a.points)

  return (
    <div className="flex flex-col gap-8">
      {/* Standings */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Standings</p>
        <table className="text-sm w-full max-w-md">
          <thead>
            <tr className="border-b border-smoke">
              <th className="text-left py-1.5 text-xs text-ash font-medium">Athlete</th>
              <th className="text-center py-1.5 text-xs text-ash font-medium">W</th>
              <th className="text-center py-1.5 text-xs text-ash font-medium">L</th>
              <th className="text-center py-1.5 text-xs text-ash font-medium">D</th>
              <th className="text-center py-1.5 text-xs text-ash font-medium">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-smoke">
            {standings.map((s, i) => (
              <tr key={s.id}>
                <td className="py-1.5 text-ink">{i + 1}. {nameMap[s.id] ?? 'Unknown'}</td>
                <td className="text-center py-1.5 text-ink">{s.wins}</td>
                <td className="text-center py-1.5 text-ash">{s.losses}</td>
                <td className="text-center py-1.5 text-ash">{s.draws}</td>
                <td className="text-center py-1.5 font-bold text-ink">{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Match list */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Matches</p>
        <div className="flex flex-col gap-2 max-w-md">
          {matches.map(match => (
            <MatchCard key={match.id} match={match} nameMap={nameMap} isAdmin={isAdmin} onResultSave={onResultSave} table={tableByMatch?.[match.id]} onSendToTable={onSendToTable} />
          ))}
        </div>
      </div>
    </div>
  )
}
