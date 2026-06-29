import type { TourStep } from './types'

// Private instructor tour — scope C: covers gym-employed instructors (/instructor/*)
// AND the independent provider path (/provider/*), noting which applies to whom.
export const instructorSteps: TourStep[] = [
  {
    screen: 'i-dashboard', selector: '[data-tour="inst-upcoming"]', featureKey: 'inst-dashboard',
    title: 'Instructor dashboard', placement: 'bottom',
    body: "Your upcoming sessions with registered and checked-in counts, so you walk into class knowing who's coming.",
  },
  {
    screen: 'i-availability', selector: '[data-tour="availability-grid"]', featureKey: 'availability',
    title: 'Set your availability', placement: 'right',
    body: 'Publish recurring and one-off windows for private lessons, block out times, and choose whether you accept requests from students outside your own gym.',
  },
  {
    screen: 'i-inbox', selector: '[data-tour="lesson-request"]', featureKey: 'lesson-inbox',
    title: 'Private-lesson inbox', placement: 'bottom',
    body: 'Incoming private-lesson requests land here. Confirm, message the student, and mark complete when done.',
  },
  {
    screen: 'i-session', selector: '[data-tour="attendance-mark"]', featureKey: 'session-detail',
    title: 'Run a class', placement: 'right',
    body: 'Open any session to mark attendance and leave notes — public notes your students see, or private notes just for staff.',
  },
  {
    screen: 'i-session', selector: '[data-tour="release-session"]', featureKey: 'release',
    title: 'Release / substitute', placement: 'left',
    body: "Can't make a class? Release the session and other instructors are notified and can claim it.",
  },
  {
    screen: 'i-notes', selector: '[data-tour="lesson-plan"]', featureKey: 'notes-plans',
    title: 'Student notes & lesson plans', placement: 'right',
    body: 'Keep private notes on each student and build reusable lesson plans for your classes and privates.',
  },
  {
    screen: 'i-session', selector: '[data-tour="push-students"]', featureKey: 'push',
    title: 'Push to students', placement: 'bottom',
    body: 'Send a push notification to everyone committed to a session — a reminder, a location change, or what to bring.',
  },
  {
    screen: 'i-forum', selector: '[data-tour="inst-forum"]', featureKey: 'inst-forum',
    title: 'Instructor-only forum', placement: 'right',
    body: 'A private space for staff to coordinate curriculum and share notes, hidden from students.',
  },
  {
    screen: 'i-reviews', selector: '[data-tour="review-card"]', featureKey: 'reviews',
    title: 'Ratings & reviews', placement: 'bottom',
    body: 'Students who complete a private lesson with you can leave a rating and review. Your average shows on your profile and in search.',
  },
  {
    screen: 'i-provider', selector: '[data-tour="provider-apply"]', featureKey: 'provider',
    title: 'Teach independently', placement: 'right',
    body: "Not tied to one gym? Apply to be a private instructor. A verified black belt approves you, then you're discoverable to students searching within your area.",
    note: 'Private-instructor (non-gym) path — optional.',
  },
]
