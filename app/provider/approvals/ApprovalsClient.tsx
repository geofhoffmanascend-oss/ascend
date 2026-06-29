'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ProviderApplication = {
  fullName: string | null; dateOfBirth: string | null; contactEmail: string | null; contactPhone: string | null
  instructorName: string | null; instructorContact: string | null; gymName: string | null
  countiesLived: string | null; arrestLast5: boolean; arrestDetails: string | null; consent: boolean
}
type App = {
  id: string; name: string | null; belt: string | null; beltVerified: boolean
  providerBio: string | null; providerCity: string | null; providerState: string | null
  providerApplication: ProviderApplication | null
}

export function ApprovalsClient({ applications: initial }: { applications: App[] }) {
  const router = useRouter()
  const [apps, setApps] = useState(initial)
  const [busy, setBusy] = useState<string | null>(null)

  async function act(id: string, action: 'approve' | 'reject') {
    setBusy(id)
    const res = await fetch(`/api/provider/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setBusy(null)
    if (res.ok) { setApps(a => a.filter(x => x.id !== id)); router.refresh() }
    else { const d = await res.json().catch(() => ({})); alert(d.error ?? 'Action failed.') }
  }

  if (apps.length === 0) return <p className="text-ash text-sm italic">No pending private instructor applications.</p>

  return (
    <div className="flex flex-col gap-3">
      {apps.map(a => (
        <div key={a.id} className="border border-smoke bg-paper p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <Link href={`/profile/${a.id}`} className="text-sm font-medium text-brand-red hover:underline">{a.name ?? 'User'}</Link>
              <p className="text-xs text-ash mt-0.5">
                {a.belt ?? 'belt unknown'}{a.beltVerified ? ' (verified)' : ' (self-reported)'}
                {(a.providerCity || a.providerState) && ` · ${[a.providerCity, a.providerState].filter(Boolean).join(', ')}`}
              </p>
              {a.providerBio && <p className="text-sm text-ink mt-2 whitespace-pre-wrap break-words border-l-2 border-smoke pl-3">{a.providerBio}</p>}
            </div>
          </div>

          {a.providerApplication && (
            <div className="mt-3 border-t border-smoke pt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <Field k="Legal name" v={a.providerApplication.fullName} />
              <Field k="Date of birth" v={a.providerApplication.dateOfBirth} />
              <Field k="Email" v={a.providerApplication.contactEmail} />
              <Field k="Phone" v={a.providerApplication.contactPhone} />
              <Field k="Trains under" v={a.providerApplication.instructorName} />
              <Field k="Instructor / gym contact" v={a.providerApplication.instructorContact} />
              <Field k="Gym" v={a.providerApplication.gymName} />
              <Field k="Counties (5 yr)" v={a.providerApplication.countiesLived} />
              <div className="sm:col-span-2">
                <span className="font-bold uppercase tracking-widest text-steel">Arrested (5 yr): </span>
                <span className={a.providerApplication.arrestLast5 ? 'text-brand-red font-medium' : 'text-ink'}>
                  {a.providerApplication.arrestLast5 ? 'Yes' : 'No'}
                </span>
                {a.providerApplication.arrestDetails && <span className="text-ink"> — {a.providerApplication.arrestDetails}</span>}
              </div>
              <div className="sm:col-span-2 text-ash">
                Consent to background check + instructor contact: {a.providerApplication.consent ? '✓ given' : '✗ not given'}
              </div>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <button onClick={() => act(a.id, 'approve')} disabled={busy === a.id} className="px-4 py-2 bg-brand-red text-paper font-bold text-xs hover:bg-red-700 transition-colors disabled:opacity-60">{busy === a.id ? '…' : 'Approve'}</button>
            <button onClick={() => act(a.id, 'reject')} disabled={busy === a.id} className="px-4 py-2 border border-smoke text-steel text-xs font-medium hover:border-steel hover:text-ink transition-colors">Reject</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function Field({ k, v }: { k: string; v: string | null }) {
  if (!v) return null
  return (
    <div>
      <span className="font-bold uppercase tracking-widest text-steel">{k}: </span>
      <span className="text-ink break-words">{v}</span>
    </div>
  )
}
