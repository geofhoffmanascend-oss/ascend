import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import os from 'os'
import path from 'path'

const BELT_ORDER: Record<string, number> = { white: 0, blue: 1, purple: 2, brown: 3, black: 4, coral: 4, red: 4 }

function makeClient(): PrismaClient {
  const u = new URL(process.env.DATABASE_URL!)
  const certPath = path.join(os.homedir(), '.postgresql', 'root.crt')
  const ca = fs.existsSync(certPath) ? fs.readFileSync(certPath).toString() : undefined
  const pool = new Pool({
    host: u.hostname,
    port: parseInt(u.port || '26257'),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
    ssl: ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: false },
  })
  return new PrismaClient({ adapter: new PrismaPg(pool) })
}

// Belts ordered for picking a value within [min,max] (skip coral/red — same order as black)
const PICK_ORDER = ['white', 'blue', 'purple', 'brown', 'black'] as const

async function main() {
  const prisma = makeClient()
  const APPLY = process.argv.includes('--apply')

  // Find the most recent tournament that has exactly 3 divisions
  const tournaments = await prisma.tournament.findMany({
    include: {
      gym: { select: { id: true, name: true } },
      divisions: {
        select: { id: true, name: true, beltMin: true, beltMax: true, _count: { select: { registrations: true } } },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { divisions: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const target = tournaments.find(t => t._count.divisions === 3) ?? tournaments[0]
  if (!target) { console.log('No tournaments found.'); process.exit(1) }

  console.log(`Target tournament: "${target.title}" (${target.id})`)
  console.log(`  Gym: ${target.gym?.name} (${target.gymId})  | status: ${target.status}`)
  target.divisions.forEach(d =>
    console.log(`  Division: ${d.name} (${d.id}) belt ${d.beltMin}-${d.beltMax} | existing regs: ${d._count.registrations}`)
  )

  if (!target.gymId) { console.log('Tournament has no gymId — cannot create memberships.'); process.exit(1) }

  if (!APPLY) {
    console.log('\n[dry run] Re-run with --apply to create 15 users + memberships + 5 registrations per division.')
    process.exit(0)
  }

  const hash = await bcrypt.hash('Test1234!', 10)
  let userN = 0

  for (let di = 0; di < target.divisions.length; di++) {
    const div = target.divisions[di]
    const minO = BELT_ORDER[div.beltMin] ?? 0
    const maxO = BELT_ORDER[div.beltMax] ?? 4
    // pick a belt within the division's allowed range
    const belt = PICK_ORDER.find(b => BELT_ORDER[b] >= minO && BELT_ORDER[b] <= maxO) ?? 'white'

    for (let i = 0; i < 5; i++) {
      userN++
      const email = `testcomp${userN}@ascend.test`
      const name = `Test Competitor ${userN}`

      const user = await prisma.user.upsert({
        where: { email },
        update: { belt, gymId: target.gymId },
        create: {
          email,
          name,
          passwordHash: hash,
          roles: ['student'],
          belt,
          gymId: target.gymId,
          onboardingDone: true,
        },
        select: { id: true, email: true, belt: true },
      })

      // Active membership in the tournament's gym
      await prisma.gymMembership.upsert({
        where: { userId_gymId: { userId: user.id, gymId: target.gymId } },
        update: { status: 'active' },
        create: { userId: user.id, gymId: target.gymId, status: 'active' },
      })

      // Register (confirmed so they show as locked in the bracket)
      await prisma.registration.upsert({
        where: { divisionId_userId: { divisionId: div.id, userId: user.id } },
        update: { confirmed: true },
        create: { divisionId: div.id, userId: user.id, confirmed: true },
      })

      console.log(`  + ${name} <${email}> belt=${user.belt} → ${div.name}`)
    }
  }

  console.log(`\nDone. Created/updated ${userN} users, all registered. Login password for all: Test1234!`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
