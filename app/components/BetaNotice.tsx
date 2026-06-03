import Link from 'next/link'

// Feedback goes to the "AscendIt Admin" account (admin@ascendit.app).
const ADMIN_DM = '/messages/cmpx7uwqu000004lgehyt7lrd'

export function BetaNotice({ variant = 'footer' }: { variant?: 'footer' | 'help' }) {
  const features =
    'Forums, Direct Messages, Activity Feed, Profiles & Following, Training Journal, Schedule, Events, and a view-only photo Gallery'
  if (variant === 'help') {
    return (
      <div className="border border-brand-red/30 bg-brand-red/5 p-4 mb-8 text-sm text-steel">
        <p className="font-bold text-ink mb-1">🚧 AscendIt is in active testing</p>
        <p>
          Several features are still being built and are hidden from regular users for now.
          Available today: {features}. Other tools (gear store, tournaments, payments, photo/video
          uploads) are still in testing and may be hidden.
        </p>
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
        🚧 <span className="font-bold text-ink">AscendIt is in active testing</span> — some features
        are hidden while we build them (available now: {features}).{' '}
        <Link href={ADMIN_DM} className="text-brand-red font-medium hover:underline">
          Message AscendIt Admin
        </Link>{' '}
        with questions, comments, or suggestions.
      </div>
    </div>
  )
}
