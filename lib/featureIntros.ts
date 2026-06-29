// Public-launch pivot — short explainers shown the first time (and each time, until the
// user picks "don't show this again") they open a feature page. Keyed by a stable featureKey.
// Copy mirrors the member tour so the two stay consistent.

export type FeatureIntro = { title: string; body: string }

export const FEATURE_INTROS: Record<string, FeatureIntro> = {
  'my-training': {
    title: 'My Training',
    body: 'Make a schedule of the days you commit to train, then check each off as you go. It builds a consistency streak — no gym required.',
  },
  feed: {
    title: 'Your Feed',
    body: 'Posts from the people you follow show up here, so you stay in the loop between sessions.',
  },
  forums: {
    title: 'Forums',
    body: 'Public forums for your gym and the wider community (like DMV Jiu-Jitsu). Post questions, share technique, and subscribe to the ones you care about.',
  },
  chats: {
    title: 'Group Chats',
    body: 'Start a private group chat with teammates. Any member can invite others — including people from other gyms — and you can share photos right in the chat.',
  },
  lessons: {
    title: 'Private Lessons',
    body: 'Find an instructor near you, see their availability, and request a private. Message inside the thread and leave a review once it’s done.',
  },
  journal: {
    title: 'Training Journal',
    body: 'Log every session — free-form or with guided prompts for technique, conditioning and goals. Private by default; share an entry with a coach when you want feedback.',
  },
  events: {
    title: 'Events',
    body: 'A calendar of seminars, open mats and competitions — including events near you.',
  },
  challenges: {
    title: 'Challenge Matches',
    body: 'A friendly way to test yourself against a teammate. Propose terms, both sign a quick release, then run it on a live scoreboard. Wins and losses feed your record.',
  },
  gallery: {
    title: 'Gallery',
    body: 'Browse and share photos, tag teammates, follow #hashtags, and view albums as a slideshow.',
  },
  store: {
    title: 'Gear Store',
    body: 'Order gear and pay at pickup. Selling merch? Apply to be a vendor and sell your gear in the store.',
  },
  profile: {
    title: 'Your Profile',
    body: 'Your training identity: belt, bio, goals and competition history. Each field has a privacy control — public, members-only, or private.',
  },
  settings: {
    title: 'Settings',
    body: 'Control notifications, your home gym, schedule visibility, and replay the product tour anytime.',
  },
}

export function getFeatureIntro(key: string): FeatureIntro | null {
  return FEATURE_INTROS[key] ?? null
}
