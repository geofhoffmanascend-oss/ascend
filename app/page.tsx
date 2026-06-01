import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-full">
      {/* Hero — light background to complement the banner */}
      <section className="bg-paper border-b border-smoke">
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-12 flex flex-col items-center gap-6">
          <p className="font-display text-sm font-bold uppercase tracking-widest text-steel text-center">
            same journey, different paths, one goal...
          </p>

          <Image
            src="/heroBanner.png"
            alt="AscendIt — The Journey. The Art. The Community."
            width={340}
            height={340}
            className="object-contain"
            priority
          />

          <p className="font-display text-xl text-ink max-w-md text-center leading-snug">
            Connecting people with the shared pursuit of one day being good at Jiu-Jitsu.
          </p>

          <p className="text-slate text-sm max-w-md leading-relaxed text-center">
            Message with your team, journal your goals &amp; progress, share photos,
            find open mats and more…
          </p>

          <div className="flex gap-3 flex-wrap justify-center">
            <Link
              href="/register"
              className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors"
            >
              Join AscendIt
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
            >
              Sign In
            </Link>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Link href="/tour" className="text-slate hover:text-ink text-sm transition-colors">
              See how it works →
            </Link>
            <Link href="/tour/admin" className="text-ash hover:text-slate text-xs transition-colors">
              Managing a gym? See the owner tour →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-ink-soft">
        <div className="max-w-6xl mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              label: 'Register for Class',
              body: 'Set goals and declare attendance before class so instructors can plan',
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
