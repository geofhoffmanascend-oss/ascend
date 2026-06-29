import { MockBelt } from '@/app/components/tour/MockBelt'
import {
  TOUR_SCHEDULE, TOUR_FORUM_POSTS, TOUR_DM_CONVERSATION, TOUR_JOURNAL, PERSONAS,
} from '@/lib/tourData'
import { PageHead, Label, Card, PrimaryBtn, GhostBtn, Avatar } from './primitives'

export function MDashboard() {
  return (
    <div>
      <PageHead kicker="Dashboard" title="Welcome back, Sam" />
      <div className="grid md:grid-cols-3 gap-4">
        <Card data-tour="dash-week" className="md:col-span-2">
          <Label>This Week</Label>
          <div className="flex flex-col gap-2">
            {TOUR_SCHEDULE.slice(0, 3).map((c) => (
              <div key={c.title} className="flex items-center justify-between py-2 border-b border-smoke last:border-0">
                <div>
                  <p className="text-sm font-medium text-ink">{c.title}</p>
                  <p className="text-xs text-slate">{c.time} · {c.instructor}</p>
                </div>
                <MockBelt belt="white" />
              </div>
            ))}
          </div>
        </Card>
        <div className="flex flex-col gap-4">
          <Card><Label>Streak</Label><p className="font-display text-3xl text-brand-red">5</p><p className="text-xs text-slate">classes in a row</p></Card>
          <Card><Label>Recent Journal</Label><p className="text-sm text-ink">{TOUR_JOURNAL.title}</p></Card>
        </div>
      </div>
    </div>
  )
}

export function MSchedule() {
  const days = [
    { day: 'Mon', label: 'Evening Gi', time: '6:00 PM', done: true },
    { day: 'Wed', label: 'No-Gi', time: '6:00 PM', done: true },
    { day: 'Fri', label: 'Open Mat', time: '12:00 PM', done: false },
    { day: 'Sat', label: 'Competition Class', time: '10:00 AM', done: false },
  ]
  return (
    <div>
      <PageHead kicker="My Training" title="My training week" />
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card><Label>Week streak</Label><p className="font-display text-2xl text-brand-red">5</p></Card>
        <Card><Label>This week</Label><p className="font-display text-2xl text-ink">2 / 4</p></Card>
      </div>
      <div className="flex flex-col gap-2">
        {days.map((d, i) => (
          <Card key={d.day} data-tour={i === 0 ? 'class-card' : undefined} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">{d.day} · {d.label}</p>
              <p className="text-xs text-slate">{d.time}</p>
            </div>
            {d.done
              ? <span className="text-sm font-bold text-brand-red">✓ Trained</span>
              : (i === 2 ? <PrimaryBtn>Check off</PrimaryBtn> : <GhostBtn>Check off</GhostBtn>)}
          </Card>
        ))}
      </div>
    </div>
  )
}

export function MCheckin() {
  return (
    <div className="max-w-md mx-auto text-center">
      <PageHead kicker="Check-In" title="Fundamentals — 12:00 PM" />
      <Card className="flex flex-col items-center gap-4 py-8">
        <div className="w-32 h-32 bg-ink grid grid-cols-5 grid-rows-5 gap-0.5 p-2">
          {Array.from({ length: 25 }).map((_, i) => (
            <span key={i} className={(i * 7) % 3 === 0 ? 'bg-paper' : 'bg-ink'} />
          ))}
        </div>
        <p className="text-xs text-slate">Show this QR at the door, or:</p>
        <span data-tour="checkin-btn"><PrimaryBtn>Check in now</PrimaryBtn></span>
        <p className="text-xs text-slate">Checking in logs your attendance and keeps your streak alive.</p>
      </Card>
    </div>
  )
}

export function MFeed() {
  return (
    <div className="max-w-lg mx-auto">
      <PageHead kicker="Feed" title="From people you follow" />
      <div className="flex flex-col gap-3">
        {TOUR_FORUM_POSTS.map((p, i) => (
          <Card key={i} data-tour={i === 0 ? 'feed-post' : undefined}>
            <div className="flex items-center gap-2 mb-2">
              <Avatar initials={p.author.slice(0, 2).toUpperCase()} />
              <div>
                <p className="text-sm font-medium text-ink">{p.author}</p>
                <p className="text-xs text-slate">{p.time}</p>
              </div>
              <span className="ml-auto"><MockBelt belt={p.belt} /></span>
            </div>
            <p className="text-sm text-ink leading-relaxed">{p.content}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function MForum() {
  const forums = ['Announcements', 'DMV Jiu-Jitsu (Public)', 'Fundamentals Program', 'No-Gi Group', 'Competition Team']
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-1">
        <Label>Forums</Label>
        <Card data-tour="forum-list" className="p-0 divide-y divide-smoke">
          {forums.map((f, i) => (
            <p key={f} className={`px-3 py-2 text-sm ${i === 0 ? 'text-brand-red font-medium' : 'text-ink'}`}>{f}</p>
          ))}
        </Card>
      </div>
      <div className="md:col-span-2">
        <Label>Announcements</Label>
        <div className="flex flex-col gap-3">
          {TOUR_FORUM_POSTS.slice(0, 2).map((p, i) => (
            <Card key={i}>
              <p className="text-sm font-medium text-ink mb-1">{p.author} · <span className="text-xs text-slate">{p.time}</span></p>
              <p className="text-sm text-ink leading-relaxed">{p.content}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export function MDM() {
  return (
    <div className="max-w-lg mx-auto">
      <PageHead kicker="Messages" title="Marcus Silva" />
      <Card data-tour="dm-thread" className="flex flex-col gap-3">
        {TOUR_DM_CONVERSATION.map((m, i) => {
          const mine = m.from === 'jordan'
          return (
            <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <span className={`max-w-[75%] px-3 py-2 text-sm rounded-lg ${mine ? 'bg-brand-red text-paper' : 'bg-mist text-ink'}`}>
                {m.text}
              </span>
            </div>
          )
        })}
        <div className="border border-smoke px-3 py-2 text-sm text-slate mt-1">Type a message…</div>
      </Card>
    </div>
  )
}

export function MProfile() {
  const p = PERSONAS.jordan
  return (
    <div className="max-w-lg mx-auto">
      <PageHead kicker="Profile" title="Your training identity" />
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar initials={p.initials} />
          <div className="flex-1">
            <p className="font-bold text-ink">{p.name}</p>
            <div className="flex items-center gap-2 mt-0.5"><MockBelt belt={p.belt} /><span className="text-xs text-slate">Blue · 3 stripes</span></div>
          </div>
          <span data-tour="follow-btn"><PrimaryBtn>Follow</PrimaryBtn></span>
        </div>
        <div data-tour="profile-privacy" className="border border-smoke p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink">Bio</p>
            <div className="flex gap-1 text-[10px]">
              <span className="px-1.5 py-0.5 bg-ink text-paper">Public</span>
              <span className="px-1.5 py-0.5 border border-smoke text-steel">Members</span>
              <span className="px-1.5 py-0.5 border border-smoke text-steel">Private</span>
            </div>
          </div>
          <p className="text-sm text-slate mt-1">Training 2 years. Building a technical guard game.</p>
        </div>
        <GhostBtn>Share profile link</GhostBtn>
      </Card>
    </div>
  )
}

export function MLessons() {
  const slots = ['Sat 10:00 AM', 'Sat 11:30 AM', 'Sun 9:00 AM', 'Tue 6:00 PM']
  return (
    <div className="max-w-lg mx-auto">
      <PageHead kicker="Private Lessons" title="Marcus Silva" />
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar initials="MS" />
          <div><p className="font-bold text-ink">Marcus Silva</p><p className="text-xs text-slate">Black belt · ★ 4.9 (23)</p></div>
        </div>
        <Label>Available slots</Label>
        <div className="grid grid-cols-2 gap-2">
          {slots.map((s, i) => (
            <span key={s} data-tour={i === 0 ? 'lesson-slot' : undefined}
              className={`text-sm px-3 py-2 text-center ${i === 0 ? 'bg-brand-red text-paper' : 'border border-smoke text-ink'}`}>{s}</span>
          ))}
        </div>
        <PrimaryBtn>Request lesson</PrimaryBtn>
      </Card>
    </div>
  )
}

export function MJournal() {
  const j = TOUR_JOURNAL
  return (
    <div className="max-w-lg mx-auto">
      <PageHead kicker="Journal" title="New entry" />
      <Card data-tour="journal-entry" className="flex flex-col gap-3">
        <div className="flex gap-2 text-xs">
          <span className="px-3 py-1 bg-ink text-paper">Guided</span>
          <span className="px-3 py-1 border border-smoke text-steel">Free-form</span>
          <span className="ml-auto px-3 py-1 border border-smoke text-steel">🔒 Private</span>
        </div>
        <div><Label>Technique</Label><p className="text-sm text-ink">{j.technique}</p></div>
        <div><Label>Goal</Label><p className="text-sm text-ink">{j.goal}</p></div>
        <div className="flex gap-6">
          <div><Label>Energy</Label><p className="text-sm text-ink">{j.energy}</p></div>
          <div><Label>Focus</Label><p className="text-sm text-ink">{j.focus}</p></div>
        </div>
      </Card>
    </div>
  )
}

export function MEvents() {
  const events = [
    { name: 'DMV Open Mat', where: 'Arlington, VA · 2.1 mi', when: 'Sat 11:00 AM' },
    { name: 'Gi Fundamentals Seminar', where: 'Bethesda, MD · 8 mi', when: 'Next Sun' },
    { name: 'Local Grappling Open', where: 'Fairfax, VA · 12 mi', when: 'Mar 22' },
  ]
  return (
    <div className="max-w-lg mx-auto">
      <PageHead kicker="Events" title="Near you" />
      <div className="flex flex-col gap-3">
        {events.map((e, i) => (
          <Card key={e.name} data-tour={i === 0 ? 'event-card' : undefined} className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-ink">{e.name}</p><p className="text-xs text-slate">{e.where}</p></div>
            <span className="text-xs text-brand-red font-medium">{e.when}</span>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function MTournaments() {
  const ts = [
    { name: 'Spring In-House Tournament', div: 'Adult · Gi', when: 'Mar 30', status: 'Registration open' },
    { name: 'No-Gi Summer Series', div: 'All belts', when: 'Jun 14', status: 'Coming soon' },
  ]
  return (
    <div className="max-w-lg mx-auto">
      <PageHead kicker="Tournaments" title="Compete" />
      <div className="flex flex-col gap-3">
        {ts.map((t, i) => (
          <Card key={t.name} data-tour={i === 0 ? 'tournament-card' : undefined}>
            <p className="text-sm font-medium text-ink">{t.name}</p>
            <p className="text-xs text-slate">{t.div} · {t.when}</p>
            <p className="text-xs text-brand-red font-medium mt-1">{t.status}</p>
          </Card>
        ))}
      </div>
      <div className="mt-4"><Label>Your record</Label><p className="font-display text-2xl text-ink">3W – 1L</p></div>
    </div>
  )
}

export function MChallenge() {
  return (
    <div className="max-w-lg mx-auto">
      <PageHead kicker="Challenge Match" title="Jordan Lee" />
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar initials="JL" />
          <div className="flex-1"><p className="font-bold text-ink">Jordan Lee</p><p className="text-xs text-slate">Blue · accepts challenges</p></div>
          <span data-tour="challenge-btn"><PrimaryBtn>Challenge</PrimaryBtn></span>
        </div>
        <div className="border border-smoke p-3 text-sm text-slate">
          Propose a ruleset and time → negotiate terms → both sign the waiver → a host gym approves → run it live on the scoreboard. The result feeds your competition record.
        </div>
        <p className="text-xs text-slate">Your record: <span className="text-ink font-medium">1W – 0L</span></p>
      </Card>
    </div>
  )
}

const GALLERY_CAPTIONS = ['Open mat', 'Belt promotion', 'Comp team', 'Seminar', 'Friday rolls', 'Kids class', 'Tournament', 'Team photo']

export function MGallery() {
  return (
    <div>
      <PageHead kicker="Gallery" title="Photos" />
      {/* Demo tiles stand in for jiu-jitsu stock photos — swap in real images for production. */}
      <div data-tour="gallery-grid" className="grid grid-cols-3 md:grid-cols-4 gap-2">
        {GALLERY_CAPTIONS.map((cap, i) => (
          <div
            key={cap}
            className="aspect-square border border-smoke relative overflow-hidden flex items-end"
            style={{ background: `linear-gradient(135deg, hsl(${(i * 47) % 360} 24% 32%), hsl(${(i * 47 + 70) % 360} 30% 20%))` }}
          >
            <span className="text-[9px] text-paper/90 bg-ink/40 px-1 py-0.5 w-full truncate">{cap}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate mt-3">Tag teammates, follow #hashtags, and view albums as a slideshow.</p>
    </div>
  )
}

export function MStore() {
  const products = [
    { name: 'Academy Gi — White', price: '$129' }, { name: 'Rashguard', price: '$45' },
    { name: 'Gym Tee', price: '$25' }, { name: 'Patch Set', price: '$15' },
  ]
  return (
    <div>
      <PageHead kicker="Store" title="Gear" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {products.map((p, i) => (
          <Card key={p.name} data-tour={i === 0 ? 'store-product' : undefined} className="flex flex-col gap-2">
            <div className="aspect-square bg-mist border border-smoke" />
            <p className="text-sm text-ink">{p.name}</p>
            <p className="text-sm font-bold text-ink">{p.price}</p>
            {i === 0 ? <PrimaryBtn>Add to cart</PrimaryBtn> : <GhostBtn>Add to cart</GhostBtn>}
          </Card>
        ))}
      </div>
      <p className="text-xs text-slate mt-3">Pay at pickup — you’re notified when your order is ready.</p>
      <div data-tour="store-vendor" className="mt-3 border border-brand-red/30 bg-brand-red/5 p-3">
        <p className="text-sm font-bold text-ink">Selling merch?</p>
        <p className="text-xs text-slate">Apply to be a vendor and sell your gear in the gear store.</p>
      </div>
    </div>
  )
}

export function MSettings() {
  return (
    <div className="max-w-lg mx-auto">
      <PageHead kicker="Settings" title="Preferences" />
      <div className="flex flex-col gap-4">
        <Card><Label>Push Notifications</Label><p className="text-sm text-slate">Check-in reminders, post-class feedback prompts, messages.</p></Card>
        <Card><Label>Home Gym & Schedule</Label><p className="text-sm text-slate">Pick your gym and which class groups show on your schedule.</p></Card>
        <Card data-tour="settings-replay" className="flex items-center justify-between">
          <div><Label>Product Tour</Label><p className="text-sm text-slate">Replay this walkthrough anytime.</p></div>
          <PrimaryBtn>Replay tour</PrimaryBtn>
        </Card>
      </div>
    </div>
  )
}
