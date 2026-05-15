import 'dotenv/config'
import * as dotenvLocal from 'dotenv'
dotenvLocal.config({ path: '.env.local', override: true })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import fs from 'fs'
import os from 'os'
import path from 'path'
import bcrypt from 'bcryptjs'

async function main() {
  const dbUrl = new URL(process.env.DATABASE_URL!)
  const certPath = path.join(os.homedir(), '.postgresql', 'root.crt')
  const ca = fs.existsSync(certPath) ? fs.readFileSync(certPath).toString() : undefined

  const pool = new Pool({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || '26257'),
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.replace(/^\//, ''),
    ssl: ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: false },
  })

  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  try {
    console.log('Seeding…')

    // ── Users ──────────────────────────────────────────────────────────────────
    const adminHash = await bcrypt.hash('admin1234', 12)
    const instrHash = await bcrypt.hash('instructor1234', 12)
    const studHash  = await bcrypt.hash('student1234', 12)

    const admin = await prisma.user.upsert({
      where: { email: 'admin@gym.com' },
      update: {},
      create: {
        email: 'admin@gym.com',
        name: 'Admin User',
        passwordHash: adminHash,
        roles: ['admin'],
        belt: 'black',
        stripes: 0,
        onboardingDone: true,
      },
    })

    const instructor1 = await prisma.user.upsert({
      where: { email: 'instructor1@gym.com' },
      update: {},
      create: {
        email: 'instructor1@gym.com',
        name: 'Marcus Silva',
        passwordHash: instrHash,
        roles: ['instructor'],
        belt: 'black',
        stripes: 2,
        onboardingDone: true,
        bio: 'Black belt under Rickson Gracie lineage. 15 years teaching.',
      },
    })

    const instructor2 = await prisma.user.upsert({
      where: { email: 'instructor2@gym.com' },
      update: {},
      create: {
        email: 'instructor2@gym.com',
        name: 'Dana Lee',
        passwordHash: instrHash,
        roles: ['instructor'],
        belt: 'brown',
        stripes: 3,
        onboardingDone: true,
        bio: 'Competition specialist. Kids & fundamentals focus.',
      },
    })

    const studentData = [
      { email: 'student1@gym.com', name: 'Alex Ramos',  belt: 'blue'   as const, stripes: 2 },
      { email: 'student2@gym.com', name: 'Jamie Chen',  belt: 'purple' as const, stripes: 1 },
      { email: 'student3@gym.com', name: 'Sam Torres',  belt: 'white'  as const, stripes: 3 },
      { email: 'student4@gym.com', name: 'Priya Nair',  belt: 'blue'   as const, stripes: 0 },
      { email: 'student5@gym.com', name: 'Eli Grant',   belt: 'white'  as const, stripes: 1 },
    ]

    for (const s of studentData) {
      await prisma.user.upsert({
        where: { email: s.email },
        update: {},
        create: { ...s, passwordHash: studHash, roles: ['student'], onboardingDone: true },
      })
    }
    console.log('  ✓ Users (1 admin, 2 instructors, 5 students)')

    // ── Classes ────────────────────────────────────────────────────────────────
    const mondayGi = await prisma.class.upsert({
      where: { id: 'seed-class-monday-gi' },
      update: {},
      create: {
        id: 'seed-class-monday-gi',
        instructorId: instructor1.id,
        title: 'Monday Gi',
        type: 'gi',
        dayOfWeek: 'monday',
        startTime: '18:00',
        endTime: '19:30',
        location: 'Main Mat',
        isActive: true,
      },
    })

    const wednesdayNogi = await prisma.class.upsert({
      where: { id: 'seed-class-wednesday-nogi' },
      update: {},
      create: {
        id: 'seed-class-wednesday-nogi',
        instructorId: instructor1.id,
        title: 'Wednesday No-Gi',
        type: 'nogi',
        dayOfWeek: 'wednesday',
        startTime: '18:00',
        endTime: '19:30',
        location: 'Main Mat',
        isActive: true,
      },
    })

    const saturdayOpenMat = await prisma.class.upsert({
      where: { id: 'seed-class-saturday-openmat' },
      update: {},
      create: {
        id: 'seed-class-saturday-openmat',
        instructorId: instructor2.id,
        title: 'Saturday Open Mat',
        type: 'open_mat',
        dayOfWeek: 'saturday',
        startTime: '10:00',
        endTime: '12:00',
        location: 'Main Mat',
        isActive: true,
      },
    })
    console.log('  ✓ Classes (Monday Gi, Wednesday No-Gi, Saturday Open Mat)')

    // ── Forums ─────────────────────────────────────────────────────────────────
    await prisma.forum.upsert({
      where: { id: 'seed-forum-general' },
      update: {},
      create: {
        id: 'seed-forum-general',
        type: 'general',
        title: 'General Discussion',
        description: 'Open conversation for all gym members.',
      },
    })

    await prisma.forum.upsert({
      where: { id: 'seed-forum-announcements' },
      update: {},
      create: {
        id: 'seed-forum-announcements',
        type: 'announcement',
        title: 'Gym Announcements',
        description: 'Official updates from gym staff.',
      },
    })

    for (const cls of [mondayGi, wednesdayNogi, saturdayOpenMat]) {
      const existing = await prisma.forum.findUnique({ where: { classId: cls.id } })
      if (!existing) {
        await prisma.forum.create({
          data: {
            type: 'class_forum',
            classId: cls.id,
            title: `${cls.title} Forum`,
            description: `Discussion for ${cls.title}.`,
          },
        })
      }
    }
    await prisma.forum.upsert({
      where: { id: 'seed-forum-instructors' },
      update: {},
      create: {
        id: 'seed-forum-instructors',
        type: 'instructor_only' as any,
        title: 'Instructor Forum',
        description: 'Private forum for instructors and admins only.',
      },
    })

    console.log('  ✓ Forums (general, announcements, 3 class forums, instructor)')

    console.log('Seed complete.')
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch(e => { console.error(e); process.exit(1) })
