'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { SIMPLE_LAUNCH } from '@/lib/launchMode'

const KEY = 'gym_mgmt_paused_v1'

// One-time notice for users who had the gym-admin role before gym management was paused
// for the simple-launch pivot. Shows once (dismissal persisted per-user), only in simple
// mode, and only to former gym admins (not site admins).
export function GymMgmtPausedNotice() {
  const { data: session, status } = useSession()
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)

  const roles = session?.user?.roles ?? []
  const isFormerGymAdmin = roles.includes('admin') && !roles.includes('site_admin')

  useEffect(() => {
    if (!SIMPLE_LAUNCH || status !== 'authenticated' || !isFormerGymAdmin) return
    let cancelled = false
    fetch('/api/feature-intros')
      .then(r => r.json())
      .then(d => { if (!cancelled && !(d.dismissed ?? []).includes(KEY)) setShow(true) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [status, isFormerGymAdmin])

  if (!show) return null

  async function dismiss() {
    setBusy(true)
    try {
      await fetch('/api/notices/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: KEY }),
      })
    } catch { /* best-effort */ }
    setShow(false)
  }

  return (
    <div className="fixed inset-0 z-[2147483000] bg-ink/70 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-paper border border-smoke p-6 flex flex-col gap-4">
        <div>
          <span className="inline-block bg-brand-red px-3 py-1 font-display text-xs font-bold tracking-widest uppercase text-paper mb-3">
            A change for gym owners
          </span>
          <p className="text-sm text-slate leading-relaxed">
            Based on early test feedback, we&apos;ve <span className="font-medium text-ink">paused in-app gym management</span> while
            AscendIt&apos;s pre-launch focuses on building a community of practitioners.
          </p>
          <p className="text-sm text-slate leading-relaxed mt-2">
            <span className="font-medium text-ink">Your data is safe</span> — nothing has been deleted, and your gym stays listed so
            members can still find their teammates here.
          </p>
          <p className="text-sm text-ink font-medium mt-3 mb-1">As a gym owner you can still:</p>
          <ul className="text-sm text-slate leading-relaxed list-disc pl-5 space-y-0.5">
            <li>Submit open mats, seminars &amp; events to the public calendar</li>
            <li>Reach your students through group chats &amp; forums</li>
            <li>Apply for a private-instructor profile to offer private lessons</li>
          </ul>
          <p className="text-xs text-ash leading-relaxed mt-3">
            Gym-management tools may return — we&apos;ll let you know.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <Link
            href="/events/new"
            onClick={dismiss}
            className="border border-smoke text-steel text-sm font-medium px-4 py-2 hover:border-steel hover:text-ink transition-colors"
          >
            Submit an event →
          </Link>
          <button
            onClick={dismiss}
            disabled={busy}
            className="bg-brand-red text-paper font-bold text-sm px-4 py-2 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
