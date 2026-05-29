// Run ONLY ONCE after prisma db push:
// npx tsx scripts/migrate-to-multigym.ts

import 'dotenv/config'
import * as dotenvLocal from 'dotenv'
dotenvLocal.config({ path: '.env.local', override: true })

import prisma from '../lib/database'

async function main() {
  // 1. Create the seed gym
  const gym = await prisma.gym.upsert({
    where: { slug: 'ascend-bjj-test' },
    update: {},
    create: {
      name: 'Ascend BJJ Test Gym',
      slug: 'ascend-bjj-test',
      participatingStatus: 'participating',
    },
  })
  console.log(`Gym: ${gym.id} (${gym.name})`)

  // 2. Set all existing users' gymId to this gym
  const usersUpdated = await prisma.user.updateMany({
    where: { gymId: null },
    data: { gymId: gym.id },
  })
  console.log(`Users updated: ${usersUpdated.count}`)

  // 3. Create GymMembership records for all existing users
  const users = await prisma.user.findMany({ select: { id: true } })
  for (const user of users) {
    await prisma.gymMembership.upsert({
      where: { userId_gymId: { userId: user.id, gymId: gym.id } },
      update: {},
      create: { userId: user.id, gymId: gym.id, status: 'active' },
    })
  }
  console.log(`GymMemberships created/verified: ${users.length}`)

  // 4. Set gymId on all Classes
  const classesUpdated = await prisma.class.updateMany({ where: { gymId: null }, data: { gymId: gym.id } })
  console.log(`Classes updated: ${classesUpdated.count}`)

  // 5. Set gymId on all Forums
  const forumsUpdated = await prisma.forum.updateMany({ where: { gymId: null }, data: { gymId: gym.id } })
  console.log(`Forums updated: ${forumsUpdated.count}`)

  // 6. Set gymId on all MediaItems
  const mediaUpdated = await prisma.mediaItem.updateMany({ where: { gymId: null }, data: { gymId: gym.id } })
  console.log(`MediaItems updated: ${mediaUpdated.count}`)

  // 7. Set gymId on all Products and Orders
  const productsUpdated = await prisma.product.updateMany({ where: { gymId: null }, data: { gymId: gym.id } })
  const ordersUpdated = await prisma.order.updateMany({ where: { gymId: null }, data: { gymId: gym.id } })
  console.log(`Products updated: ${productsUpdated.count}, Orders updated: ${ordersUpdated.count}`)

  // 8. Migrate existing GymSettings row
  const existingSettings = await prisma.gymSettings.findFirst()
  if (existingSettings && !existingSettings.gymId) {
    await prisma.gymSettings.update({
      where: { id: existingSettings.id },
      data: { gymId: gym.id },
    })
    console.log('GymSettings migrated')
  } else {
    console.log('GymSettings: nothing to migrate')
  }

  // 9. Grant site_admin to all existing admin users
  const admins = await prisma.user.findMany({
    where: { roles: { has: 'admin' } },
  })
  for (const admin of admins) {
    if (!admin.roles.includes('site_admin')) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { roles: [...admin.roles, 'site_admin'] },
      })
    }
  }
  console.log(`Admins granted site_admin: ${admins.length}`)

  console.log('Migration complete.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
