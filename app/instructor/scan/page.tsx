import { requireInstructor } from '@/lib/instructorAuth'
import { QRScanForm } from './QRScanForm'
import prisma from '@/lib/database'

export default async function QRScanPage() {
  await requireInstructor()

  // Get today's sessions for the optional class selector
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setUTCDate(today.getUTCDate() + 1)

  const sessions = await prisma.classSession.findMany({
    where: { date: { gte: today, lt: tomorrow }, cancelled: false },
    include: { class: { select: { title: true, startTime: true } } },
    orderBy: { class: { startTime: 'asc' } },
  })

  const sessionOptions = sessions.map(s => ({
    id: s.id,
    label: `${s.class.title} (${s.class.startTime})`,
  }))

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
            Instructor
          </span>
        </div>
        <h1 className="font-display text-2xl text-ink">QR Check-in Scanner</h1>
        <p className="text-sm text-ash mt-1">Scan or enter a member's QR token to check them in.</p>
      </div>
      <QRScanForm sessions={sessionOptions} />
    </div>
  )
}
