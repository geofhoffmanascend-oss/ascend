import prisma from '@/lib/database'

export const metadata = { title: 'User Feedback' }
export const dynamic = 'force-dynamic'

const round1 = (v: number | null) => (v == null ? '—' : (Math.round(v * 10) / 10).toFixed(1))

function Stars({ n }: { n: number | null }) {
  if (n == null) return <span className="text-ash text-xs">—</span>
  return <span className="text-brand-red text-sm">{'★'.repeat(n)}<span className="text-smoke">{'★'.repeat(5 - n)}</span></span>
}

const RATING_LABELS: { key: 'ratingOverall' | 'ratingDisplay' | 'ratingNavigation' | 'ratingPerformance'; label: string }[] = [
  { key: 'ratingOverall', label: 'Overall' },
  { key: 'ratingDisplay', label: 'Looks' },
  { key: 'ratingNavigation', label: 'Navigation' },
  { key: 'ratingPerformance', label: 'Performance' },
]

export default async function UserFeedbackPage() {
  let total = 0
  let avg: { ratingOverall: number | null; ratingDisplay: number | null; ratingNavigation: number | null; ratingPerformance: number | null } = {
    ratingOverall: null, ratingDisplay: null, ratingNavigation: null, ratingPerformance: null,
  }
  let entries: Awaited<ReturnType<typeof prisma.feedback.findMany>> = []
  let tableMissing = false

  try {
    const [t, a, e] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.aggregate({ _avg: { ratingOverall: true, ratingDisplay: true, ratingNavigation: true, ratingPerformance: true } }),
      prisma.feedback.findMany({ orderBy: { createdAt: 'desc' }, take: 500 }),
    ])
    total = t; avg = a._avg; entries = e
  } catch {
    tableMissing = true
  }

  return (
    <div className="px-6 py-10">
      <div className="flex items-start justify-between gap-3 mb-8 flex-wrap">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Platform</span>
          </div>
          <h1 className="font-display text-2xl text-ink">User Feedback</h1>
          <p className="text-sm text-slate mt-1">{total} submission{total === 1 ? '' : 's'} from the in-app feedback button.</p>
        </div>
        <a href="/api/site-admin/user-feedback/export" className="bg-brand-red text-paper font-bold text-sm px-4 py-2 hover:bg-red-700 transition-colors">
          Export CSV
        </a>
      </div>

      {tableMissing && (
        <div className="mb-6 border border-amber-300 bg-amber-50 text-amber-800 text-sm px-4 py-3">
          The <code>Feedback</code> table isn’t in the database yet. Run <code>prisma db push</code> then restart dev.
        </div>
      )}

      {/* Average cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {RATING_LABELS.map(({ key, label }) => (
          <div key={key} className="border border-smoke bg-paper p-4 text-center">
            <p className="font-display text-3xl text-ink">{round1(avg[key])}</p>
            <p className="text-xs text-slate mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Submissions */}
      {entries.length === 0 ? (
        <p className="text-sm text-slate">No feedback yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((f) => (
            <div key={f.id} className="border border-smoke bg-paper p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                <p className="text-sm font-medium text-ink">{f.userName ?? f.userEmail ?? 'Anonymous'}</p>
                <p className="text-xs text-ash">{f.createdAt.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                {RATING_LABELS.map(({ key, label }) => (
                  <div key={key} className="text-xs">
                    <span className="text-ash">{label}: </span><Stars n={f[key]} />
                  </div>
                ))}
              </div>
              {f.changeRequest && <Answer q="Would change" a={f.changeRequest} />}
              {f.missingFeatures && <Answer q="Missing features" a={f.missingFeatures} />}
              {f.improvement && <Answer q="How to improve" a={f.improvement} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Answer({ q, a }: { q: string; a: string }) {
  return (
    <p className="text-sm mt-1">
      <span className="text-xs font-bold uppercase tracking-widest text-steel">{q}: </span>
      <span className="text-ink whitespace-pre-wrap">{a}</span>
    </p>
  )
}
