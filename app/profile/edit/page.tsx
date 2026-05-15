import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { EditProfileForm } from './EditProfileForm'

export default async function EditProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      bio: true,
      phone: true,
      emergencyContact: true,
      avatarUrl: true,
      weightClass: true,
      profilePrivacy: true,
    },
  })

  if (!user) redirect('/login')

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
            Profile
          </span>
        </div>
        <h1 className="font-display text-2xl text-ink">Edit Profile</h1>
      </div>

      <EditProfileForm
        userId={session.user.id}
        initial={{
          name: user.name ?? '',
          bio: user.bio ?? '',
          phone: user.phone ?? '',
          emergencyContact: user.emergencyContact ?? '',
          avatarUrl: user.avatarUrl ?? '',
          weightClass: user.weightClass ?? '',
        }}
        profilePrivacy={(user.profilePrivacy as Record<string, string>) ?? {}}
      />
    </div>
  )
}
