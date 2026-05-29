'use client'

import { useState } from 'react'

interface Gym {
  id: string
  name: string
  slug: string
  headInstructorName: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  website: string | null
  description: string | null
  logoUrl: string | null
  participatingStatus: string
  paymentTerms: Record<string, number> | null
}

const inputCls = 'w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'
const labelCls = 'text-xs font-bold uppercase tracking-widest text-steel'
const primaryBtn = 'px-5 py-2.5 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60'
const secondaryBtn = 'px-5 py-2.5 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors disabled:opacity-60'

export function GymEditClient({ gym: initial }: { gym: Gym }) {
  const [gym, setGym] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Payment terms
  const pt = initial.paymentTerms ?? {}
  const [membershipPct, setMembershipPct] = useState(String(pt.membershipPct ?? ''))
  const [merchPct, setMerchPct] = useState(String(pt.merchPct ?? ''))
  const [photoPct, setPhotoPct] = useState(String(pt.photoPct ?? ''))
  const [flatMonthlyFee, setFlatMonthlyFee] = useState(String(pt.flatMonthlyFee ?? ''))

  // Danger zone
  const [confirmInactive, setConfirmInactive] = useState(false)

  function set(field: keyof Gym, value: string) {
    setGym(g => ({ ...g, [field]: value }))
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    setError('')

    const paymentTerms: Record<string, number> = {}
    if (membershipPct) paymentTerms.membershipPct = parseFloat(membershipPct)
    if (merchPct) paymentTerms.merchPct = parseFloat(merchPct)
    if (photoPct) paymentTerms.photoPct = parseFloat(photoPct)
    if (flatMonthlyFee) paymentTerms.flatMonthlyFee = parseFloat(flatMonthlyFee)

    const res = await fetch(`/api/site-admin/gyms/${gym.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: gym.name,
        headInstructorName: gym.headInstructorName,
        address: gym.address,
        city: gym.city,
        state: gym.state,
        zip: gym.zip,
        phone: gym.phone,
        website: gym.website,
        description: gym.description,
        logoUrl: gym.logoUrl,
        participatingStatus: gym.participatingStatus,
        paymentTerms: Object.keys(paymentTerms).length > 0 ? paymentTerms : undefined,
      }),
    })

    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Save failed.')
    }
  }

  async function markInactive() {
    setSaving(true)
    await fetch(`/api/site-admin/gyms/${gym.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participatingStatus: 'inactive' }),
    })
    setGym(g => ({ ...g, participatingStatus: 'inactive' }))
    setConfirmInactive(false)
    setSaving(false)
  }

  return (
    <>
      {/* Gym Info */}
      <div className="border border-smoke bg-paper p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-5">Gym Info</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([
            { field: 'name', label: 'Name' },
            { field: 'headInstructorName', label: 'Head Instructor' },
            { field: 'address', label: 'Address' },
            { field: 'city', label: 'City' },
            { field: 'state', label: 'State' },
            { field: 'zip', label: 'Zip' },
            { field: 'phone', label: 'Phone' },
            { field: 'website', label: 'Website' },
            { field: 'logoUrl', label: 'Logo URL' },
          ] as { field: keyof Gym; label: string }[]).map(({ field, label }) => (
            <div key={field} className="flex flex-col gap-1">
              <label className={labelCls}>{label}</label>
              <input value={(gym[field] as string) ?? ''} onChange={e => set(field, e.target.value)} className={inputCls} />
            </div>
          ))}
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className={labelCls}>Description</label>
            <textarea value={gym.description ?? ''} onChange={e => set('description', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-smoke">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Tier</p>
          <select value={gym.participatingStatus} onChange={e => set('participatingStatus', e.target.value)} className={`${inputCls} w-auto`}>
            <option value="free">Free</option>
            <option value="participating">Participating</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="mt-5 pt-5 border-t border-smoke">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Payment Terms</p>
          <p className="text-xs text-ash mb-3">Revenue share percentages agreed with this gym.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Membership %', val: membershipPct, set: setMembershipPct },
              { label: 'Merch %', val: merchPct, set: setMerchPct },
              { label: 'Photo %', val: photoPct, set: setPhotoPct },
              { label: 'Flat Monthly ($)', val: flatMonthlyFee, set: setFlatMonthlyFee },
            ].map(({ label, val, set: s }) => (
              <div key={label} className="flex flex-col gap-1">
                <label className={labelCls}>{label}</label>
                <input type="number" value={val} onChange={e => s(e.target.value)} className={inputCls} min="0" step="0.1" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-5">
          <button onClick={save} disabled={saving} className={primaryBtn}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && <span className="text-sm text-green-600">Saved ✓</span>}
          {error && <span className="text-sm text-brand-red">{error}</span>}
        </div>
      </div>

      {/* Danger zone */}
      {gym.participatingStatus !== 'inactive' && (
        <div className="border border-red-200 bg-paper p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-3">Danger Zone</p>
          {confirmInactive ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-ink">Mark this gym as inactive?</span>
              <button onClick={markInactive} disabled={saving} className="px-4 py-2 bg-brand-red text-paper text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
                Confirm
              </button>
              <button onClick={() => setConfirmInactive(false)} className={secondaryBtn}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmInactive(true)} className={secondaryBtn}>
              Mark as Inactive
            </button>
          )}
        </div>
      )}
    </>
  )
}
