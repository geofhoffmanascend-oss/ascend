import Link from 'next/link'

export const metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-8">
        <span className="inline-block bg-brand-red px-3 py-1 font-display text-xs font-bold tracking-widest uppercase text-paper mb-3">
          About
        </span>
        <h1 className="font-display text-2xl text-ink">AscendIt</h1>
        <p className="mt-2 text-base text-slate font-medium">The Journey. The Art. The Community.</p>
      </div>

      {/* Description */}
      <div className="border border-smoke bg-paper p-6 mb-6">
        <p className="text-sm text-slate leading-relaxed">
          AscendIt is a platform built for serious practitioners — designed to streamline training,
          deepen coach-student relationships, and help every athlete track their progress from white
          belt to black belt.
        </p>
      </div>

      {/* Features */}
      <div className="border border-smoke bg-paper p-6 mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">Platform Features</p>
        <ul className="flex flex-col gap-2">
          {[
            'Schedule & Registration — browse the weekly calendar and register for classes',
            'Training Journal — log sessions, track progress, and reflect on your game',
            'Coach Tools — session management, attendance, student notes, and lesson plans',
            'Direct Messaging — communicate with instructors and teammates',
            'Media Gallery — share photos and videos from training and events',
            'Gear Store — browse and order apparel and equipment',
          ].map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-slate">
              <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-brand-red" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <Link
          href="/register"
          className="px-5 py-2.5 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="px-5 py-2.5 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
        >
          Sign In
        </Link>
      </div>

      {/* Help link */}
      <p className="text-sm text-slate">
        Need help using the app?{' '}
        <Link href="/help" className="text-ink underline underline-offset-2 hover:text-brand-red transition-colors">
          Visit the Help page.
        </Link>
      </p>
    </main>
  )
}
