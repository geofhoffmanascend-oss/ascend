import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      notifyClassUpdates:    true,
      notifyInstructorNotes: true,
      notifyPrivateMessages: true,
      notifyCheckinPrompts:  true,
      notifyFeedbackPrompts: true,
      notifyByEmail:         true,
      allowDmsFromStudents:  true,
    },
  })

  if (!user) redirect('/login')

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
            Settings
          </span>
        </div>
        <h1 className="font-display text-2xl text-ink">Notification Settings</h1>
      </div>
      <SettingsForm userId={session.user.id} initial={user} />
    </div>
  )
}
