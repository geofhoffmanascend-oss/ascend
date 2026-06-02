import type { Session } from 'next-auth'
import { getPlatformSettings } from './platformSettings'
import { getGymFeatures } from './gymFeatures'

// Effective feature availability for a given user (Phase 37). A feature is on
// only if the platform allows it AND the user's gym allows it. Gym admins
// (`admin`, for their own gym) and `site_admin` bypass all toggles — matching
// the Phase 33 platform-toggle behavior.
export interface EffectiveFeatures {
  store: boolean
  tournaments: boolean
  gallery: boolean        // gallery visible/browsable (nav + page)
  galleryUpload: boolean  // new uploads allowed (always implies gallery)
  privateLessons: boolean
  gymForum: boolean
  journal: boolean
  events: boolean // platform-only (public event submission); no per-gym toggle
  // Navbar-link visibility (platform-only). `events` above = submit button.
  feed: boolean
  schedule: boolean
  forums: boolean
  eventsNav: boolean
}

const ALL_ON: EffectiveFeatures = {
  store: true,
  tournaments: true,
  gallery: true,
  galleryUpload: true,
  privateLessons: true,
  gymForum: true,
  journal: true,
  events: true,
  feed: true,
  schedule: true,
  forums: true,
  eventsNav: true,
}

export async function getEffectiveFeatures(session: Session | null): Promise<EffectiveFeatures> {
  const roles = session?.user?.roles ?? []
  if (roles.includes('admin') || roles.includes('site_admin')) {
    return { ...ALL_ON }
  }

  const [platform, gym] = await Promise.all([
    getPlatformSettings(),
    getGymFeatures(session?.user?.gymId),
  ])

  const galleryVisible = platform.galleryEnabled && gym.galleryEnabled

  return {
    store: platform.storeEnabled && gym.storeEnabled,
    tournaments: platform.allowTournamentRegistration && gym.tournamentsEnabled,
    gallery: galleryVisible,
    galleryUpload: galleryVisible && platform.galleryUploadEnabled && gym.galleryUploadEnabled,
    privateLessons: gym.privateLessonsEnabled,
    gymForum: platform.allowGymForumCreation && gym.gymForumEnabled,
    journal: gym.journalEnabled,
    events: platform.allowEventSubmission,
    feed: platform.feedEnabled,
    schedule: platform.scheduleEnabled,
    forums: platform.forumsEnabled,
    eventsNav: platform.eventsEnabled,
  }
}
