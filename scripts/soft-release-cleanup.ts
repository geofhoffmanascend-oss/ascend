// Soft-release data cleanup. Confirmed by user 2026-06-02.
// KEEP: geof.hoffman@gmail.com (site_admin, no gym), geof.hoffman.ascend@gmail.com,
//       instructor1@gym.com (Marcus Silva), admin@gym.com.
// Merge both Ascend gyms into one "Ascend Jiu Jitsu" (non-participating); delete the rest.
import prisma from '../lib/database'

const KEEP_EMAILS = [
  'geof.hoffman@gmail.com',
  'geof.hoffman.ascend@gmail.com',
  'instructor1@gym.com',
  'admin@gym.com',
]
const SURVIVING_GYM_ID = 'cmpv61f3r0000txj6m9mq4gdx' // "Ascend" (slug=ascend)

async function main() {
  // ── Phase A: clear all content (child → parent order) ──────────────────────
  const clear: [string, () => Promise<{ count: number }>][] = [
    ['post(replies)',    () => prisma.post.deleteMany({ where: { parentId: { not: null } } })],
    ['post(top)',        () => prisma.post.deleteMany({})],
    ['lessonMessage',    () => prisma.lessonMessage.deleteMany({})],
    ['privateLesson',    () => prisma.privateLesson.deleteMany({})],
    ['tournament',       () => prisma.tournament.deleteMany({})], // cascades division/registration/match
    ['order',            () => prisma.order.deleteMany({})],      // cascades orderItem
    ['product',          () => prisma.product.deleteMany({})],
    ['mediaItem',        () => prisma.mediaItem.deleteMany({})],  // cascades tags/hashtag-links/access
    ['hashtag',          () => prisma.hashtag.deleteMany({})],
    ['classFeedback',    () => prisma.classFeedback.deleteMany({})],
    ['trainingLog',      () => prisma.trainingLog.deleteMany({})],
    ['trainingReflection', () => prisma.trainingReflection.deleteMany({})],
    ['studentNote',      () => prisma.studentNote.deleteMany({})],
    ['lessonPlan',       () => prisma.lessonPlan.deleteMany({})],
    ['rankPromotion',    () => prisma.rankPromotion.deleteMany({})],
    ['classSubRequest',  () => prisma.classSubRequest.deleteMany({})],
    ['commitment',       () => prisma.commitment.deleteMany({})],
    ['attendance',       () => prisma.attendance.deleteMany({})],
    ['classSession',     () => prisma.classSession.deleteMany({})],
    ['class',            () => prisma.class.deleteMany({})],
    ['studentGoal',      () => prisma.studentGoal.deleteMany({})],
    ['competition',      () => prisma.competition.deleteMany({})],
    ['notification',     () => prisma.notification.deleteMany({})],
    ['directMessage',    () => prisma.directMessage.deleteMany({})],
    ['messageRequest',   () => prisma.messageRequest.deleteMany({})],
    ['follow',           () => prisma.follow.deleteMany({})],
    ['forumSubscription',() => prisma.forumSubscription.deleteMany({})],
    ['forumRead',        () => prisma.forumRead.deleteMany({})],
    ['pushSubscription', () => prisma.pushSubscription.deleteMany({})],
    ['publicEvent',      () => prisma.publicEvent.deleteMany({})],
    ['passwordResetToken', () => prisma.passwordResetToken.deleteMany({})],
    ['emailChangeToken', () => prisma.emailChangeToken.deleteMany({})],
    ['forum',            () => prisma.forum.deleteMany({})],
  ]
  console.log('── clearing content ──')
  for (const [name, fn] of clear) {
    const { count } = await fn()
    console.log(`  ${name}: ${count}`)
  }

  // ── Phase B: delete non-kept users ─────────────────────────────────────────
  const delUsers = await prisma.user.deleteMany({ where: { email: { notIn: KEEP_EMAILS } } })
  console.log(`── deleted users (not kept): ${delUsers.count}`)

  // ── Phase C: delete non-surviving gyms (cascades features/settings/memberships) ──
  const delGyms = await prisma.gym.deleteMany({ where: { id: { not: SURVIVING_GYM_ID } } })
  console.log(`── deleted gyms (not surviving): ${delGyms.count}`)

  // ── Phase D: reconstruct the single Ascend gym ─────────────────────────────
  await prisma.gym.update({
    where: { id: SURVIVING_GYM_ID },
    data: { name: 'Ascend Jiu Jitsu', slug: 'ascend', participatingStatus: 'free' },
  })

  // All kept gym members → Ascend (geof.hoffman@gmail.com stays gymless site_admin)
  const gymMemberEmails = ['geof.hoffman.ascend@gmail.com', 'instructor1@gym.com', 'admin@gym.com']
  const members = await prisma.user.findMany({ where: { email: { in: gymMemberEmails } }, select: { id: true, email: true } })
  for (const m of members) {
    await prisma.user.update({ where: { id: m.id }, data: { gymId: SURVIVING_GYM_ID } })
    await prisma.gymMembership.upsert({
      where: { userId_gymId: { userId: m.id, gymId: SURVIVING_GYM_ID } },
      create: { userId: m.id, gymId: SURVIVING_GYM_ID, status: 'active' },
      update: { status: 'active' },
    })
  }

  // Forums: General + 6am Crew under Ascend; subscribe the gym members.
  const ascendForums = [
    { id: 'ascend-general', title: 'General', type: 'general' as const },
    { id: 'ascend-6am-crew', title: '6am Crew', type: 'general' as const },
  ]
  for (const f of ascendForums) {
    await prisma.forum.upsert({
      where: { id: f.id },
      create: { id: f.id, title: f.title, type: f.type, gymId: SURVIVING_GYM_ID },
      update: { title: f.title, type: f.type, gymId: SURVIVING_GYM_ID },
    })
    for (const m of members) {
      await prisma.forumSubscription.upsert({
        where: { userId_forumId: { userId: m.id, forumId: f.id } },
        create: { userId: m.id, forumId: f.id },
        update: {},
      })
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const summary = {
    users: await prisma.user.count(),
    gyms: await prisma.gym.count(),
    forums: await prisma.forum.count(),
    posts: await prisma.post.count(),
  }
  const keptUsers = await prisma.user.findMany({ select: { email: true, roles: true, gymId: true } })
  const keptGyms = await prisma.gym.findMany({ select: { name: true, slug: true, participatingStatus: true } })
  console.log('── DONE ──')
  console.log('  counts: ' + JSON.stringify(summary))
  console.log('  users: ' + JSON.stringify(keptUsers))
  console.log('  gyms: ' + JSON.stringify(keptGyms))
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
