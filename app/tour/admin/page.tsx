import Link from 'next/link'
import { TourHeader } from '@/app/components/tour/TourHeader'
import { MockBelt } from '@/app/components/tour/MockBelt'
import { ADMIN_TOUR_STUDENTS } from '@/lib/tourData'
import { RosterDemo } from './RosterDemo'
import { FeedbackDemo } from './FeedbackDemo'
import { StatsDemo } from './StatsDemo'
import { ScheduleAdminDemo } from './ScheduleAdminDemo'
import { ForumAdminDemo } from './ForumAdminDemo'

export const metadata = { title: 'For Gym Owners' }

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

const samStudent = ADMIN_TOUR_STUDENTS[2]

export default function AdminTourPage() {
  return (
    <div className="bg-ink min-h-full">
      <TourHeader variant="admin" />

      {/* Hero */}
      <div className="pt-14 bg-ink-soft border-b border-steel/30">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-6">
          <span className="inline-block bg-brand-red px-3 py-1">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">For Gym Owners</span>
          </span>
          <h1 className="font-display text-paper max-w-2xl">Run a smarter academy</h1>
          <p className="text-ash text-lg max-w-xl leading-relaxed">
            AscendIt gives you full visibility into your students, schedule, and community — without the spreadsheets.
          </p>
          <a href="mailto:hello@ascendit.app" className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors">
            Request a Demo
          </a>
        </div>
      </div>

      {/* Section 1: Student Onboarding */}
      <SectionWrapper>
        <TextBlock
          num="01 / Onboarding"
          headline="Know your students from day one"
          subtext="When a new student joins, they complete an onboarding reflection — why they started, their challenges, their goals. You see all of it from day one."
        />
        <MockPanel>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-steel flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-paper text-sm">SC</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-paper">{samStudent.name}</p>
                  <span className="text-xs px-1.5 py-0.5 bg-brand-red/20 text-brand-red font-bold">New</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <MockBelt belt={samStudent.belt} />
                  <span className="text-xs text-ash">Joined {samStudent.joined}</span>
                </div>
              </div>
            </div>
            <div className="border border-smoke/20 bg-ink-soft/60 rounded-lg p-3 animate-slide-in">
              <p className="text-xs font-bold uppercase tracking-widest text-slate mb-2">Onboarding Reflection</p>
              <p className="text-sm text-ash leading-relaxed animate-slide-in" style={{ animationDelay: '0.1s' }}>
                {samStudent.reflection}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {ADMIN_TOUR_STUDENTS.slice(0, 2).map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-smoke/10">
                  <div className="w-7 h-7 rounded-full bg-steel flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-paper">{s.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-paper truncate">{s.name}</p>
                    <p className="text-xs text-ash truncate">{s.reflection.slice(0, 50)}…</p>
                  </div>
                  <MockBelt belt={s.belt} />
                </div>
              ))}
            </div>
          </div>
        </MockPanel>
      </SectionWrapper>

      {/* Section 2: Schedule & Instructors */}
      <SectionWrapper flip>
        <TextBlock
          num="02 / Schedule"
          headline="Full visibility into every session"
          subtext="See all scheduled classes, manage substitution requests, and track instructor-led private lessons — all from one dashboard."
        />
        <MockPanel>
          <ScheduleAdminDemo />
        </MockPanel>
      </SectionWrapper>

      {/* Section 3: Attendance */}
      <SectionWrapper>
        <TextBlock
          num="03 / Attendance"
          headline="Real-time attendance, zero paperwork"
          subtext="Instructors mark attendance from their phone. Students who check in via the app are logged automatically. Filter reports by class, instructor, or student."
        />
        <MockPanel>
          <RosterDemo />
        </MockPanel>
      </SectionWrapper>

      {/* Section 4: Feedback */}
      <SectionWrapper flip>
        <TextBlock
          num="04 / Feedback"
          headline="Hear directly from your students"
          subtext="After every class, students can leave feedback. You see sentiment trends, specific responses, and flagged concerns — so you can catch problems early and recognize what's working."
        />
        <MockPanel>
          <FeedbackDemo />
        </MockPanel>
      </SectionWrapper>

      {/* Section 5: Communication */}
      <SectionWrapper>
        <TextBlock
          num="05 / Communication"
          headline="Total visibility into communication"
          subtext="Monitor forums, moderate posts, and see direct messages between instructors and students. Pin important announcements with one click."
        />
        <MockPanel>
          <ForumAdminDemo />
        </MockPanel>
      </SectionWrapper>

      {/* Section 6: Dashboard */}
      <SectionWrapper flip>
        <TextBlock
          num="06 / Dashboard"
          headline="Your gym at a glance"
          subtext="Real-time counters for students, sessions, check-ins, and signups. Know your gym's pulse without leaving your desk."
        />
        <MockPanel>
          <StatsDemo />
        </MockPanel>
      </SectionWrapper>

      {/* Final CTA */}
      <section className="bg-ink-soft border-t border-steel/30">
        <div className="max-w-2xl mx-auto px-4 py-24 text-center flex flex-col items-center gap-6">
          <h2 className="font-display text-paper">Run a smarter gym.</h2>
          <p className="text-ash text-lg leading-relaxed">
            AscendIt gives your instructors the tools and your students the experience they expect from a world-class academy.
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <a href="mailto:hello@ascendit.app" className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors">
              Request a Demo
            </a>
            <Link href="/tour" className="px-6 py-3 border border-steel text-ash text-sm font-medium hover:border-paper hover:text-paper transition-colors">
              See the Student Tour →
            </Link>
          </div>
          <p className="text-paper/40 text-xs mt-2">Demo form will be wired to email API in a future update.</p>
        </div>
      </section>
    </div>
  )
}
