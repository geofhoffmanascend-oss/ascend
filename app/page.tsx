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
            Connecting people in the shared pursuit of continuous improvement on a journey towards mastery.
          </p>

          <p className="text-slate text-sm max-w-md leading-relaxed text-center">
            Message with your team, journal your goals &amp; progress, share photos,
            find open mats and more…
          </p>

          {/* The purpose — Consistency · Reflection · Connection */}
          <div className="w-full max-w-2xl grid sm:grid-cols-3 gap-3 mt-1">
            {[
              { name: 'Consistency', body: 'Show up, set your schedule, and build a streak.' },
              { name: 'Reflection', body: 'Journal what you drilled and what to work on.' },
              { name: 'Connection', body: 'Find your people and learn from those ahead of you.' },
            ].map(p => (
              <div key={p.name} className="border border-smoke bg-paper p-4 text-center">
                <p className="font-display text-sm font-bold uppercase tracking-widest text-brand-red mb-1">{p.name}</p>
                <p className="text-slate text-xs leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
          <Link href="/ethos" className="text-slate hover:text-ink text-xs transition-colors -mt-1">
            Why it was built →
          </Link>

          <div className="flex gap-3 flex-wrap justify-center">
            <Link
              href="/register"
              className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors"
            >
              Join now
            </Link>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Link href="/tour/member" className="text-slate hover:text-ink text-sm transition-colors">
              See how it works →
            </Link>
            <Link href="/login" className="text-ash hover:text-slate text-xs transition-colors">
              Already have an account? Sign in →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-ink-soft">
        <div className="max-w-6xl mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              label: 'Build Consistency',
              body: 'Set the days you commit to train and check them off to keep a streak going.',
            },
            {
              label: 'Connect with Your People',
              body: 'Public forums and private group chats with teammates — in your gym or beyond. Share photos and find open mats.',
            },
            {
              label: 'Reflect & Grow',
              body: 'Journal your sessions, set goals, and find a private instructor to learn from.',
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
