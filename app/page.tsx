import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="bg-ink min-h-full">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-24 pb-20 flex flex-col items-start gap-8">
        <div className="inline-block bg-brand-red px-3 py-1">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
            Now Training
          </span>
        </div>

        <h1 className="font-display text-paper max-w-2xl">
          Where Commitment<br />Meets the Mat
        </h1>

        <p className="text-ash text-lg max-w-xl leading-relaxed">
          Schedule classes, declare your attendance, connect with training partners,
          and track your progress from white belt to black.
        </p>

        <div className="flex gap-3 flex-wrap">
          <Link
            href="/register"
            className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors"
          >
            Join Ascend
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-steel text-ash text-sm font-medium hover:border-paper hover:text-paper transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-steel/30 bg-ink-soft">
        <div className="max-w-6xl mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              label: 'Register for Class',
              body: 'Declare attendance before class so instructors can plan training partners by division.',
            },
            {
              label: 'Per-Class Forums',
              body: 'Instructors post technique videos. Students ask questions. All in one place.',
            },
            {
              label: 'Track Your Journey',
              body: 'Log competitions, rank promotions, attendance, and personal goals over time.',
            },
          ].map(({ label, body }) => (
            <div key={label} className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-red">{label}</p>
              <p className="text-ash leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
