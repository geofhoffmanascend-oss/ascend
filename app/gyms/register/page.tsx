'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function GymRegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Gym name is required'); return }
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

  const inputCls = 'w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'
  const labelCls = 'text-xs font-bold uppercase tracking-widest text-steel'

  if (done) {
    return (
      <div className="border border-smoke bg-paper p-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-4">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Registered</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-ink mb-2">Your gym has been registered.</h1>
        <p className="text-sm text-slate mb-2">A platform admin will review it shortly.</p>
        {done.memberCount > 0 && (
          <p className="text-sm text-ink mb-6">
            {done.memberCount} member{done.memberCount !== 1 ? 's' : ''} from your gym already use AscendIt.
          </p>
        )}
        <button
          onClick={() => {
            if (returnTo === 'onboarding') {
              router.push(`/onboarding?gymId=${encodeURIComponent(done.gymId)}&gymName=${encodeURIComponent(done.name)}`)
            } else {
              router.push(`/gyms/${done.slug}`)
            }
          }}
          className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors"
        >
          {returnTo === 'onboarding' ? 'Continue Setup →' : 'View Gym Profile →'}
        </button>
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
        <p className="text-sm text-slate">Registering is free. Once reviewed, you can upgrade to unlock scheduling, attendance, and more.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelCls}>Gym Name <span className="text-brand-red">*</span></label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputCls} placeholder="Lions BJJ" />
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
          {saving ? 'Registering…' : 'Register Gym →'}
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
