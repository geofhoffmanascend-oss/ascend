'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

const RATINGS = [
  { key: 'ratingOverall', label: 'Overall experience' },
  { key: 'ratingDisplay', label: 'How things look / are displayed' },
  { key: 'ratingNavigation', label: 'Ease of navigation' },
  { key: 'ratingPerformance', label: 'Speed / performance' },
] as const

const PILL_LABELS = ['Poor', 'Fair', 'OK', 'Good', 'Great']
const POS_KEY = 'feedbackBtnPos'
const MOVE_THRESHOLD = 6 // px — below this a pointer-up counts as a tap (opens), not a drag

type Ratings = Record<(typeof RATINGS)[number]['key'], number | null>

export function FeedbackButton() {
  const { status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  // Drag state
  const dragging = useRef(false)
  const moved = useRef(false)
  const start = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Restore saved position (clamped to viewport).
  useEffect(() => {
    if (!mounted) return
    try {
      const raw = localStorage.getItem(POS_KEY)
      if (raw) {
        const p = JSON.parse(raw)
        if (typeof p.x === 'number' && typeof p.y === 'number') setPos(clampToViewport(p.x, p.y))
      }
    } catch { /* ignore */ }
  }, [mounted])

  function clampToViewport(x: number, y: number) {
    const w = 132, h = 44, pad = 8
    const maxX = (typeof window !== 'undefined' ? window.innerWidth : 360) - w - pad
    const maxY = (typeof window !== 'undefined' ? window.innerHeight : 640) - h - pad
    return { x: Math.max(pad, Math.min(x, maxX)), y: Math.max(pad, Math.min(y, maxY)) }
  }

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true
    moved.current = false
    const rect = btnRef.current!.getBoundingClientRect()
    start.current = { x: e.clientX, y: e.clientY, px: rect.left, py: rect.top }
    btnRef.current?.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) moved.current = true
    if (moved.current) setPos(clampToViewport(start.current.px + dx, start.current.py + dy))
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!dragging.current) return
    dragging.current = false
    btnRef.current?.releasePointerCapture(e.pointerId)
    if (moved.current) {
      if (pos) localStorage.setItem(POS_KEY, JSON.stringify(pos))
    } else {
      setOpen(true) // a tap
    }
  }

  if (!mounted || status !== 'authenticated') return null

  return (
    <>
      <button
        ref={btnRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        // When dragged (pos set) position is fully controlled by left/top; otherwise the default
        // position classes apply (raised bottom-right). Never mix top with a bottom class.
        style={pos ? { left: pos.x, top: pos.y } : { marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        className={`fixed z-[2147482000] flex items-center gap-1.5 bg-ink text-paper text-sm font-bold px-3 py-2.5 rounded-full shadow-lg touch-none select-none hover:bg-ink-soft transition-colors ${pos ? '' : 'right-4 bottom-24 sm:bottom-6'}`}
        aria-label="Give feedback"
      >
        <span aria-hidden>💬</span>
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  )
}

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [ratings, setRatings] = useState<Ratings>({ ratingOverall: null, ratingDisplay: null, ratingNavigation: null, ratingPerformance: null })
  const [changeRequest, setChangeRequest] = useState('')
  const [missingFeatures, setMissingFeatures] = useState('')
  const [improvement, setImprovement] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit() {
    setSending(true)
    try {
      await fetch('/api/app-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ratings, changeRequest, missingFeatures, improvement }),
      })
      setSent(true)
    } catch { /* ignore */ }
    setSending(false)
  }

  function resetForm() {
    setRatings({ ratingOverall: null, ratingDisplay: null, ratingNavigation: null, ratingPerformance: null })
    setChangeRequest(''); setMissingFeatures(''); setImprovement(''); setSent(false)
  }

  return (
    <div className="fixed inset-0 z-[2147483000] bg-ink/70 flex items-center justify-center px-4 py-8 overflow-auto">
      <div className="w-full max-w-md bg-paper border border-smoke p-6">
        {sent ? (
          <div className="text-center flex flex-col gap-4">
            <h2 className="font-display text-xl text-ink">Thank you! 🙏</h2>
            <p className="text-sm text-slate">Your feedback helps us make AscendIt better.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={resetForm} className="border border-smoke text-steel text-sm font-medium px-4 py-2">Send more</button>
              <button onClick={onClose} className="bg-brand-red text-paper font-bold text-sm px-4 py-2">Done</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block bg-brand-red px-3 py-1 font-display text-xs font-bold tracking-widest uppercase text-paper mb-2">Feedback</span>
                <h2 className="font-display text-xl text-ink">How’s it going?</h2>
                <p className="text-xs text-slate mt-1">All optional — share whatever’s useful.</p>
              </div>
              <button onClick={onClose} className="text-ash hover:text-ink text-xl leading-none">×</button>
            </div>

            {RATINGS.map(({ key, label }) => (
              <div key={key}>
                <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1.5">{label}</p>
                <div className="flex gap-1.5">
                  {PILL_LABELS.map((pl, i) => {
                    const value = i + 1
                    const active = ratings[key] === value
                    return (
                      <button
                        key={value}
                        onClick={() => setRatings(r => ({ ...r, [key]: active ? null : value }))}
                        className={`flex-1 text-[11px] py-1.5 border transition-colors ${active ? 'bg-brand-red text-paper border-brand-red' : 'border-smoke text-steel hover:border-steel'}`}
                      >
                        {pl}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <Field label="Is there anything you would change?" value={changeRequest} onChange={setChangeRequest} />
            <Field label="Any features you expected but don’t see?" value={missingFeatures} onChange={setMissingFeatures} />
            <Field label="How can we make it better?" value={improvement} onChange={setImprovement} />

            <div className="flex gap-2 justify-end pt-1">
              <button onClick={onClose} className="text-sm text-slate px-3 py-2">Cancel</button>
              <button onClick={submit} disabled={sending} className="bg-brand-red text-paper font-bold text-sm px-4 py-2 hover:bg-red-700 transition-colors disabled:opacity-50">
                {sending ? 'Sending…' : 'Send feedback'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">{label}</p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red resize-none"
      />
    </div>
  )
}
