import { MockBelt } from '@/app/components/tour/MockBelt'
import { PageHead, Label, Card, PrimaryBtn, GhostBtn, Avatar } from './primitives'

export function IDashboard() {
  const sessions = [
    { t: '6:00 AM', n: 'Morning No-Gi', reg: 8, chk: 3 },
    { t: '12:00 PM', n: 'Fundamentals', reg: 12, chk: 0 },
    { t: '6:30 PM', n: 'Advanced Gi', reg: 15, chk: 0 },
  ]
  return (
    <div>
      <PageHead kicker="Instructor" title="Today's classes" />
      <div data-tour="inst-upcoming" className="flex flex-col gap-3">
        {sessions.map((s) => (
          <Card key={s.n} className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-ink">{s.n}</p><p className="text-xs text-slate">{s.t}</p></div>
            <div className="text-right"><p className="text-sm text-ink">{s.reg} registered</p><p className="text-xs text-brand-red">{s.chk} checked in</p></div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function IAvailability() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return (
    <div>
      <PageHead kicker="Availability" title="Private lesson windows" />
      <Card data-tour="availability-grid">
        <Label>This week</Label>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => (
            <div key={d} className="text-center">
              <p className="text-xs text-slate mb-1">{d}</p>
              <div className={`h-12 border border-smoke ${[0, 2, 5].includes(i) ? 'bg-brand-red/20' : ''}`} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 border border-smoke px-3 py-2">
          <span className="text-sm text-ink">Accept requests from outside my gym</span>
          <span className="w-8 h-4 rounded-full bg-brand-red relative"><span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-paper" /></span>
        </div>
      </Card>
    </div>
  )
}

export function IInbox() {
  const reqs = [
    { who: 'Jordan Lee', topic: 'Leg lock defense', when: 'Sat 10:00 AM', status: 'New' },
    { who: 'Alex Rivera', topic: 'Guard passing', when: 'Sun 9:00 AM', status: 'Confirmed' },
  ]
  return (
    <div>
      <PageHead kicker="Private Lessons" title="Requests" />
      <Card data-tour="lesson-request" className="p-0 divide-y divide-smoke">
        {reqs.map((r) => (
          <div key={r.who} className="flex items-center gap-3 px-4 py-3">
            <Avatar initials={r.who.split(' ').map((p) => p[0]).join('')} />
            <div className="flex-1"><p className="text-sm font-medium text-ink">{r.who} · {r.topic}</p><p className="text-xs text-slate">{r.when}</p></div>
            {r.status === 'New' ? <PrimaryBtn>Confirm</PrimaryBtn> : <GhostBtn>Message</GhostBtn>}
          </div>
        ))}
      </Card>
    </div>
  )
}

export function ISession() {
  const roster = [{ n: 'Jordan Lee', b: 'blue', in: true }, { n: 'Sam Chen', b: 'white', in: true }, { n: 'Alex Rivera', b: 'white', in: false }]
  return (
    <div>
      <PageHead kicker="Session" title="Advanced Gi — 6:30 PM" />
      <div className="flex gap-2 mb-3">
        <span data-tour="push-students"><GhostBtn>Push to committed</GhostBtn></span>
        <span data-tour="release-session"><GhostBtn>Release / sub out</GhostBtn></span>
      </div>
      <Card data-tour="attendance-mark" className="p-0 divide-y divide-smoke mb-4">
        {roster.map((r) => (
          <div key={r.n} className="flex items-center gap-3 px-4 py-3">
            <MockBelt belt={r.b} />
            <span className="flex-1 text-sm text-ink">{r.n}</span>
            <span className={`text-xs px-2 py-0.5 ${r.in ? 'bg-brand-red text-paper' : 'border border-smoke text-steel'}`}>{r.in ? 'Present' : 'Mark present'}</span>
          </div>
        ))}
      </Card>
      <Card><Label>Session notes</Label><p className="text-sm text-slate">Public note (students see) or private staff note.</p></Card>
    </div>
  )
}

export function INotes() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label>Student notes</Label>
        <Card><p className="text-sm text-ink mb-1">Jordan Lee</p><p className="text-sm text-slate">Strong guard; work on takedown defense. Prepping for March comp.</p></Card>
      </div>
      <div>
        <Label>Lesson plans</Label>
        <Card data-tour="lesson-plan">
          <p className="text-sm font-medium text-ink mb-1">Back Attacks — Week 3</p>
          <ul className="text-sm text-slate list-disc pl-4"><li>Harness control</li><li>Hook retention</li><li>RNC finishing details</li></ul>
        </Card>
      </div>
    </div>
  )
}

export function IForum() {
  return (
    <div className="max-w-lg mx-auto">
      <PageHead kicker="Instructor Forum" title="Staff only" />
      <Card data-tour="inst-forum" className="flex flex-col gap-3">
        <div><p className="text-sm font-medium text-ink">Marcus · 2 days ago</p><p className="text-sm text-slate">Let's align the no-gi curriculum for next month — leg entanglements block.</p></div>
        <div className="border-t border-smoke pt-3"><p className="text-sm font-medium text-ink">Dana · 1 day ago</p><p className="text-sm text-slate">Agreed. I'll prep the ashi garami progression.</p></div>
      </Card>
      <p className="text-xs text-slate mt-2">Hidden from students.</p>
    </div>
  )
}

export function IReviews() {
  const reviews = [
    { who: 'Jordan Lee', stars: 5, text: 'Incredible detail on back attacks. Best private I’ve had.' },
    { who: 'Alex Rivera', stars: 5, text: 'Patient and clear. Cleaned up my guard passing.' },
  ]
  return (
    <div className="max-w-lg mx-auto">
      <PageHead kicker="Reviews" title="★ 4.9 · 23 reviews" />
      <div className="flex flex-col gap-3">
        {reviews.map((r, i) => (
          <Card key={r.who} data-tour={i === 0 ? 'review-card' : undefined}>
            <div className="flex items-center justify-between mb-1"><p className="text-sm font-medium text-ink">{r.who}</p><span className="text-brand-red text-sm">{'★'.repeat(r.stars)}</span></div>
            <p className="text-sm text-slate">{r.text}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function IProvider() {
  return (
    <div className="max-w-lg mx-auto">
      <PageHead kicker="Private Instructor" title="Teach beyond one gym" />
      <Card data-tour="provider-apply" className="flex flex-col gap-3">
        <p className="text-sm text-slate">Apply to teach privates independently. A verified black belt reviews your application; once approved you’re discoverable to students searching your area.</p>
        <div className="border border-smoke p-3 text-sm text-ink">Status: <span className="text-brand-red font-medium">Not applied</span></div>
        <div className="border border-smoke p-3 text-sm text-ink">City: Arlington, VA · Radius search enabled</div>
        <PrimaryBtn>Apply as provider</PrimaryBtn>
      </Card>
    </div>
  )
}
