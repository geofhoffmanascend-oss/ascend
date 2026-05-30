'use client'

import { useState } from 'react'
import { BracketView, type BracketMatch, type BracketParticipant } from '@/app/components/BracketView'
import { BELT_ORDER } from '@/lib/belt'

interface Division {
  id: string
  name: string
  beltMin: string
  beltMax: string
  weightClass: string | null
  ageGroup: string | null
  _count: { registrations: number }
  registrations: { id: string; confirmed: boolean }[]
  matches: BracketMatch[]
}

interface Tournament {
  id: string
  title: string
  description: string | null
  date: string
  format: string
  status: string
  isPublic: boolean
  gym: { name: string; slug: string } | null
  divisions: Division[]
}

interface Props {
  tournament: Tournament
  userId: string
  userBelt: string
  isMember: boolean
  userBeltOrder: number
}

export function TournamentDetailClient({ tournament: initial, userId, userBelt, isMember, userBeltOrder }: Props) {
  const [tournament, setTournament] = useState(initial)
  const [working, setWorking] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  async function register(divId: string) {
    setWorking(divId)
    setMessage('')
    const res = await fetch(`/api/tournaments/${tournament.id}/divisions/${divId}/register`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setTournament(prev => ({
        ...prev,
        divisions: prev.divisions.map(d => d.id !== divId ? d : {
          ...d,
          _count: { registrations: d._count.registrations + 1 },
          registrations: [data.registration],
        }),
      }))
      setMessage('Registered! Awaiting confirmation from the gym admin.')
    } else {
      const data = await res.json()
      setMessage(data.error ?? 'Registration failed.')
    }
    setWorking(null)
  }

  async function withdraw(divId: string) {
    setWorking(divId)
    const res = await fetch(`/api/tournaments/${tournament.id}/divisions/${divId}/register`, { method: 'DELETE' })
    if (res.ok) {
      setTournament(prev => ({
        ...prev,
        divisions: prev.divisions.map(d => d.id !== divId ? d : {
          ...d,
          _count: { registrations: Math.max(0, d._count.registrations - 1) },
          registrations: [],
        }),
      }))
    }
    setWorking(null)
  }

  const isOpen = tournament.status === 'open'
  const showBracket = tournament.status === 'in_progress' || tournament.status === 'complete'

  // Build participant map from all registrations for bracket view
  // (We don't have names here — bracket view will show user IDs; names only shown in admin view)
  const emptyParticipants: BracketParticipant[] = []

  return (
    <div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
            {tournament.status.replace('_', ' ')}
          </span>
        </div>
        <h1 className="font-display text-2xl text-ink">{tournament.title}</h1>
        <p suppressHydrationWarning className="text-sm text-ash mt-1">
          {new Date(tournament.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          {tournament.gym && ` · ${tournament.gym.name}`}
          {' · '}{tournament.format.replace('_', ' ')}
        </p>
        {tournament.description && <p className="text-sm text-ink mt-2">{tournament.description}</p>}
      </div>

      {message && <p className="text-sm text-brand-red mb-4 border border-smoke bg-mist px-3 py-2">{message}</p>}

      <div className="flex flex-col gap-6">
        {tournament.divisions.map(div => {
          const isRegistered = div.registrations.length > 0
          const registration = div.registrations[0]
          const divMinOrder = BELT_ORDER[div.beltMin] ?? 0
          const divMaxOrder = BELT_ORDER[div.beltMax] ?? 4
          const eligible = userBeltOrder >= divMinOrder && userBeltOrder <= divMaxOrder

          return (
            <div key={div.id} className="border border-smoke bg-paper p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-bold text-ink">{div.name}</p>
                  <p className="text-xs text-ash capitalize mt-0.5">
                    {div.beltMin}–{div.beltMax} belt
                    {div.weightClass && ` · ${div.weightClass}`}
                    {div.ageGroup && ` · ${div.ageGroup}`}
                    {' · '}{div._count.registrations} registered
                  </p>
                </div>
                {isMember && isOpen && (
                  isRegistered ? (
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-green-600 font-medium">
                        {registration.confirmed ? '✓ Confirmed' : '⏳ Pending confirmation'}
                      </span>
                      <button onClick={() => withdraw(div.id)} disabled={working === div.id} className="text-xs text-ash hover:text-brand-red underline">
                        Withdraw
                      </button>
                    </div>
                  ) : eligible ? (
                    <button onClick={() => register(div.id)} disabled={working === div.id} className="flex-shrink-0 px-4 py-2 bg-brand-red text-paper font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50">
                      {working === div.id ? 'Registering…' : 'Register'}
                    </button>
                  ) : (
                    <span className="text-xs text-ash italic flex-shrink-0">Belt not eligible</span>
                  )
                )}
              </div>

              {showBracket && div.matches.length > 0 && (
                <div className="border-t border-smoke pt-4 mt-3">
                  <BracketView
                    matches={div.matches}
                    participants={emptyParticipants}
                    format={tournament.format as 'single_elim' | 'round_robin' | 'double_elim'}
                    isAdmin={false}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
