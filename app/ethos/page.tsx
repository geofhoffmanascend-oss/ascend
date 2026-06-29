import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Ethos',
  description: 'The thinking behind AscendIt — why it was built, and what it is for.',
}

const PILLARS = [
  {
    name: 'Consistency',
    tool: 'Schedule & Streaks',
    body: `Progress is invisible day to day — you can't feel yourself improving on a Tuesday. So you return, and return again. Each session is another angle on the same problem. Showing up isn't discipline for its own sake; it's how you gather the looks a single visit can never give you.`,
  },
  {
    name: 'Reflection',
    tool: 'The Journal',
    body: `What you've already lived is the material you reason from. A short, honest entry — what worked, what didn't, what you're chasing — is worth little on its own and a great deal in aggregate. Read back over months, your journal is the record of every angle you've seen, and proof of a climb too slow to feel in the moment.`,
  },
  {
    name: 'Connection',
    tool: 'Forums, Chats & Lessons',
    body: `The fastest way to understand something you can't yet reach is to borrow the view of someone already standing there. A good coach has been where you're going. Sharing your reflections turns a private note into a precise request for help; messaging and group chats are how you seek out good teachers and good technique, inside your gym and beyond it.`,
  },
]

export default function EthosPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <Image src="/logo.png" alt="AscendIt" width={72} height={72} className="object-contain mb-4" />
        <span className="inline-block bg-brand-red px-3 py-1 font-display text-xs font-bold tracking-widest uppercase text-paper mb-3">
          The Ethos of AscendIt
        </span>
        <h1 className="font-display text-2xl text-ink">The Ascent</h1>
        <p className="mt-2 text-base text-slate font-medium">Why AscendIt was built, and what it is for.</p>
      </div>

      {/* Essay */}
      <div className="border border-smoke bg-paper p-6 mb-6 flex flex-col gap-4">
        <p className="text-sm text-slate leading-relaxed">
          Throughout life you climb many mountains. Standing at the base, you can only ever see one
          side. Every major pursuit begins the same way — with only a partial view of the path
          ahead.
        </p>
        <p className="text-sm text-slate leading-relaxed">
          Like an iceberg seen from the deck of a ship, it is only when you dive in that you truly
          begin to comprehend its full depth. What shows above the surface is never the whole of it —
          a guard you've never had to pass, a person you've just met, an idea you were sure you
          understood. The whole is always larger than the part in front of you.
        </p>
        <p className="text-sm text-slate leading-relaxed">
          Improvement — at jiu-jitsu, or at anything — isn't seeing all of it at once. No one does
          that. It's learning to picture the parts you can't yet see accurately enough that your
          model of a thing starts to match what's really there. You draw on what you've seen before,
          take in something new, and connect the two into an understanding wider than your line of
          sight.
        </p>
        <p className="text-sm text-slate leading-relaxed">
          That is the entire purpose of this app. Three habits, three ways of seeing more than the
          one side in front of you.
        </p>
      </div>

      {/* Three pillars */}
      <div className="flex flex-col gap-3 mb-6">
        {PILLARS.map((p) => (
          <div key={p.name} className="border border-smoke bg-paper p-6">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <h2 className="font-display text-lg text-ink">{p.name}</h2>
              <span className="text-xs font-bold uppercase tracking-widest text-steel shrink-0">{p.tool}</span>
            </div>
            <p className="text-sm text-slate leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>

      {/* Close */}
      <div className="border border-smoke bg-paper p-6 mb-8">
        <p className="text-sm text-ink leading-relaxed font-medium">
          Look again, remember what you've seen, borrow what you haven't — and the picture sharpens.
          That sharpening is the ascent. AscendIt wasn't built to track your training; it was built
          to help you understand it.
        </p>
      </div>

      {/* Links */}
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/register"
          className="px-5 py-2.5 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors"
        >
          Get Started
        </Link>
        <Link
          href="/about"
          className="px-5 py-2.5 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
        >
          About the App
        </Link>
      </div>
    </main>
  )
}
