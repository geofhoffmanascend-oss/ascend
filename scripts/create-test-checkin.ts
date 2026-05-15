import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { ca: fs.readFileSync(path.resolve(process.env.HOME!, '.postgresql/root.crt')).toString() },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  // Find any student-role user
  const student = await prisma.user.findFirst({ where: { roles: { has: 'student' } } })
  if (!student) throw new Error('No student-role user found')
  console.log('Found student:', student.name, '| qrToken:', student.qrToken)

  const instructor = await prisma.user.findFirst({ where: { roles: { hasSome: ['instructor', 'admin'] } } })
  if (!instructor) throw new Error('No instructor/admin found')

  // Create or find a test class
  let cls = await prisma.class.findFirst({ where: { title: 'Test QR Checkin Class' } })
  if (!cls) {
    cls = await prisma.class.create({
      data: {
        title: 'Test QR Checkin Class',
        type: 'gi',
        startTime: '10:00',
        endTime: '11:00',
        dayOfWeek: ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()] as any,
        instructorId: instructor.id,
      },
    })
    console.log('Created class:', cls.id)
  } else {
    console.log('Reusing class:', cls.id)
  }

  // Today's date at midnight UTC
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // Create or find today's session
  let session = await prisma.classSession.findFirst({
    where: { classId: cls.id, date: today },
  })
  if (!session) {
    session = await prisma.classSession.create({
      data: { classId: cls.id, date: today },
    })
    console.log('Created session:', session.id, 'for', today.toISOString().slice(0, 10))
  } else {
    console.log('Reusing session:', session.id)
  }

  // Register student
  const existing = await prisma.commitment.findFirst({
    where: { userId: student.id, classSessionId: session.id },
  })
  if (!existing) {
    await prisma.commitment.create({
      data: { userId: student.id, classSessionId: session.id },
    })
    console.log('Registered student for session')
  } else {
    console.log('Student already registered')
  }

  console.log('\nQR check-in URL:')
  console.log(`  http://localhost:3002/checkin/${student.qrToken}`)
  console.log(`  https://ascend-ten-olive.vercel.app/checkin/${student.qrToken}`)
}

main().finally(() => pool.end())
