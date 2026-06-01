// Phase 37 — create the "Ascend" demo gym and move all instructors into it.
// Idempotent. Run with:
//   npx tsx scripts/setup-ascend-gym.ts

import 'dotenv/config'
import * as dotenvLocal from 'dotenv'
dotenvLocal.config({ path: '.env.local', override: true })

import prisma from '../lib/database'

async function main() {
  // 1. Upsert the Ascend demo gym (participating tier so all features can be demoed).
  const gym = await prisma.gym.upsert({
    where: { slug: 'ascend' },
    update: { participatingStatus: 'participating' },
    create: {
      name: 'Ascend',
      slug: 'ascend',
      description: 'The original Ascend gym — demo gym for the multi-gym platform.',
      participatingStatus: 'participating',
    },
  })
  console.log(`Gym: ${gym.id} (${gym.name})`)

  // 2. Find every user with the instructor role.
  const instructors = await prisma.user.findMany({
    where: { roles: { has: 'instructor' } },
    select: { id: true, name: true, email: true },
  })
  console.log(`Instructors found: ${instructors.length}`)

  // 3. Set their home gym + ensure an active membership in Ascend.
  for (const u of instructors) {
    await prisma.user.update({ where: { id: u.id }, data: { gymId: gym.id } })
    await prisma.gymMembership.upsert({
      where: { userId_gymId: { userId: u.id, gymId: gym.id } },
      update: { status: 'active' },
      create: { userId: u.id, gymId: gym.id, status: 'active' },
    })
    console.log(`  → ${u.name ?? u.email ?? u.id} assigned to Ascend`)
  }

  console.log('Done.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
