import prisma from './database'

export interface PlatformFlags {
  allowGymForumCreation: boolean
  allowBeltForumPosting: boolean
  allowEventSubmission: boolean
  allowTournamentRegistration: boolean
  scheduleReadOnly: boolean
  galleryEnabled: boolean
  galleryUploadEnabled: boolean
  storeEnabled: boolean
  feedEnabled: boolean
  scheduleEnabled: boolean
  forumsEnabled: boolean
  eventsEnabled: boolean
}

const DEFAULTS: PlatformFlags = {
  allowGymForumCreation: true,
  allowBeltForumPosting: true,
  allowEventSubmission: true,
  allowTournamentRegistration: true,
  scheduleReadOnly: false,
  galleryEnabled: true,
  galleryUploadEnabled: true,
  storeEnabled: true,
  feedEnabled: true,
  scheduleEnabled: true,
  forumsEnabled: true,
  eventsEnabled: true,
}

export async function getPlatformSettings(): Promise<PlatformFlags> {
  const row = await prisma.platformSettings.findUnique({ where: { id: 'singleton' } })
  return row ?? DEFAULTS
}

export async function upsertPlatformSettings(flags: Partial<PlatformFlags>): Promise<PlatformFlags> {
  const row = await prisma.platformSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...DEFAULTS, ...flags },
    update: flags,
  })
  return row
}
