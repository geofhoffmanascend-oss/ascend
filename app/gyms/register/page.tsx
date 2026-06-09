'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

type SimilarMatch = {
  id: string
  name: string
  slug: string
  city: string | null
  state: string | null
  zip: string | null
  headInstructorName: string | null
  matchKind: 'duplicate' | 'similar'
}

function GymRegisterForm() {
  const router = useRouter()
  const { update } = useSession()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const isOwner = returnTo === 'owner'
  const prefillName = searchParams.get('name') ?? ''

  const [name, setName] = useState(prefillName)
  const [headInstructor, setHeadInstructor] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ gymId: string; slug: string; name: string; memberCount: number } | null>(null)

  // Phase 38.5 — duplicate / similar-gym warn-and-fork (owner flow only)
  const [matches, setMatches] = useState<SimilarMatch[] | null>(null)

  async function createGym() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/gyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          headInstructorName: headInstructor || undefined,
          address: address || undefined,
          city: city || undefined,
          state: state || undefined,
          zip: zip || undefined,
          phone: phone || undefined,
          website: website || undefined,
          description: description || undefined,
          ...(isOwner ? { asOwner: true } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to register gym')

      const gymRes = await fetch(`/api/gyms/${data.gym.id}`)
      const gymData = await gymRes.json()
      setDone({ gymId: data.gym.id, slug: data.gym.slug, name: data.gym.name, memberCount: gymData.memberCount ?? 0 })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Gym name is required'); return }
    setError('')

    // Owner flow: check for an existing similar/duplicate gym before creating.
    if (isOwner && matches === null) {
      setSaving(true)
      try {
        const qs = new URLSearchParams({ name: name.trim(), state, zip }).toString()
        const res = await fetch(`/api/gyms/similar?${qs}`)
        const data = await res.json()
        const found: SimilarMatch[] = data.matches ?? []
        if (found.length > 0) {
          setMatches(found)
          setSaving(false)
          return
        }
      } catch {
        // detection is best-effort — fall through to create on failure
      } finally {
        setSaving(false)
      }
    }

    await createGym()
  }

  const inputCls = 'w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'
  const labelCls = 'text-xs font-bold uppercase tracking-widest text-steel'

  if (done) {
    return (
      <div className="border border-smoke bg-paper p-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-4">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Registered</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-ink mb-2">Your gym is on AscendIt.</h1>
        {isOwner ? (
          <p className="text-sm text-slate mb-2">You're now the admin of {done.name}. Let's finish setting it up.</p>
        ) : (
          <p className="text-sm text-slate mb-2">A platform admin will review it shortly.</p>
        )}
        {(() => {
          // memberCount includes you (added on create) — show OTHERS.
          const others = Math.max(0, done.memberCount - 1)
          if (others === 0) {
            return <p className="text-sm text-ink mb-6">You're the first person from {done.name} on AscendIt.</p>
          }
          return (
            <p className="text-sm text-ink mb-6">
              {others} other member{others !== 1 ? 's' : ''} from your gym {others === 1 ? 'already uses' : 'already use'} AscendIt.
            </p>
          )
        })()}
        <button
          onClick={async () => {
            if (isOwner) {
              // Re-mint the JWT cookie so middleware admits the new admin/instructor
              // roles (withAuth reads the raw cookie and won't see the DB grant otherwise).
              await update()
              router.push('/onboarding/owner')
              router.refresh()
            } else if (returnTo === 'onboarding') {
              router.push(`/onboarding?gymId=${encodeURIComponent(done.gymId)}&gymName=${encodeURIComponent(done.name)}`)
            } else {
              router.push(`/gyms/${done.slug}`)
            }
          }}
          className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors"
        >
          {isOwner || returnTo === 'onboarding' ? 'Continue Setup →' : 'View Gym Profile →'}
        </button>
      </div>
    )
  }

  // Phase 38.5 — warn-and-fork screen
  if (matches && matches.length > 0) {
    return (
      <div className="border border-smoke bg-paper p-8 flex flex-col gap-5">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-4">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Possible Match</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-ink mb-1">Is this your gym?</h1>
          <p className="text-sm text-slate">
            We found {matches.length === 1 ? 'a gym' : 'gyms'} that may already be on AscendIt.
            If one is yours, you can claim it instead of creating a duplicate.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {matches.map(m => (
            <div key={m.id} className="border border-smoke p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">{m.name}</span>
                {m.matchKind === 'duplicate' ? (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-brand-red border border-brand-red px-1.5 py-0.5">Likely duplicate</span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate border border-smoke px-1.5 py-0.5">Similar</span>
                )}
              </div>
              <div className="text-xs text-slate">
                {[m.city, m.state].filter(Boolean).join(', ') || 'Location not listed'}
                {m.headInstructorName ? ` · ${m.headInstructorName}` : ''}
              </div>
              <div className="mt-2">
                {/* Claim mechanics are Phase 39 — fork only for now */}
                <button
                  type="button"
                  onClick={() => router.push(`/gyms/${m.slug}`)}
                  className="text-xs font-semibold text-brand-red hover:underline"
                >
                  This is mine — claim it →
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-ash">
          Claiming verifies you own the gym before transferring control. (Coming soon — for now this opens the gym's profile.)
        </p>

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setMatches(null)}
            className="px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
          >
            ← Back
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={createGym}
            className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {saving ? 'Creating…' : "It's different — create new"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-smoke bg-paper p-8 flex flex-col gap-5">
      <div>
        <div className="inline-block bg-brand-red px-3 py-1 mb-4">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Register Your Gym</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-ink mb-1">Add your gym to AscendIt</h1>
        <p className="text-sm text-slate">
          {isOwner
            ? 'Tell us about your gym. You\'ll be set up as its admin and can configure everything next.'
            : 'Registering is free.'}
        </p>
        <p className="text-xs text-ash mt-2">
          Already listed?{' '}
          <a href="/gyms/claim" className="text-brand-red font-semibold hover:underline">Claim your gym</a>{' '}
          instead of creating a duplicate.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelCls}>Gym Name <span className="text-brand-red">*</span></label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputCls} placeholder="Lions Jiu-Jitsu" />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelCls}>Head Instructor <span className="normal-case font-normal text-ash">(optional)</span></label>
        <input type="text" value={headInstructor} onChange={e => setHeadInstructor(e.target.value)} className={inputCls} placeholder="Name" />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelCls}>Street Address <span className="normal-case font-normal text-ash">(optional)</span></label>
        <input type="text" value={address} onChange={e => setAddress(e.target.value)} className={inputCls} placeholder="123 Main St" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1 col-span-1">
          <label className={labelCls}>City</label>
          <input type="text" value={city} onChange={e => setCity(e.target.value)} className={inputCls} placeholder="Denver" />
        </div>
        <div className="flex flex-col gap-1 col-span-1">
          <label className={labelCls}>State</label>
          <input type="text" value={state} onChange={e => setState(e.target.value)} className={inputCls} placeholder="CO" maxLength={2} />
        </div>
        <div className="flex flex-col gap-1 col-span-1">
          <label className={labelCls}>Zip</label>
          <input type="text" value={zip} onChange={e => setZip(e.target.value)} className={inputCls} placeholder="80201" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Phone <span className="normal-case font-normal text-ash">(optional)</span></label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="(555) 000-0000" />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Website <span className="normal-case font-normal text-ash">(optional)</span></label>
          <input type="url" value={website} onChange={e => setWebsite(e.target.value)} className={inputCls} placeholder="https://..." />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelCls}>Description <span className="normal-case font-normal text-ash">(optional)</span></label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="A bit about your gym..." />
      </div>

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60">
          {saving ? 'Working…' : isOwner ? 'Continue →' : 'Register Gym →'}
        </button>
      </div>
    </form>
  )
}

export default function GymRegisterPage() {
  return (
    <div className="min-h-full bg-paper py-16 px-4">
      <div className="max-w-lg mx-auto">
        <Suspense fallback={<div className="text-sm text-slate">Loading…</div>}>
          <GymRegisterForm />
        </Suspense>
      </div>
    </div>
  )
}
