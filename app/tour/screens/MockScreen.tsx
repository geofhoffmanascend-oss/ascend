import type { ScreenKey } from '@/lib/tour/types'
import * as M from './member'
import * as G from './gym'
import * as I from './instructor'

// Registry mapping ScreenKey (used in step configs) -> mock screen component.
const SCREENS: Record<string, React.ComponentType> = {
  // member
  'm-dashboard': M.MDashboard,
  'm-schedule': M.MSchedule,
  'm-checkin': M.MCheckin,
  'm-feed': M.MFeed,
  'm-forum': M.MForum,
  'm-dm': M.MDM,
  'm-profile': M.MProfile,
  'm-lessons': M.MLessons,
  'm-journal': M.MJournal,
  'm-events': M.MEvents,
  'm-tournaments': M.MTournaments,
  'm-challenge': M.MChallenge,
  'm-gallery': M.MGallery,
  'm-store': M.MStore,
  'm-settings': M.MSettings,
  // gym
  'g-dashboard': G.GDashboard,
  'g-settings': G.GSettings,
  'g-members': G.GMembers,
  'g-classes': G.GClasses,
  'g-attendance': G.GAttendance,
  'g-forummod': G.GForumMod,
  'g-invites': G.GInvites,
  'g-tournaments': G.GTournaments,
  'g-challenge': G.GChallenge,
  'g-store': G.GStore,
  'g-instructors': G.GInstructors,
  // instructor
  'i-dashboard': I.IDashboard,
  'i-availability': I.IAvailability,
  'i-inbox': I.IInbox,
  'i-session': I.ISession,
  'i-notes': I.INotes,
  'i-forum': I.IForum,
  'i-reviews': I.IReviews,
  'i-provider': I.IProvider,
}

export function MockScreen({ screen }: { screen: ScreenKey }) {
  const Cmp = SCREENS[screen]
  if (!Cmp) return null
  return <Cmp />
}
