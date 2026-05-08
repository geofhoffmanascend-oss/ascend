import prisma from '@/lib/database'
import { isInCheckinWindow } from '@/lib/checkin'
import { CheckinConfirm } from './CheckinConfirm'

export default async function PublicCheckinPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const student = await prisma.user.findUnique({
    where: { qrToken: token },
    select: { id: true, name: true },
  })

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-4">
        <div className="text-center">
          <p className="text-ink font-display text-xl mb-2">Invalid QR code</p>
          <p className="text-ash text-sm">This code is not recognised.</p>
        </div>
      </div>
    )
  }

  const commitments = await prisma.commitment.findMany({
    where: { userId: student.id },
    include: {
      classSession: {
        include: { class: { select: { title: true, startTime: true, endTime: true } } },
      },
    },
  })

  const todaySessions = commitments
    .filter(c => isInCheckinWindow(c.classSession.date))
    .map(c => ({
      id: c.classSessionId,
      title: c.classSession.class.title,
      time: `${c.classSession.class.startTime}–${c.classSession.class.endTime}`,
    }))

  return (
    <CheckinConfirm
      token={token}
      studentName={student.name ?? 'Student'}
      sessions={todaySessions}
    />
  )
}
