import type { TourStep } from './types'

// Member (student) tour — 16 stops. Each `screen` is rendered by MockScreen;
// each `selector` targets a [data-tour] hook inside that screen's mock UI.
export const memberSteps: TourStep[] = [
  {
    screen: 'm-dashboard', selector: '[data-tour="dash-week"]', featureKey: 'dashboard',
    title: 'Your dashboard', placement: 'bottom',
    body: "This is home base. Your week's classes, your attendance streak, and recent journal + forum activity are all here at a glance.",
  },
  {
    screen: 'm-dashboard', selector: '[data-tour="nav-schedule"]', featureKey: 'schedule-nav',
    title: 'Get around', placement: 'bottom', mobileOpensNav: true,
    body: 'The top nav takes you everywhere — Schedule, Feed, Forums, Lessons and more. On a phone it tucks into the menu button.',
  },
  {
    screen: 'm-schedule', selector: '[data-tour="class-card"]', featureKey: 'schedule',
    title: 'Build your training schedule', placement: 'right',
    body: "Make a schedule of the days you commit to train, then check each one off as you go. It builds a consistency streak.",
  },
  {
    screen: 'm-feed', selector: '[data-tour="feed-post"]', featureKey: 'feed',
    title: 'Your feed', placement: 'bottom',
    body: 'Posts from the people you follow show up here, so you stay in the loop between sessions.',
  },
  {
    screen: 'm-forum', selector: '[data-tour="forum-list"]', featureKey: 'forums',
    title: 'Forums & group chats', placement: 'right',
    body: 'Public forums for your gym and the wider community (like DMV Jiu-Jitsu), plus private group chats — start one, invite teammates or people from other gyms, and share photos.',
  },
  {
    screen: 'm-dm', selector: '[data-tour="dm-thread"]', featureKey: 'messages',
    title: 'Direct messages', placement: 'left',
    body: 'Message coaches and teammates directly. You control who can reach you — messages from people outside your circle arrive as requests you approve.',
  },
  {
    screen: 'm-profile', selector: '[data-tour="profile-privacy"]', featureKey: 'profile',
    title: 'Profile & privacy', placement: 'right',
    body: 'Your public training identity: belt, bio and competition history. Every field has a 3-tier privacy control — public, members-only, or private. Share your profile with a link.',
  },
  {
    screen: 'm-profile', selector: '[data-tour="follow-btn"]', featureKey: 'follows',
    title: 'Follow training partners', placement: 'bottom',
    body: 'Follow teammates to see their activity in your feed. Your followers and following lists live on your profile.',
  },
  {
    screen: 'm-lessons', selector: '[data-tour="lesson-slot"]', featureKey: 'lessons',
    title: 'Private lessons', placement: 'right',
    body: 'Find an instructor, pick from their open slots, and request a private. Message inside the thread, then leave a review once the lesson is complete.',
  },
  {
    screen: 'm-journal', selector: '[data-tour="journal-entry"]', featureKey: 'journal',
    title: 'Training journal', placement: 'left',
    body: 'Log every session — free-form or with guided prompts for technique, conditioning and goals. Private by default; share an entry with a coach when you want feedback.',
  },
  {
    screen: 'm-events', selector: '[data-tour="event-card"]', featureKey: 'events',
    title: 'Events near you', placement: 'bottom',
    body: 'A public calendar of seminars, open mats and competitions — including events near your location.',
    note: 'Shown if your gym enables Events.',
  },
  {
    screen: 'm-challenge', selector: '[data-tour="challenge-btn"]', featureKey: 'challenges',
    title: 'Challenge matches', placement: 'bottom',
    body: 'Opt in and a Challenge button appears on profiles. Propose terms, negotiate the ruleset, e-sign the waiver, then run it on a live scoreboard — wins and losses feed your competition record.',
    note: 'Opt-in feature; hosted by participating gyms.',
  },
  {
    screen: 'm-gallery', selector: '[data-tour="gallery-grid"]', featureKey: 'gallery',
    title: 'Photo gallery', placement: 'top',
    body: 'Browse gym photos, get tagged, follow hashtags, and view albums in slideshow or different layout modes.',
    note: 'Shown if your gym enables the Gallery.',
  },
  {
    screen: 'm-store', selector: '[data-tour="store-product"]', featureKey: 'store',
    title: 'Gear store', placement: 'bottom',
    body: 'Order gear and pay at pickup. Selling merch? Apply to be a vendor and sell your gear in the gear store.',
    note: 'Shown if your gym enables the Store.',
  },
  {
    screen: 'm-settings', selector: '[data-tour="settings-replay"]', featureKey: 'settings',
    title: 'Settings & notifications', placement: 'right',
    body: 'Control push opt-in, your notification types and your home gym. You can replay this tour anytime from here or the Help page.',
  },
]
