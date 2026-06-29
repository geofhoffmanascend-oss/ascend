'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ProviderApply() {
  const router = useRouter()
  // Discovery
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  // Contact
  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  // Credentials
  const [instructorName, setInstructorName] = useState('')
  const [instructorContact, setInstructorContact] = useState('')
  const [gymName, setGymName] = useState('')
  // Background check
  const [countiesLived, setCountiesLived] = useState('')
  const [arrestLast5, setArrestLast5] = useState(false)
  const [arrestDetails, setArrestDetails] = useState('')
  const [consent, setConsent] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!consent) { setError('Please authorize the background check and instructor contact to continue.'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/provider/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bio, city, state, zip,
        fullName, dateOfBirth, contactEmail, contactPhone,
        instructorName, instructorContact, gymName,
        countiesLived, arrestLast5, arrestDetails, consent,
      }),
    })
    setSaving(false)
    if (res.ok) { router.refresh() }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Could not submit.') }
  }

  const inputCls = 'w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'
  const labelCls = 'text-xs font-bold uppercase tracking-widest text-steel'
  const sectionCls = 'text-xs font-bold uppercase tracking-widest text-steel border-b border-smoke pb-2'

  return (
    <form onSubmit={submit} className="border border-smoke bg-paper p-6 flex flex-col gap-5">
      {/* Your details */}
      <p className={sectionCls}>Your details</p>
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Full legal name</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} placeholder="As it appears on your ID" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Date of birth</label>
          <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Phone</label>
          <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className={inputCls} placeholder="(555) 000-0000" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Email</label>
        <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className={inputCls} />
      </div>

      {/* Credentials */}
      <p className={`${sectionCls} mt-2`}>Credentials</p>
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Black belt you train under</label>
        <input value={instructorName} onChange={e => setInstructorName(e.target.value)} className={inputCls} placeholder="Instructor's full name" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Instructor / gym contact</label>
          <input value={instructorContact} onChange={e => setInstructorContact(e.target.value)} className={inputCls} placeholder="Their email or phone" />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Gym / academy name</label>
          <input value={gymName} onChange={e => setGymName(e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Background check */}
      <p className={`${sectionCls} mt-2`}>Background check</p>
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Counties &amp; states lived in (last 5 years)</label>
        <textarea value={countiesLived} onChange={e => setCountiesLived(e.target.value)} rows={2} className={inputCls} placeholder="e.g. Fairfax County, VA; Montgomery County, MD" />
        <p className="text-xs text-ash">Background checks are searched at the county level.</p>
      </div>
      <label className="flex items-start gap-2 text-sm text-ink">
        <input type="checkbox" checked={arrestLast5} onChange={e => setArrestLast5(e.target.checked)} className="mt-0.5 w-4 h-4 accent-brand-red" />
        <span>Have you been arrested in the last 5 years?</span>
      </label>
      {arrestLast5 && (
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Please explain</label>
          <textarea value={arrestDetails} onChange={e => setArrestDetails(e.target.value)} rows={3} className={inputCls} placeholder="What happened, and the outcome." />
          <p className="text-xs text-ash">An arrest is not necessarily disqualifying — this just helps AscendIt request any additional information needed to keep users safe.</p>
        </div>
      )}

      {/* Discovery */}
      <p className={`${sectionCls} mt-2`}>How you&apos;ll appear</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>City</label>
          <input value={city} onChange={e => setCity(e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>State</label>
          <input value={state} onChange={e => setState(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelCls}>ZIP</label>
        <input value={zip} onChange={e => setZip(e.target.value)} className={`${inputCls} max-w-[140px]`} />
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelCls}>About you (shown to students)</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Experience, style, what you offer…" className={inputCls} />
      </div>

      <label className="flex items-start gap-2 text-sm text-ink border-t border-smoke pt-4">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-brand-red" />
        <span>I authorize AscendIt to contact the instructor I train under and to run a criminal background check, and I confirm the information above is accurate.</span>
      </label>

      {error && <p className="text-sm text-brand-red">{error}</p>}
      <button type="submit" disabled={saving} className="self-start px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60">
        {saving ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  )
}
