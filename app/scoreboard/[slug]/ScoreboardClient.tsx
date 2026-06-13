'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fmtClock } from '@/lib/matchScore'

type SideScore = { points: number; advantages: number; penalties: number }
type Board = {
  serverNow: number; label: string; status: string
  aName: string | null; aClub: string | null; bName: string | null; bClub: string | null
  clockStatus: string; remainingMs: number; anchorTs: number | null; period: number
  winnerSide: string | null; winBy: string | null
  score: { a: SideScore; b: SideScore }
}

export function ScoreboardClient({ slug }: { slug: string }) {
  const [b, setB] = useState<Board | null>(null)
  const [missing, setMissing] = useState(false)
  const offsetRef = useRef(0)
  const [, force] = useState(0)

  const load = useCallback(async () => {
    try {
      const t0 = Date.now()
      const res = await fetch(`/api/scoreboard/${slug}`, { cache: 'no-store' })
      const rtt = Date.now() - t0
      if (res.status === 404) { setMissing(true); return }
      if (!res.ok) return
      const j: Board = await res.json()
      offsetRef.current = Date.now() - j.serverNow - rtt / 2
      setB(j)
    } catch { /* keep last known */ }
  }, [slug])

  useEffect(() => { load(); const id = setInterval(load, 1000); return () => clearInterval(id) }, [load])
  useEffect(() => { const id = setInterval(() => force(n => n + 1), 100); return () => clearInterval(id) }, [])

  if (missing) return <div className="min-h-screen bg-ink flex items-center justify-center text-ash">Scoreboard not found</div>
  if (!b) return <div className="min-h-screen bg-ink flex items-center justify-center text-ash">Loading…</div>

  const remaining = b.clockStatus === 'running' && b.anchorTs != null
    ? Math.max(0, b.remainingMs - (Date.now() - offsetRef.current - b.anchorTs))
    : Math.max(0, b.remainingMs)

  const done = b.status === 'done'
  const running = b.clockStatus === 'running'

  return (
    <div className="min-h-screen bg-ink text-paper flex flex-col">
      <FullscreenButton />
      {/* Header */}
      <div className="text-center py-[2vh]">
        <p className="uppercase tracking-[0.3em] text-ash" style={{ fontSize: '2vh' }}>{b.label}</p>
      </div>

      {/* Competitors + scores */}
      <div className="flex-1 grid grid-cols-2">
        <SidePanel name={b.aName} club={b.aClub} s={b.score.a} accent="#CC0000" winner={done && b.winnerSide === 'a'} />
        <SidePanel name={b.bName} club={b.bClub} s={b.score.b} accent="#FAFAFA" textDark winner={done && b.winnerSide === 'b'} />
      </div>

      {/* Clock */}
      <div className="text-center py-[3vh] bg-ink-soft">
        {done ? (
          <p className="font-display font-bold" style={{ fontSize: '9vh', color: '#CC0000' }}>
            {b.winnerSide ? `${b.winnerSide === 'a' ? b.aName : b.bName} WINS` : 'DRAW'}
          </p>
        ) : (
          <p className="font-display font-bold tabular-nums leading-none" style={{ fontSize: '16vh', color: running ? '#CC0000' : '#FAFAFA' }}>
            {fmtClock(remaining)}
          </p>
        )}
        <p className="uppercase tracking-[0.3em] text-ash mt-[1vh]" style={{ fontSize: '2vh' }}>
          {done ? (b.winBy ? `by ${b.winBy}` : 'Final') : `Period ${b.period}`}{!done && remaining <= 0 ? ' · TIME' : ''}
        </p>
      </div>
    </div>
  )
}

function FullscreenButton() {
  const [fs, setFs] = useState(false)
  useEffect(() => {
    const h = () => setFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])
  function toggle() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else document.documentElement.requestFullscreen().catch(() => {})
  }
  return (
    <button
      onClick={toggle}
      title={fs ? 'Exit full screen' : 'Full screen'}
      aria-label="Toggle full screen"
      className="fixed top-3 right-3 z-10 leading-none text-paper/30 hover:text-paper transition-colors"
      style={{ fontSize: '3.2vh' }}
    >
      {fs ? '✕' : '⛶'}
    </button>
  )
}

function SidePanel({ name, club, s, accent, textDark, winner }: {
  name: string | null; club: string | null; s: SideScore; accent: string; textDark?: boolean; winner?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center px-[2vw] py-[2vh]" style={{ background: accent, color: textDark ? '#0A0A0A' : '#FAFAFA' }}>
      <p className="font-display font-bold text-center leading-tight" style={{ fontSize: '4.5vh' }}>{name}</p>
      {club && <p className="opacity-70 text-center" style={{ fontSize: '2vh' }}>{club}</p>}
      {winner && <p className="uppercase tracking-widest font-bold mt-[1vh]" style={{ fontSize: '2vh' }}>Winner</p>}
      <p className="font-display font-bold tabular-nums leading-none my-[1vh]" style={{ fontSize: '22vh' }}>{s.points}</p>
      <p className="opacity-80" style={{ fontSize: '2.5vh' }}>ADV {s.advantages} · PEN {s.penalties}</p>
    </div>
  )
}
