import { MockBelt } from '@/app/components/tour/MockBelt'
import { ADMIN_TOUR_STUDENTS, ADMIN_STATS } from '@/lib/tourData'
import { PageHead, Label, Card, PrimaryBtn, GhostBtn, Avatar } from './primitives'

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <Card className="text-center">
      <p className="font-display text-3xl text-ink">{n}</p>
      <p className="text-xs text-slate mt-1">{label}</p>
    </Card>
  )
}

export function GDashboard() {
  return (
    <div>
      <PageHead kicker="Admin" title="Ascend Jiu-Jitsu" />
      <div data-tour="admin-counters" className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat n={ADMIN_STATS.totalStudents} label="Members" />
        <Stat n={ADMIN_STATS.sessionsThisWeek} label="Sessions this week" />
        <Stat n={ADMIN_STATS.checkInsToday} label="Check-ins today" />
        <Stat n={ADMIN_STATS.newSignupsThisMonth} label="New this month" />
      </div>
      <Card>
        <Label>Finish setting up</Label>
        <div className="flex flex-col gap-1 text-sm text-ink">
          <p>✓ Gym profile created</p>
          <p>✓ Classes added</p>
          <p className="text-slate">○ Invite your members</p>
          <p className="text-slate">○ Publish a review link</p>
        </div>
      </Card>
    </div>
  )
}

export function GSettings() {
  const toggles = ['Store', 'Gallery', 'Tournaments', 'Events', 'Private Lessons', 'Challenge Hosting']
  return (
    <div className="max-w-lg mx-auto">
      <PageHead kicker="Gym Settings" title="Profile & features" />
      <Card className="mb-4"><Label>Identity</Label><p className="text-sm text-slate">Name, logo, description, public review URL.</p></Card>
      <Card data-tour="gym-toggles">
        <Label>Feature toggles</Label>
        <div className="grid grid-cols-2 gap-2">
          {toggles.map((t, i) => (
            <div key={t} className="flex items-center justify-between border border-smoke px-3 py-2">
              <span className="text-sm text-ink">{t}</span>
              <span className={`w-8 h-4 rounded-full ${i % 3 ? 'bg-brand-red' : 'bg-smoke'} relative`}>
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-paper ${i % 3 ? 'right-0.5' : 'left-0.5'}`} />
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function GMembers() {
  return (
    <div>
      <PageHead kicker="Members" title="Roster" />
      <Card className="p-0 divide-y divide-smoke">
        {ADMIN_TOUR_STUDENTS.map((s, i) => (
          <div key={s.name} data-tour={i === 0 ? 'member-row' : undefined} className="flex items-center gap-3 px-4 py-3">
            <Avatar initials={s.name.split(' ').map((n) => n[0]).join('')} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">{s.name}</p>
              <p className="text-xs text-slate">Joined {s.joined}</p>
            </div>
            <MockBelt belt={s.belt} />
            <span data-tour={i === 0 ? 'view-as' : undefined}><GhostBtn>View As</GhostBtn></span>
          </div>
        ))}
      </Card>
    </div>
  )
}

export function GClasses() {
  return (
    <div className="max-w-lg mx-auto">
      <PageHead kicker="Classes" title="Programs & schedule" />
      <Card data-tour="class-wizard" className="flex flex-col gap-3">
        <Label>Class wizard</Label>
        <div className="border border-smoke p-3 text-sm text-ink">Program: <span className="font-medium">Fundamentals</span></div>
        <div className="border border-smoke p-3 text-sm text-ink">Days: Mon · Wed · Fri</div>
        <div className="border border-smoke p-3 text-sm text-ink">Time: 6:00 PM · Instructor: Marcus</div>
        <PrimaryBtn>Create sessions</PrimaryBtn>
      </Card>
    </div>
  )
}

export function GAttendance() {
  const rows = [{ g: 'Grappling', v: 84 }, { g: 'Striking', v: 41 }, { g: 'Kids', v: 67 }, { g: 'Competition', v: 23 }]
  return (
    <div>
      <PageHead kicker="Attendance" title="Reports" />
      <div className="flex gap-2 mb-3 text-xs">
        {['By group', 'By instructor', 'By member'].map((v, i) => (
          <span key={v} className={`px-3 py-1 ${i === 0 ? 'bg-ink text-paper' : 'border border-smoke text-steel'}`}>{v}</span>
        ))}
      </div>
      <Card data-tour="attendance-report" className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.g}>
            <div className="flex justify-between text-sm text-ink mb-1"><span>{r.g}</span><span>{r.v}%</span></div>
            <div className="h-2 bg-mist"><div className="h-2 bg-brand-red" style={{ width: `${r.v}%` }} /></div>
          </div>
        ))}
      </Card>
    </div>
  )
}

export function GForumMod() {
  const forums = ['Announcements', 'Fundamentals Program', 'Competition Team', 'Kids Class']
  return (
    <div>
      <PageHead kicker="Forums" title="Moderation" />
      <Card data-tour="forum-mod" className="p-0 divide-y divide-smoke">
        {forums.map((f) => (
          <div key={f} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-ink">{f}</span>
            <div className="flex gap-2"><GhostBtn>Pin</GhostBtn><GhostBtn>Delete</GhostBtn></div>
          </div>
        ))}
      </Card>
      <div className="mt-3"><PrimaryBtn>Create forum</PrimaryBtn></div>
    </div>
  )
}

export function GInvites() {
  return (
    <div className="max-w-lg mx-auto">
      <PageHead kicker="Invitations" title="Grow your roster" />
      <Card className="mb-4 flex items-center justify-between"><div><Label>Single invite</Label><p className="text-sm text-slate">Share a link or QR code.</p></div><GhostBtn>Copy link</GhostBtn></Card>
      <Card data-tour="invite-bulk">
        <Label>Bulk import</Label>
        <p className="text-sm text-slate mb-2">Upload a CSV → map columns → preview → import. New emails are auto-associated at signup.</p>
        <PrimaryBtn>Upload CSV</PrimaryBtn>
      </Card>
    </div>
  )
}

export function GTournaments() {
  return (
    <div className="max-w-lg mx-auto">
      <PageHead kicker="Tournaments" title="Run an event" />
      <Card data-tour="tournament-create" className="flex flex-col gap-3">
        <div className="border border-smoke p-3 text-sm text-ink">Spring In-House · Adult Gi</div>
        <div className="border border-smoke p-3 text-sm text-ink">3 divisions · 24 registered</div>
        <div className="flex gap-2"><PrimaryBtn>Generate brackets</PrimaryBtn><GhostBtn>Run on console</GhostBtn></div>
      </Card>
    </div>
  )
}

export function GChallenge() {
  return (
    <div className="max-w-lg mx-auto">
      <PageHead kicker="Challenge Hosting" title="Host matches" />
      <Card data-tour="challenge-host" className="flex flex-col gap-3">
        <div className="flex items-center justify-between border border-smoke px-3 py-2"><span className="text-sm text-ink">Host in-house challenges</span><span className="w-8 h-4 rounded-full bg-brand-red relative"><span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-paper" /></span></div>
        <div className="flex items-center justify-between border border-smoke px-3 py-2"><span className="text-sm text-ink">Accept open challenges</span><span className="w-8 h-4 rounded-full bg-smoke relative"><span className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-paper" /></span></div>
        <p className="text-sm text-slate">Publish a visitor waiver, then approve and run challenges on the live console.</p>
        <PrimaryBtn>Approve pending (2)</PrimaryBtn>
      </Card>
    </div>
  )
}

export function GStore() {
  const orders = [{ who: 'Alex Rivera', item: 'Academy Gi', status: 'Ready' }, { who: 'Morgan Davis', item: 'Rashguard', status: 'New' }]
  return (
    <div>
      <PageHead kicker="Store" title="Orders & products" />
      <Card data-tour="store-order" className="p-0 divide-y divide-smoke">
        {orders.map((o) => (
          <div key={o.who} className="flex items-center justify-between px-4 py-3">
            <div><p className="text-sm font-medium text-ink">{o.item}</p><p className="text-xs text-slate">{o.who}</p></div>
            <div className="flex items-center gap-2"><span className="text-xs px-2 py-0.5 bg-mist text-steel">{o.status}</span><GhostBtn>Mark picked up</GhostBtn></div>
          </div>
        ))}
      </Card>
    </div>
  )
}

export function GInstructors() {
  return (
    <div>
      <PageHead kicker="Instructors" title="Oversight" />
      <Card data-tour="instructor-approve" className="p-0 divide-y divide-smoke">
        {[{ n: 'Dana Kim', b: 'brown', s: 'Pending approval' }, { n: 'Marcus Silva', b: 'black', s: 'Active' }].map((x) => (
          <div key={x.n} className="flex items-center gap-3 px-4 py-3">
            <Avatar initials={x.n.split(' ').map((p) => p[0]).join('')} />
            <div className="flex-1"><p className="text-sm font-medium text-ink">{x.n}</p><p className="text-xs text-slate">{x.s}</p></div>
            <MockBelt belt={x.b} />
            {x.s === 'Pending approval' ? <PrimaryBtn>Approve</PrimaryBtn> : <GhostBtn>Manage</GhostBtn>}
          </div>
        ))}
      </Card>
    </div>
  )
}
