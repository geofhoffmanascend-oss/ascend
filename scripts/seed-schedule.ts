import prisma from '../lib/database'

async function main() {
  // Use the first instructor for all classes — can be reassigned in the admin panel
  const instructor = await prisma.user.findFirst({
    where: { roles: { has: 'instructor' } },
    select: { id: true, name: true },
  })
  if (!instructor) throw new Error('No instructor found — run db:seed first')
  console.log(`Assigning classes to: ${instructor.name} (${instructor.id})`)

  const classes = [
    // ── MONDAY ────────────────────────────────────────────────────────────────
    { title: 'Brazilian Jiu Jitsu', type: 'gi',               dayOfWeek: 'monday',    startTime: '06:00', endTime: '07:00' },
    { title: 'Brazilian Jiu Jitsu', type: 'gi',               dayOfWeek: 'monday',    startTime: '12:00', endTime: '13:00' },
    { title: 'Muay Thai',           type: 'muay_thai',         dayOfWeek: 'monday',    startTime: '17:30', endTime: '18:30' },
    { title: 'Wrestling',           type: 'wrestling',         dayOfWeek: 'monday',    startTime: '18:30', endTime: '19:30' },
    { title: 'Basics Gi',           type: 'fundamentals',      dayOfWeek: 'monday',    startTime: '18:30', endTime: '19:30' },
    { title: 'Brazilian Jiu Jitsu', type: 'gi',               dayOfWeek: 'monday',    startTime: '19:30', endTime: '20:30' },
    { title: 'Comp Team Training',  type: 'competition_prep',  dayOfWeek: 'monday',    startTime: '20:30', endTime: '21:30' },

    // ── TUESDAY ───────────────────────────────────────────────────────────────
    { title: 'Brazilian Jiu Jitsu', type: 'gi',               dayOfWeek: 'tuesday',   startTime: '12:00', endTime: '13:00' },
    { title: 'No-Gi BJJ',           type: 'nogi',              dayOfWeek: 'tuesday',   startTime: '16:30', endTime: '17:30' },
    { title: 'Self Defense Striking', type: 'self_defense',   dayOfWeek: 'tuesday',   startTime: '17:30', endTime: '18:30' },
    { title: 'Basics Gi',           type: 'fundamentals',      dayOfWeek: 'tuesday',   startTime: '18:30', endTime: '19:30' },
    { title: 'Wrestling',           type: 'wrestling',         dayOfWeek: 'tuesday',   startTime: '18:30', endTime: '19:30' },
    { title: 'Brazilian Jiu Jitsu', type: 'gi',               dayOfWeek: 'tuesday',   startTime: '19:30', endTime: '20:30' },

    // ── WEDNESDAY ─────────────────────────────────────────────────────────────
    { title: 'No-Gi Jiu Jitsu',     type: 'nogi',              dayOfWeek: 'wednesday', startTime: '06:00', endTime: '07:00' },
    { title: 'No-Gi BJJ',           type: 'nogi',              dayOfWeek: 'wednesday', startTime: '12:00', endTime: '13:00' },
    { title: 'Muay Thai',           type: 'muay_thai',         dayOfWeek: 'wednesday', startTime: '17:30', endTime: '18:30' },
    { title: 'No-Gi Basics',        type: 'nogi_fundamentals', dayOfWeek: 'wednesday', startTime: '18:30', endTime: '19:30' },
    { title: 'No-Gi BJJ',           type: 'nogi',              dayOfWeek: 'wednesday', startTime: '19:30', endTime: '20:30' },
    { title: 'Comp Team Training',  type: 'competition_prep',  dayOfWeek: 'wednesday', startTime: '20:30', endTime: '21:30' },

    // ── THURSDAY ──────────────────────────────────────────────────────────────
    { title: 'No-Gi BJJ',           type: 'nogi',              dayOfWeek: 'thursday',  startTime: '12:00', endTime: '13:00' },
    { title: 'No-Gi BJJ',           type: 'nogi',              dayOfWeek: 'thursday',  startTime: '16:30', endTime: '17:30' },
    { title: 'Self Defense Striking', type: 'self_defense',   dayOfWeek: 'thursday',  startTime: '17:30', endTime: '18:30' },
    { title: 'No-Gi Basics',        type: 'nogi_fundamentals', dayOfWeek: 'thursday',  startTime: '18:30', endTime: '19:30' },
    { title: 'No-Gi BJJ',           type: 'nogi',              dayOfWeek: 'thursday',  startTime: '19:30', endTime: '20:30' },

    // ── FRIDAY ────────────────────────────────────────────────────────────────
    { title: 'No-Gi Jiu Jitsu',     type: 'nogi',              dayOfWeek: 'friday',    startTime: '06:00', endTime: '07:00' },
    { title: 'Open Mat',            type: 'open_mat',          dayOfWeek: 'friday',    startTime: '12:00', endTime: '14:00' },
    { title: 'Muay Thai',           type: 'muay_thai',         dayOfWeek: 'friday',    startTime: '17:30', endTime: '18:30' },

    // ── SATURDAY ──────────────────────────────────────────────────────────────
    { title: 'Self Defense Striking', type: 'self_defense',   dayOfWeek: 'saturday',  startTime: '10:00', endTime: '11:00' },
    { title: 'Basics Gi',           type: 'fundamentals',      dayOfWeek: 'saturday',  startTime: '11:00', endTime: '12:00' },
    { title: 'Comp Drills',         type: 'competition_prep',  dayOfWeek: 'saturday',  startTime: '11:00', endTime: '12:00' },
    { title: 'Open Mat',            type: 'open_mat',          dayOfWeek: 'saturday',  startTime: '12:00', endTime: '14:00' },

    // ── SUNDAY ────────────────────────────────────────────────────────────────
    { title: 'Muay Thai',           type: 'muay_thai',         dayOfWeek: 'sunday',    startTime: '17:30', endTime: '18:30' },
  ]

  let created = 0
  for (const c of classes) {
    const existing = await prisma.class.findFirst({
      where: { title: c.title, dayOfWeek: c.dayOfWeek as never, startTime: c.startTime },
    })
    if (existing) continue

    await prisma.class.create({
      data: {
        instructorId: instructor.id,
        title: c.title,
        type: c.type as never,
        dayOfWeek: c.dayOfWeek as never,
        startTime: c.startTime,
        endTime: c.endTime,
        isActive: true,
      },
    })
    created++
  }

  console.log(`Created ${created} classes (${classes.length - created} already existed)`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
