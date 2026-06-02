// Helper to inspect/set gallery toggles for verification.
//   SET='{"platform":{...},"gym":{...}}' npx tsx --env-file=.env.local scripts/gallery-flags.ts
// Operates on student1@gym.com's gym. Prints resulting state as STATE=...
import prisma from '../lib/database'

async function main() {
  const student = await prisma.user.findUnique({ where: { email: 'student1@gym.com' }, select: { gymId: true } })
  const gymId = student?.gymId
  if (!gymId) throw new Error('student1 has no gym')

  const set = process.env.SET ? JSON.parse(process.env.SET) : null
  if (set?.platform) {
    await prisma.platformSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...set.platform },
      update: set.platform,
    })
  }
  if (set?.gym) {
    await prisma.gymFeatures.upsert({
      where: { gymId },
      create: { gymId, ...set.gym },
      update: set.gym,
    })
  }

  const platform = await prisma.platformSettings.findUnique({
    where: { id: 'singleton' },
    select: { galleryEnabled: true, galleryUploadEnabled: true },
  })
  const gym = await prisma.gymFeatures.findUnique({
    where: { gymId },
    select: { galleryEnabled: true, galleryUploadEnabled: true },
  })
  console.log('STATE=' + JSON.stringify({ gymId, platform, gym }))
  process.exit(0)
}
main()
