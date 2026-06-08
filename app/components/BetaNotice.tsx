import Link from 'next/link'

// Feedback goes to the "AscendIt Admin" account (admin@ascendit.app).
const ADMIN_DM = '/messages/cmpx7uwqu000004lgehyt7lrd'

const AVAILABLE =
  'Forums, Direct Messages, Activity Feed, Profiles & Following, Training Journal, Schedule (class registration & check-in), Events, Private Lessons, Invites, finding or registering your gym, and a view-only photo Gallery'
const COMING_SOON =
  'photo & video uploads, a gear store, in-app tournaments, membership tools, and bulk & email invitations'

export function BetaNotice({ variant = 'footer' }: { variant?: 'footer' | 'help' }) {
  if (variant === 'help') {
    return (
      <div className="border border-brand-red/30 bg-brand-red/5 p-4 mb-8 text-sm text-steel">
        <p className="font-bold text-ink mb-1">🚧 AscendIt is in active testing</p>
        <p><span className="font-medium text-ink">Available now:</span> {AVAILABLE}.</p>
        <p className="mt-1"><span className="font-medium text-ink">Coming soon:</span> {COMING_SOON}. Some tools may be hidden while we build them.</p>
        <p className="mt-2">
          Questions, comments, or suggestions?{' '}
          <Link href={ADMIN_DM} className="text-brand-red font-medium hover:underline">
            Message AscendIt Admin
          </Link>.
        </p>
      </div>
    )
  }
  return (
    <div className="border-t border-smoke bg-brand-red/5">
      <div className="max-w-6xl mx-auto px-4 py-3 text-xs text-steel">
        🚧 <span className="font-bold text-ink">AscendIt is in active testing</span>.{' '}
        <span className="font-medium text-ink">Available now:</span> {AVAILABLE}.{' '}
        <span className="font-medium text-ink">Coming soon:</span> {COMING_SOON}.{' '}
        <Link href={ADMIN_DM} className="text-brand-red font-medium hover:underline">
          Message AscendIt Admin
        </Link>{' '}
        with questions, comments, or suggestions.
      </div>
    </div>
  )
}
