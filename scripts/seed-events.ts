/**
 * Seed the public events calendar (PublicEvent) from the confirmed §A anchor
 * open-mat sources in guides/open-mats-events-sources.md.
 *
 * Generates the next N weeks of each recurring weekend open mat as an APPROVED
 * PublicEvent. Each row carries its source URL + last-verified date in the
 * description, per the guide's per-event checklist. De-dupes by title+startDate
 * so it's safe to re-run.
 *
 *   npx tsx scripts/seed-events.ts            # dry run (prints what it would create)
 *   npx tsx scripts/seed-events.ts --apply    # write to the DB
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import fs from 'fs'
import os from 'os'
import path from 'path'

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

const WEEKS = 8
const LAST_VERIFIED = '2026-06-29'

// Confirmed §A anchor open mats (times verified on each gym's own site).
type Slot = {
  title: string
  weekday: number // 0=Sun … 6=Sat
  startHour: number; startMin: number
  endHour: number; endMin: number
  location: string
  address?: string
  city: string; state: string; zip?: string
  notes: string
  source: string
}

const SLOTS: Slot[] = [
  {
    title: 'Open Mat — Pedro Sauer Academy (Sunday)',
    weekday: 0, startHour: 12, startMin: 0, endHour: 14, endMin: 0,
    location: 'Pedro Sauer Academy', address: '510 Spring Street, Suite 130',
    city: 'Herndon', state: 'VA', zip: '20170',
    notes: 'Free open mat (Gi/No-Gi). Open to everyone 18+ (minors with parental approval). Weeknight open mats also run Mon–Fri.',
    source: 'https://nvma.group/va/herndon/pedro-sauer-academy/bjj-open-mat-schedule/',
  },
  {
    title: 'Open Mat — Pedro Sauer Academy (Saturday, Gi)',
    weekday: 6, startHour: 12, startMin: 0, endHour: 13, endMin: 30,
    location: 'Pedro Sauer Academy', address: '510 Spring Street, Suite 130',
    city: 'Herndon', state: 'VA', zip: '20170',
    notes: 'Free Gi open mat. Open to everyone 18+ (minors with parental approval).',
    source: 'https://www.pedrosaueracademy.com/martial-arts-class-schedule-herndon-va/',
  },
  {
    title: 'Open Mat — Haven Grappling Academy (Saturday)',
    weekday: 6, startHour: 12, startMin: 0, endHour: 14, endMin: 0,
    location: 'Haven Grappling Academy', address: '2929-C Eskridge Road',
    city: 'Fairfax', state: 'VA', zip: '22031',
    notes: 'Open mat. Confirm visitor drop-in policy with the gym.',
    source: 'https://havengrappling.com/schedule.html',
  },
  {
    title: 'Open Mat — Haven Grappling Academy (Sunday)',
    weekday: 0, startHour: 10, startMin: 0, endHour: 11, endMin: 0,
    location: 'Haven Grappling Academy', address: '2929-C Eskridge Road',
    city: 'Fairfax', state: 'VA', zip: '22031',
    notes: 'Open mat. Confirm visitor drop-in policy with the gym.',
    source: 'https://havengrappling.com/schedule.html',
  },
  {
    title: 'Open Mat — High Noon BJJ (Saturday)',
    weekday: 6, startHour: 12, startMin: 0, endHour: 14, endMin: 0,
    location: 'High Noon BJJ',
    city: 'Alexandria', state: 'VA',
    notes: 'Community sparring session — Gi, No-Gi, and Judo. All teams and affiliations welcome. No mat fee.',
    source: 'https://highnoonbjj.com/schedule/',
  },
]

// One-off dated events (tournaments, seminars). The in-app Tournament feature is
// off, so confirmed VA tournaments are listed here as `competition` PublicEvents.
// Times are only set when the source publishes them — otherwise see the reg link.
type OneOff = {
  title: string
  type: 'competition' | 'seminar' | 'other' | 'open_mat'
  start: Date
  end?: Date
  location?: string
  address?: string
  city?: string
  state: string
  zip?: string
  notes: string
  source: string
}

const ONE_OFFS: OneOff[] = [
  {
    title: 'Copa Virginia — Fall 2026',
    type: 'competition',
    start: new Date(2026, 8, 26, 8, 0), // Sep 26, 2026 (start time per registration page)
    state: 'VA',
    notes: 'Copa Jiu Jitsu regional tournament. Start time, venue, divisions, and registration deadline on the registration page.',
    source: 'https://copa-bjj.smoothcomp.com/en/event/29364',
  },
]

// Next N occurrences of `weekday` at the given time, strictly in the future.
function nextOccurrences(slot: Slot, weeks: number): { start: Date; end: Date }[] {
  const out: { start: Date; end: Date }[] = []
  const now = new Date()
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  // advance to the first matching weekday
  while (cursor.getDay() !== slot.weekday) cursor.setDate(cursor.getDate() + 1)
  for (let i = 0; i < weeks; i++) {
    const start = new Date(cursor)
    start.setHours(slot.startHour, slot.startMin, 0, 0)
    const end = new Date(cursor)
    end.setHours(slot.endHour, slot.endMin, 0, 0)
    if (start > now) out.push({ start, end })
    cursor.setDate(cursor.getDate() + 7)
  }
  return out
}

function descriptionFor(slot: Slot) {
  return `${slot.notes}\n\nSource: ${slot.source}\nLast verified: ${LAST_VERIFIED}`
}

async function main() {
  const APPLY = process.argv.includes('--apply')
  const prisma = makeClient()

  try {
    const admin = await prisma.user.findFirst({
      where: { roles: { has: 'site_admin' } },
      select: { id: true, email: true },
    })
    if (!admin) {
      console.error('No site_admin user found to attribute submissions to. Aborting.')
      process.exit(1)
    }
    console.log(`Attributing events to site admin: ${admin.email}`)
    const adminId = admin.id

    let created = 0
    let skipped = 0

    type EventData = {
      title: string; type: OneOff['type']; description: string
      location?: string; address?: string; city?: string; state: string; zip?: string
      start: Date; end?: Date
    }

    async function upsert(d: EventData) {
      const existing = await prisma.publicEvent.findFirst({
        where: { title: d.title, startDate: d.start },
        select: { id: true },
      })
      if (existing) { skipped++; return }

      const label = `${d.title} @ ${d.start.toLocaleString('en-US')}`
      if (!APPLY) { console.log(`  would create: ${label}`); created++; return }

      await prisma.publicEvent.create({
        data: {
          title: d.title,
          type: d.type,
          description: d.description,
          location: d.location ?? null,
          address: d.address ?? null,
          city: d.city ?? null,
          state: d.state,
          zip: d.zip ?? null,
          startDate: d.start,
          endDate: d.end ?? null,
          status: 'approved',
          submittedById: adminId,
          approvedById: adminId,
        },
      })
      console.log(`  created: ${label}`)
      created++
    }

    // Recurring open mats
    for (const slot of SLOTS) {
      for (const { start, end } of nextOccurrences(slot, WEEKS)) {
        await upsert({
          title: slot.title, type: 'open_mat', description: descriptionFor(slot),
          location: slot.location, address: slot.address, city: slot.city,
          state: slot.state, zip: slot.zip, start, end,
        })
      }
    }

    // One-off tournaments / seminars
    for (const e of ONE_OFFS) {
      await upsert({
        title: e.title, type: e.type,
        description: `${e.notes}\n\nSource: ${e.source}\nLast verified: ${LAST_VERIFIED}`,
        location: e.location, address: e.address, city: e.city,
        state: e.state, zip: e.zip, start: e.start, end: e.end,
      })
    }

    console.log(`\n${APPLY ? 'Created' : 'Would create'}: ${created}  •  Skipped (already present): ${skipped}`)
    if (!APPLY) console.log('Dry run — re-run with --apply to write.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
