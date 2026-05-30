import prisma from './database'

export interface PlatformFlags {
  allowGymForumCreation: boolean
  allowBeltForumPosting: boolean
  allowEventSubmission: boolean
  allowTournamentRegistration: boolean
  scheduleReadOnly: boolean
  galleryUploadEnabled: boolean
  storeEnabled: boolean
}

const DEFAULTS: PlatformFlags = {
  allowGymForumCreation: true,
  allowBeltForumPosting: true,
  allowEventSubmission: true,
  allowTournamentRegistration: true,
  scheduleReadOnly: false,
  galleryUploadEnabled: true,
  storeEnabled: true,
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
