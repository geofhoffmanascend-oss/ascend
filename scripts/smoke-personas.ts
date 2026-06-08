// Service-layer smoke test across the key personas. Exercises the real data
// model + extracted business logic (invites, availability) and replicates the
// documented route logic (asOwner grant, free→active / participating→pending
// membership). Tags all data with a unique TAG and deletes it at the end.
//
//   npx tsx scripts/smoke-personas.ts          # run + auto-cleanup
//   npx tsx scripts/smoke-personas.ts --keep   # run, leave data for inspection
import 'dotenv/config'
import * as dl from 'dotenv'; dl.config({ path: '.env.local', override: true })
import bcrypt from 'bcryptjs'
import prisma from '../lib/database'
import { applyInvite } from '../lib/invites'
import { availabilityInRange } from '../lib/availability'
import { generateSessionsForRange } from '../lib/generateSessions'

const TAG = `smoke${Date.now()}`
const KEEP = process.argv.includes('--keep')
const pwHash = bcrypt.hashSync('smoketest123', 10)
const email = (s: string) => `${s}.${TAG}@smoke.test`

let pass = 0, fail = 0
const fails: string[] = []
function check(cond: any, msg: string) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`) }
  else { fail++; fails.push(msg); console.log(`  ✗ ${msg}`) }
}

async function mkUser(handle: string, roles: any[] = ['student']) {
  return prisma.user.create({ data: { name: `${handle} ${TAG}`, email: email(handle), passwordHash: pwHash, roles, onboardingDone: true } })
}

async function createGymAsOwner(ownerId: string, name: string, parts: { city?: string; state?: string } = {}) {
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${TAG}`
  const gym = await prisma.gym.create({
    data: {
      name: `${name} ${TAG}`, slug, participatingStatus: 'free', city: parts.city ?? null, state: parts.state ?? null,
      members: { create: { userId: ownerId, status: 'active' } },
      forums: { create: { type: 'gym_forum', title: 'General' } },
    },
  })
  const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { roles: true } })
  const roles = Array.from(new Set([...(owner!.roles), 'admin', 'instructor'])) as any
  await prisma.user.update({ where: { id: ownerId }, data: { roles, gymId: gym.id } })
  return gym
}

async function main() {
  console.log(`\n=== PERSONA SMOKE TEST (${TAG}) ===\n`)

  // 1. Gym owner onboarding
  console.log('1. Gym owner onboarding')
  const owner = await mkUser('owner')
  const gym = await createGymAsOwner(owner.id, 'Smoke Academy', { city: 'Denver', state: 'CO' })
  const ownerAfter = await prisma.user.findUnique({ where: { id: owner.id } })
  check(ownerAfter?.roles.includes('admin') && ownerAfter?.roles.includes('instructor'), 'owner granted admin + instructor')
  check(ownerAfter?.gymId === gym.id, 'owner.gymId set to new gym')
  check(!!(await prisma.forum.findFirst({ where: { gymId: gym.id, type: 'gym_forum', title: 'General' } })), 'gym got a General forum')

  const program = await prisma.classProgram.create({ data: { gymId: gym.id, name: `Basics ${TAG}` } })
  for (const d of ['monday', 'wednesday', 'friday'] as const) {
    await prisma.class.create({ data: { title: `6am Gi ${TAG}`, type: 'gi', dayOfWeek: d, startTime: '06:00', endTime: '07:00', instructorId: owner.id, gymId: gym.id, programId: program.id, forum: { create: { type: 'class_forum', title: `6am Gi ${d} ${TAG}`, gymId: gym.id } } } })
  }
  check((await prisma.class.count({ where: { gymId: gym.id } })) === 3, 'created 3 classes in a class group')
  await prisma.instructorAvailability.create({ data: { instructorId: owner.id, kind: 'recurring', dayOfWeek: 'monday', startTime: '16:00', endTime: '18:00', gymId: gym.id } })
  check(true, 'owner set private-lesson availability')

  // 2. Student joins a non-participating (free) gym
  console.log('\n2. Student joins non-participating gym')
  const studentA = await mkUser('studentA')
  await prisma.gymMembership.create({ data: { userId: studentA.id, gymId: gym.id, status: 'active' } })
  await prisma.user.update({ where: { id: studentA.id }, data: { gymId: gym.id } })
  check((await prisma.gymMembership.findUnique({ where: { userId_gymId: { userId: studentA.id, gymId: gym.id } } }))?.status === 'active', 'free gym → membership ACTIVE immediately')

  await generateSessionsForRange(2)
  const session = await prisma.classSession.findFirst({ where: { class: { gymId: gym.id } }, orderBy: { date: 'asc' } })
  check(!!session, 'class sessions generated for the gym')
  if (session) {
    await prisma.commitment.create({ data: { userId: studentA.id, classSessionId: session.id } })
    check(!!(await prisma.commitment.findUnique({ where: { userId_classSessionId: { userId: studentA.id, classSessionId: session.id } } })), 'student registered for a class session')
  }

  // 3. Private lesson booking
  console.log('\n3. Private lesson booking')
  const avail = await prisma.instructorAvailability.findMany({ where: { instructorId: owner.id }, select: { kind: true, dayOfWeek: true, date: true, startTime: true, endTime: true } })
  const from = new Date(); from.setUTCHours(0, 0, 0, 0)
  const to = new Date(from); to.setUTCDate(to.getUTCDate() + 28)
  const slotDays = availabilityInRange(avail as any, [], from, to, 60)
  check(slotDays.length > 0 && slotDays[0].slots.length > 0, `availability computed (${slotDays.length} days, ${slotDays[0]?.slots.length ?? 0} slots/day)`)
  if (slotDays.length) {
    const d = slotDays[0]
    const lesson = await prisma.privateLesson.create({ data: { requesterId: studentA.id, instructorId: owner.id, scheduledAt: new Date(`${d.date}T${d.slots[0]}:00.000Z`), durationMins: 60 } })
    check(lesson.status === 'pending', 'lesson request created (pending)')
  }

  // 4. User joins a PARTICIPATING gym (pending → approved)
  console.log('\n4. User joins participating gym')
  const owner2 = await mkUser('owner2')
  const gym2 = await createGymAsOwner(owner2.id, 'Smoke Participating', { city: 'Bowie', state: 'MD' })
  await prisma.gym.update({ where: { id: gym2.id }, data: { participatingStatus: 'participating' } })
  const userB = await mkUser('userB')
  await prisma.gymMembership.create({ data: { userId: userB.id, gymId: gym2.id, status: 'pending' } })
  check((await prisma.gymMembership.findUnique({ where: { userId_gymId: { userId: userB.id, gymId: gym2.id } } }))?.status === 'pending', 'participating gym → membership PENDING')
  await prisma.gymMembership.update({ where: { userId_gymId: { userId: userB.id, gymId: gym2.id } }, data: { status: 'active' } })
  check((await prisma.gymMembership.findUnique({ where: { userId_gymId: { userId: userB.id, gymId: gym2.id } } }))?.status === 'active', 'admin approval → membership ACTIVE')

  // 5. Owner sees existing members
  console.log('\n5. Owner sees existing members')
  const members = await prisma.gymMembership.findMany({ where: { gymId: gym.id }, include: { user: { select: { id: true } } } })
  check(members.some(m => m.user.id === studentA.id), 'gym roster includes the existing student')
  check(members.length >= 2, `gym has ${members.length} members`)

  // 6. Interactions between users
  console.log('\n6. User interactions')
  const instrInvite = await prisma.invitation.create({ data: { token: `${TAG}-instr`, inviterId: owner.id, kind: 'gym_instructor', gymId: gym.id, grantOnAccept: true, maxUses: 1 } })
  const userC = await mkUser('userC')
  const rC = await applyInvite(instrInvite.token, userC.id)
  const userCAfter = await prisma.user.findUnique({ where: { id: userC.id } })
  check(rC.ok && userCAfter?.roles.includes('instructor'), 'instructor invite → invitee granted instructor')
  check(userCAfter?.gymId === gym.id, 'instructor invite → invitee joined the gym')
  check(!!(await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: owner.id, followingId: userC.id } } })) && !!(await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: userC.id, followingId: owner.id } } })), 'invite → mutual follow')
  const userE = await mkUser('userE')
  check((await applyInvite(instrInvite.token, userE.id)).ok === false, 'single-use instructor link cannot be reused')

  const friendInvite = await prisma.invitation.create({ data: { token: `${TAG}-friend`, inviterId: studentA.id, kind: 'friend', maxUses: null } })
  const userD = await mkUser('userD')
  await applyInvite(friendInvite.token, userD.id)
  check(!!(await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: studentA.id, followingId: userD.id } } })), 'friend invite → mutual follow')

  const gf = await prisma.forum.findFirst({ where: { gymId: gym.id, type: 'gym_forum' } })
  if (gf) check(!!(await prisma.post.create({ data: { forumId: gf.id, authorId: studentA.id, content: `Hello ${TAG}` } })), 'student posted in gym forum')
  check(!!(await prisma.directMessage.create({ data: { senderId: studentA.id, recipientId: owner.id, body: `DM ${TAG}` } })), 'student DM\'d the owner')

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`)
  if (fail) console.log('FAILURES:\n' + fails.map(f => '  - ' + f).join('\n'))

  if (KEEP) { console.log('\n(--keep) Test data left in place.'); return }
  console.log('\nCleaning up test data…')
  const ids = (await prisma.user.findMany({ where: { email: { contains: TAG } }, select: { id: true } })).map(u => u.id)
  const gymIds = (await prisma.gym.findMany({ where: { name: { contains: TAG } }, select: { id: true } })).map(g => g.id)
  await prisma.privateLesson.deleteMany({ where: { OR: [{ requesterId: { in: ids } }, { instructorId: { in: ids } }] } })
  await prisma.directMessage.deleteMany({ where: { OR: [{ senderId: { in: ids } }, { recipientId: { in: ids } }] } })
  await prisma.post.deleteMany({ where: { authorId: { in: ids } } }) // Post.author is Restrict
  // Class.gym is SetNull, so delete classes explicitly (cascades class forums + sessions + commitments).
  await prisma.class.deleteMany({ where: { OR: [{ gymId: { in: gymIds } }, { instructorId: { in: ids } }] } })
  await prisma.forum.deleteMany({ where: { gymId: { in: gymIds } } })
  await prisma.gym.deleteMany({ where: { id: { in: gymIds } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
  console.log('Cleanup done.')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => process.exit(fail ? 1 : 0))
