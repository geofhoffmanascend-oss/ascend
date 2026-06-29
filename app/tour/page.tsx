import Link from 'next/link'
import { TourHeader } from '@/app/components/tour/TourHeader'
import { AnimatedChat } from '@/app/components/tour/AnimatedChat'
import { MockBelt } from '@/app/components/tour/MockBelt'
import { ScheduleDemo } from './ScheduleDemo'
import { CheckInDemo } from './CheckInDemo'
import { ForumDemo } from './ForumDemo'
import { JournalDemo } from './JournalDemo'
import { TOUR_DM_CONVERSATION, PERSONAS } from '@/lib/tourData'

export const metadata = { title: 'How It Works' }

const dmMessages = TOUR_DM_CONVERSATION.map(msg => ({
  from: msg.from,
  text: msg.text,
  side: (msg.from === 'jordan' ? 'right' : 'left') as 'left' | 'right',
  initials: msg.from === 'jordan' ? PERSONAS.jordan.initials : PERSONAS.marcus.initials,
  belt: msg.from === 'jordan' ? PERSONAS.jordan.belt : PERSONAS.marcus.belt,
}))

function SectionWrapper({ children, flip = false }: { children: React.ReactNode; flip?: boolean }) {
  return (
    <section className="min-h-screen flex items-center border-b border-steel/20">
      <div className={`max-w-6xl mx-auto px-4 py-24 w-full flex flex-col ${flip ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}>
        {children}
      </div>
    </section>
  )
}

function TextBlock({
  num, headline, subtext, cta,
}: {
  num: string; headline: string; subtext: string; cta?: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col gap-5 md:max-w-sm flex-shrink-0">
      <span className="text-xs font-bold uppercase tracking-widest text-brand-red">{num}</span>
      <h2 className="font-display text-paper">{headline}</h2>
      <p className="text-ash leading-relaxed">{subtext}</p>
      {cta && (
        <Link href={cta.href} className="text-paper/70 text-sm hover:text-paper transition-colors self-start">
          {cta.label}
        </Link>
      )}
    </div>
  )
}

function MockPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full md:max-w-[480px] flex-shrink-0 border border-smoke/30 bg-ink rounded-lg overflow-hidden shadow-2xl">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-smoke/20 bg-ink-soft/50">
        <span className="w-2.5 h-2.5 rounded-full bg-steel/40" />
        <span className="w-2.5 h-2.5 rounded-full bg-steel/40" />
        <span className="w-2.5 h-2.5 rounded-full bg-steel/40" />
      </div>
      {children}
    </div>
  )
}

export default function TourPage() {
  return (
    <div className="bg-ink min-h-full">
      <TourHeader variant="student" />

      {/* Hero */}
      <div className="pt-14 bg-ink-soft border-b border-steel/30">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-6">
          <span className="inline-block bg-brand-red px-3 py-1">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">How It Works</span>
          </span>
          <h1 className="font-display text-paper max-w-2xl">Your complete Jiu-Jitsu training companion built for students, instructors, and gym administration.</h1>
          <p className="text-ash text-lg max-w-xl leading-relaxed">
            From your first class to your black belt — AscendIt is built for the whole journey.
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <Link href="/register" className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors">
              Start for Free
            </Link>
            <Link href="/tour/member" className="px-6 py-3 border border-steel text-ash text-sm font-medium hover:border-paper hover:text-paper transition-colors">
              Take the interactive tour →
            </Link>
          </div>
        </div>
      </div>

      {/* Section 1: Schedule */}
      <SectionWrapper>
        <TextBlock
          num="01 / Schedule"
          headline="Register for classes in seconds"
          subtext="Browse the weekly schedule, see who's registered, and claim your spot with one click. Private lesson requests go through the same simple flow."
          cta={{ label: 'View sample schedule →', href: '/register' }}
        />
        <MockPanel>
          <ScheduleDemo />
        </MockPanel>
      </SectionWrapper>

      {/* Section 2: Check-In */}
      <SectionWrapper flip>
        <TextBlock
          num="02 / Check-In"
          headline="Check in from your phone"
          subtext="A check-in button appears on your dashboard when class is near. Or show your QR code at the door. Either way, your attendance logs automatically."
          cta={{ label: 'Start your free account →', href: '/register' }}
        />
        <MockPanel>
          <CheckInDemo />
        </MockPanel>
      </SectionWrapper>

      {/* Section 3: Forum */}
      <SectionWrapper>
        <TextBlock
          num="03 / Forum"
          headline="Stay connected between classes"
          subtext="Each class has its own forum. Post questions, share technique videos, and get answers from your instructors and training partners."
        />
        <MockPanel>
          <ForumDemo />
        </MockPanel>
      </SectionWrapper>

      {/* Section 4: Direct Messages */}
      <SectionWrapper flip>
        <TextBlock
          num="04 / Messages"
          headline="Message your coaches directly"
          subtext="Send a message to any instructor. Request private lessons, ask technique questions, or coordinate training goals — all in one place."
        />
        <MockPanel>
          <AnimatedChat messages={dmMessages} delayMs={900} />
        </MockPanel>
      </SectionWrapper>

      {/* Section 5: Journal */}
      <SectionWrapper>
        <TextBlock
          num="05 / Journal"
          headline="Document every session"
          subtext="Log what you drilled, what clicked, and what to work on. Guided prompts help you reflect on technique, conditioning, and goals. Every entry is private by default."
        />
        <MockPanel>
          <JournalDemo />
        </MockPanel>
      </SectionWrapper>

      {/* Section 6: Profile */}
      <SectionWrapper flip>
        <TextBlock
          num="06 / Profile"
          headline="Your public training identity"
          subtext="Your profile shows your belt, bio, competition history, and training reflections. Share it with training partners, coaches, or post it publicly — you control what's visible."
        />
        <MockPanel>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-steel flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-paper">JL</span>
              </div>
              <div>
                <p className="font-bold text-paper">Jordan Lee</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <MockBelt belt="blue" />
                  <span className="text-xs text-ash">Blue Belt · 3 stripes</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-ash leading-relaxed border-l-2 border-steel/40 pl-3">
              Training Jiu-Jitsu for 2 years. Competing locally, focused on building a technical guard game.
            </p>
            <div className="border border-smoke/20 bg-ink-soft/50 rounded p-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate mb-1">Competition</p>
              <p className="text-sm text-paper">Regional Open — Blue Belt, 1st Place</p>
              <p className="text-xs text-ash">March 2026</p>
            </div>
            <div className="border border-smoke/20 bg-ink-soft/50 rounded p-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate mb-1">Training Reflection</p>
              <p className="text-sm text-ash leading-relaxed">Working on back retention. The hip escape is finally starting to feel natural under pressure.</p>
            </div>
            <button className="w-full py-2.5 border border-brand-red text-brand-red text-sm font-bold tracking-wide animate-pulse-glow hover:bg-brand-red hover:text-paper transition-colors">
              Share Profile
            </button>
          </div>
        </MockPanel>
      </SectionWrapper>

      {/* Final CTA */}
      <section className="bg-ink-soft border-t border-steel/30">
        <div className="max-w-2xl mx-auto px-4 py-24 text-center flex flex-col items-center gap-6">
          <h2 className="font-display text-paper">Ready to level up your training?</h2>
          <p className="text-ash text-lg">Join AscendIt and take control of your Jiu-Jitsu journey.</p>
          <div className="flex gap-3 flex-wrap justify-center">
            <Link href="/register" className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors">
              Create Free Account
            </Link>
            <Link href="/login" className="px-6 py-3 border border-steel text-ash text-sm font-medium hover:border-paper hover:text-paper transition-colors">
              Sign In
            </Link>
          </div>
          <div className="flex gap-4 flex-wrap justify-center mt-2">
            <Link href="/tour/admin" className="text-paper/50 hover:text-paper/80 text-xs transition-colors">
              Managing a gym? See the gym owner tour →
            </Link>
            <Link href="/tour/instructor" className="text-paper/50 hover:text-paper/80 text-xs transition-colors">
              Teaching? See the instructor tour →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
