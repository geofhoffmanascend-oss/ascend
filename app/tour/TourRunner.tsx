'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { driver, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import './tour.css'
import { MockShell } from './screens/MockShell'
import { MockScreen } from './screens/MockScreen'
import { TOURS } from '@/lib/tour'
import type { TourRole } from '@/lib/tour/types'

function postFeedback(role: TourRole, featureKey: string, rating: number | null, comment?: string) {
  fetch('/api/tour/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, featureKey, rating, comment }),
  }).catch(() => {})
}

export function TourRunner({
  role,
  loggedIn,
  exitHref,
}: {
  role: TourRole
  loggedIn: boolean
  exitHref: string
}) {
  const router = useRouter()
  const config = TOURS[role]
  const steps = config.steps
  const driverRef = useRef<Driver | null>(null)
  const [index, setIndex] = useState(0)
  const [navOpen, setNavOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [ratings, setRatings] = useState<Record<number, number>>({})

  const step = steps[index]

  // Init one driver instance for the spotlight + popover (no built-in buttons).
  useEffect(() => {
    driverRef.current = driver({
      showButtons: [],
      allowClose: false,
      stagePadding: 6,
      stageRadius: 4,
      overlayOpacity: 0.6,
      popoverClass: 'ascend-tour',
    })
    return () => {
      driverRef.current?.destroy()
      driverRef.current = null
    }
  }, [])

  // Highlight the current step's element whenever the step (or mobile nav) changes.
  useEffect(() => {
    if (done) return
    const d = driverRef.current
    if (!d) return
    const mobile = typeof window !== 'undefined' && window.innerWidth < 768
    if (step.mobileOpensNav && mobile && !navOpen) {
      setNavOpen(true)
      return
    }
    const selector = step.mobileOpensNav && mobile ? '[data-tour="nav-menu"]' : step.selector
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector(selector) as HTMLElement | null
      if (!el) return
      el.scrollIntoView({ block: 'center', behavior: 'auto' })
      d.highlight({
        element: el,
        popover: {
          title: step.title,
          description: step.body,
          side: step.placement ?? 'bottom',
          align: 'start',
        },
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [index, navOpen, done, step])

  const goTo = useCallback(
    (next: number) => {
      if (!step.mobileOpensNav) setNavOpen(false)
      setIndex(next)
    },
    [step],
  )

  const next = () => {
    if (index < steps.length - 1) goTo(index + 1)
    else finish()
  }
  const back = () => index > 0 && goTo(index - 1)

  const finish = () => {
    driverRef.current?.destroy()
    if (loggedIn) {
      fetch('/api/tour/seen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      }).catch(() => {})
    }
    setDone(true)
  }

  const exit = () => {
    driverRef.current?.destroy()
    router.push(exitHref)
  }

  const rate = (value: number) => {
    setRatings((r) => ({ ...r, [index]: value }))
    postFeedback(role, step.featureKey, value)
  }

  // Keyboard nav
  useEffect(() => {
    if (done) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') back()
      else if (e.key === 'Escape') exit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="min-h-screen bg-paper">
      <MockShell role={role} navOpen={navOpen} onToggleNav={() => setNavOpen((v) => !v)}>
        <MockScreen screen={step.screen} />
      </MockShell>

      {/* Control bar */}
      {!done && (
        <div className="tour-ui fixed bottom-0 left-0 right-0 z-[2147483000] bg-ink-soft border-t border-steel/40 text-paper">
          <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-widest text-ash shrink-0">
              {config.label} · {index + 1}/{steps.length}
            </span>

            {step.note && (
              <span className="text-[11px] px-2 py-0.5 bg-brand-red/20 text-brand-red rounded-sm hidden sm:inline">
                {step.note}
              </span>
            )}

            <span className="flex items-center gap-1 ml-auto shrink-0">
              <span className="text-[11px] text-ash mr-1 hidden sm:inline">Clear?</span>
              <button
                onClick={() => rate(1)}
                className={`px-2 py-1 text-sm rounded-sm ${ratings[index] === 1 ? 'bg-brand-red text-paper' : 'hover:bg-steel/40'}`}
                aria-label="Helpful"
              >👍</button>
              <button
                onClick={() => rate(-1)}
                className={`px-2 py-1 text-sm rounded-sm ${ratings[index] === -1 ? 'bg-brand-red text-paper' : 'hover:bg-steel/40'}`}
                aria-label="Not clear"
              >👎</button>
            </span>

            <span className="flex items-center gap-2 shrink-0">
              <button onClick={exit} className="text-xs text-ash hover:text-paper px-2 py-1.5">Exit</button>
              <button
                onClick={back}
                disabled={index === 0}
                className="text-sm font-medium border border-steel text-paper px-3 py-1.5 disabled:opacity-30"
              >Back</button>
              <button
                onClick={next}
                className="text-sm font-bold bg-brand-red text-paper px-4 py-1.5 hover:bg-red-700 transition-colors"
              >{index === steps.length - 1 ? 'Finish' : 'Next'}</button>
            </span>
          </div>
        </div>
      )}

      {done && <EndSurvey role={role} exitHref={exitHref} onClose={exit} />}
    </div>
  )
}

function EndSurvey({ role, onClose }: { role: TourRole; exitHref: string; onClose: () => void }) {
  const [wanted, setWanted] = useState('')
  const [confusion, setConfusion] = useState('')
  const [nps, setNps] = useState<number | null>(null)
  const [sent, setSent] = useState(false)

  const submit = () => {
    if (wanted.trim()) postFeedback(role, 'overall:wanted', null, wanted.trim())
    if (confusion.trim()) postFeedback(role, 'overall:confusion', null, confusion.trim())
    if (nps !== null) postFeedback(role, 'overall:nps', nps)
    setSent(true)
  }

  return (
    <div className="tour-ui fixed inset-0 z-[2147483000] bg-ink/70 flex items-center justify-center px-4 py-8 overflow-auto">
      <div className="w-full max-w-md bg-paper border border-smoke p-6">
        {sent ? (
          <div className="text-center flex flex-col gap-4">
            <h2 className="font-display text-xl text-ink">Thanks! 🥋</h2>
            <p className="text-sm text-slate">Your feedback helps us shape AscendIt.</p>
            <button onClick={onClose} className="bg-brand-red text-paper font-bold text-sm px-4 py-2">Done</button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <span className="inline-block bg-brand-red px-3 py-1 font-display text-xs font-bold tracking-widest uppercase text-paper mb-2">Quick survey</span>
              <h2 className="font-display text-xl text-ink">That’s the tour!</h2>
              <p className="text-sm text-slate mt-1">Three quick questions (optional).</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">What feature are you most excited to use?</p>
              <input value={wanted} onChange={(e) => setWanted(e.target.value)} className="w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Anything confusing?</p>
              <input value={confusion} onChange={(e) => setConfusion(e.target.value)} className="w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">How likely are you to use this weekly? (0–10)</p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 11 }).map((_, n) => (
                  <button key={n} onClick={() => setNps(n)} className={`w-7 h-7 text-xs border ${nps === n ? 'bg-brand-red text-paper border-brand-red' : 'border-smoke text-steel'}`}>{n}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={onClose} className="text-sm text-slate px-3 py-2">Skip</button>
              <button onClick={submit} className="bg-brand-red text-paper font-bold text-sm px-4 py-2">Submit</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
