import type { TourStep } from './types'

// Gym admin / owner tour — 12 stops.
export const gymSteps: TourStep[] = [
  {
    screen: 'g-dashboard', selector: '[data-tour="admin-counters"]', featureKey: 'admin-dashboard',
    title: 'Admin dashboard', placement: 'bottom',
    body: "Your gym's pulse: member counts, attendance, check-ins and new signups — plus a \"finish setting up\" checklist to get you launched.",
  },
  {
    screen: 'g-settings', selector: '[data-tour="gym-toggles"]', featureKey: 'gym-settings',
    title: 'Gym profile & settings', placement: 'right',
    body: "Set your name, logo and description, your public review URL, and toggle which features (store, gallery, tournaments, events…) your members see.",
  },
  {
    screen: 'g-members', selector: '[data-tour="member-row"]', featureKey: 'members',
    title: 'Members', placement: 'bottom',
    body: 'Your roster: assign roles, verify belts and promote, and control which class groups each member can access.',
  },
  {
    screen: 'g-members', selector: '[data-tour="view-as"]', featureKey: 'view-as',
    title: 'View As', placement: 'left',
    body: 'See the app exactly as any member sees it — read-only — to help with support or check what a student experiences.',
  },
  {
    screen: 'g-classes', selector: '[data-tour="class-wizard"]', featureKey: 'classes',
    title: 'Classes & programs', placement: 'right',
    body: 'Build your schedule with the class wizard: define programs and class groups, bulk-create by day of week, and manage sessions.',
  },
  {
    screen: 'g-attendance', selector: '[data-tour="attendance-report"]', featureKey: 'attendance',
    title: 'Attendance reports', placement: 'bottom',
    body: 'Break attendance down by class group, by instructor, or by individual member — no spreadsheets.',
  },
  {
    screen: 'g-forummod', selector: '[data-tour="forum-mod"]', featureKey: 'forum-mod',
    title: 'Forum moderation', placement: 'right',
    body: 'Create and manage your gym and group forums, pin announcements, and moderate posts.',
  },
  {
    screen: 'g-invites', selector: '[data-tour="invite-bulk"]', featureKey: 'invitations',
    title: 'Invitations', placement: 'bottom',
    body: 'Invite members individually with a link or QR code, or bulk-import a roster from CSV. New emails are auto-associated when they sign up.',
  },
  {
    screen: 'g-tournaments', selector: '[data-tour="tournament-create"]', featureKey: 'tournaments',
    title: 'Run tournaments', placement: 'bottom',
    body: 'Create in-house tournaments with divisions and registrations, generate brackets, and run matches live on the scoreboard console.',
    note: 'Requires a participating gym.',
  },
  {
    screen: 'g-challenge', selector: '[data-tour="challenge-host"]', featureKey: 'challenge-hosting',
    title: 'Host challenge matches', placement: 'bottom',
    body: 'Opt in to host challenges, publish a visitor waiver, then approve and run approved challenges on the live console.',
    note: 'Opt-in hosting feature.',
  },
  {
    screen: 'g-store', selector: '[data-tour="store-order"]', featureKey: 'store-mgmt',
    title: 'Store management', placement: 'right',
    body: 'List products and fulfil orders — move them from Ready to Picked Up and your members get notified at each step.',
    note: 'Shown if your gym enables the Store.',
  },
  {
    screen: 'g-instructors', selector: '[data-tour="instructor-approve"]', featureKey: 'instructor-oversight',
    title: 'Instructor oversight', placement: 'bottom',
    body: 'Approve instructors, review their private-lesson activity, and manage who teaches at your gym.',
  },
]
