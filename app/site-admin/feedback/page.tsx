import prisma from '@/lib/database'
import { TOURS, TOUR_ROLES } from '@/lib/tour'
import type { TourRole } from '@/lib/tour/types'

export const metadata = { title: 'Tour Feedback' }

// Build a featureKey -> human label map from the step configs.
const LABELS: Record<string, string> = (() => {
  const m: Record<string, string> = {
    'overall:wanted': 'Most excited to use',
    'overall:confusion': 'Confusing',
    'overall:nps': 'Weekly-use likelihood (NPS)',
  }
  for (const role of TOUR_ROLES) {
    for (const s of TOURS[role].steps) m[s.featureKey] = s.title
  }
  return m
})()

type Row = { featureKey: string; up: number; down: number; comments: string[] }

export default async function TourFeedbackPage() {
  let feedback: { role: string; featureKey: string; rating: number | null; comment: string | null }[] = []
  let tableMissing = false
  try {
    feedback = await prisma.tourFeedback.findMany({
      orderBy: { createdAt: 'desc' },
      select: { role: true, featureKey: true, rating: true, comment: true },
    })
  } catch {
    tableMissing = true
  }

  // Aggregate per role.
  const byRole: Record<string, { steps: Map<string, Row>; nps: number[]; wanted: string[]; confusion: string[] }> = {}
  for (const role of TOUR_ROLES) byRole[role] = { steps: new Map(), nps: [], wanted: [], confusion: [] }

  for (const f of feedback) {
    const bucket = byRole[f.role]
    if (!bucket) continue
    if (f.featureKey === 'overall:nps') {
      if (f.rating !== null) bucket.nps.push(f.rating)
      continue
    }
    if (f.featureKey === 'overall:wanted') { if (f.comment) bucket.wanted.push(f.comment); continue }
    if (f.featureKey === 'overall:confusion') { if (f.comment) bucket.confusion.push(f.comment); continue }
    const row = bucket.steps.get(f.featureKey) ?? { featureKey: f.featureKey, up: 0, down: 0, comments: [] }
    if (f.rating === 1) row.up++
    else if (f.rating === -1) row.down++
    if (f.comment) row.comments.push(f.comment)
    bucket.steps.set(f.featureKey, row)
  }

  const total = feedback.length

  return (
    <div className="px-6 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Platform</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Tour Feedback</h1>
        <p className="text-sm text-slate mt-1">{total} response{total === 1 ? '' : 's'} across all tours.</p>
      </div>

      {tableMissing && (
        <div className="mb-6 border border-amber-300 bg-amber-50 text-amber-800 text-sm px-4 py-3">
          The <code>TourFeedback</code> table isn’t in the database yet. Run <code>prisma db push</code> then restart dev.
        </div>
      )}

      <div className="flex flex-col gap-10">
        {TOUR_ROLES.map((role) => {
          const b = byRole[role]
          const rows = [...b.steps.values()]
          const npsAvg = b.nps.length ? (b.nps.reduce((a, n) => a + n, 0) / b.nps.length).toFixed(1) : '—'
          return (
            <section key={role}>
              <h2 className="font-display text-lg text-ink mb-3 capitalize">{role} tour</h2>

              {rows.length === 0 && b.wanted.length === 0 && b.confusion.length === 0 && b.nps.length === 0 ? (
                <p className="text-sm text-slate">No feedback yet.</p>
              ) : (
                <div className="border border-smoke">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-mist text-left text-xs uppercase tracking-widest text-steel">
                        <th className="px-3 py-2 font-bold">Feature</th>
                        <th className="px-3 py-2 font-bold">👍</th>
                        <th className="px-3 py-2 font-bold">👎</th>
                        <th className="px-3 py-2 font-bold">% positive</th>
                        <th className="px-3 py-2 font-bold">Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const t = r.up + r.down
                        const pct = t ? Math.round((r.up / t) * 100) : 0
                        return (
                          <tr key={r.featureKey} className="border-t border-smoke align-top">
                            <td className="px-3 py-2 text-ink">{LABELS[r.featureKey] ?? r.featureKey}</td>
                            <td className="px-3 py-2 text-ink">{r.up}</td>
                            <td className="px-3 py-2 text-ink">{r.down}</td>
                            <td className="px-3 py-2 text-ink">{t ? `${pct}%` : '—'}</td>
                            <td className="px-3 py-2 text-slate">
                              {r.comments.length ? r.comments.map((c, i) => <p key={i}>“{c}”</p>) : <span className="text-ash">—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  <div className="grid md:grid-cols-3 gap-4 p-3 border-t border-smoke bg-paper">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">NPS avg ({b.nps.length})</p>
                      <p className="font-display text-2xl text-ink">{npsAvg}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Most wanted</p>
                      {b.wanted.length ? b.wanted.map((c, i) => <p key={i} className="text-sm text-slate">“{c}”</p>) : <p className="text-sm text-ash">—</p>}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Confusion</p>
                      {b.confusion.length ? b.confusion.map((c, i) => <p key={i} className="text-sm text-slate">“{c}”</p>) : <p className="text-sm text-ash">—</p>}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
