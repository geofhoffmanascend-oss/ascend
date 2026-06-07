// Ensure every gym has a general (non-class-group) community forum.
// Idempotent: creates a `gym_forum` titled "General" only for gyms that don't
// already have one with that title.
import 'dotenv/config'
import * as dotenvLocal from 'dotenv'
dotenvLocal.config({ path: '.env.local', override: true })
import prisma from '../lib/database'

async function main() {
  const gyms = await prisma.gym.findMany({ select: { id: true, name: true } })
  let created = 0
  for (const gym of gyms) {
    const existing = await prisma.forum.findFirst({
      where: { gymId: gym.id, type: 'gym_forum', title: { equals: 'General', mode: 'insensitive' } },
      select: { id: true },
    })
    if (existing) {
      console.log(`• ${gym.name}: already has a General forum — skipped`)
      continue
    }
    await prisma.forum.create({ data: { type: 'gym_forum', title: 'General', gymId: gym.id } })
    created++
    console.log(`✓ ${gym.name}: created General forum`)
  }
  console.log(`\nDone. Created ${created} General forum(s) across ${gyms.length} gym(s).`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => process.exit(0))
