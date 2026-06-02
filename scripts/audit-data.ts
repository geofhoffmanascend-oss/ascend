import prisma from '../lib/database'

async function main() {
  const gyms = await prisma.gym.findMany({
    select: { id: true, name: true, slug: true, participatingStatus: true, _count: { select: { members: true } } },
    orderBy: { name: 'asc' },
  })
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, roles: true, gymId: true },
    orderBy: { createdAt: 'asc' },
  })
  const forums = await prisma.forum.findMany({
    select: { id: true, title: true, type: true, gymId: true, _count: { select: { posts: true } } },
    orderBy: { createdAt: 'asc' },
  })
  const counts = {
    users: users.length,
    posts: await prisma.post.count(),
    gyms: gyms.length,
    forums: forums.length,
    mediaItems: await prisma.mediaItem.count(),
    commitments: await prisma.commitment.count(),
    trainingLogs: await prisma.trainingLog.count(),
    tournaments: await prisma.tournament.count(),
  }
  console.log('=== GYMS ===')
  for (const g of gyms) console.log(`  ${g.name} [${g.participatingStatus}] slug=${g.slug} members=${g._count.members} id=${g.id}`)
  console.log('=== USERS ===')
  for (const u of users) console.log(`  ${u.email} | ${u.name ?? '?'} | roles=${(u.roles ?? []).join(',')} | gymId=${u.gymId ?? '-'}`)
  console.log('=== FORUMS ===')
  for (const f of forums) console.log(`  [${f.type}] ${f.title} | gymId=${f.gymId ?? '-'} | posts=${f._count.posts} | id=${f.id}`)
  console.log('=== COUNTS ===')
  console.log('  ' + JSON.stringify(counts))
  process.exit(0)
}
main()
