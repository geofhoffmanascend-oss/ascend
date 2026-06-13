import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  if (session.user.id !== id && !session.user.roles?.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const {
    bio, phone, emergencyContact, belt, stripes, name, avatarUrl, weightClass, onboardingDone,
    notifyClassUpdates, notifyInstructorNotes, notifyPrivateMessages,
    notifyCheckinPrompts, notifyFeedbackPrompts, notifyByEmail, allowDmsFromStudents,
    allowMediaTagging, defaultJournalPrompts, profilePrivacy,
    hiddenClassGroups, hiddenProgramIds, onboardedRoles,
    competeTournaments, acceptsChallenges,
  } = body

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(bio !== undefined && { bio }),
      ...(phone !== undefined && { phone }),
      ...(emergencyContact !== undefined && { emergencyContact }),
      ...(belt !== undefined && { belt }),
      ...(stripes !== undefined && { stripes }),
      ...(name !== undefined && { name }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(weightClass !== undefined && { weightClass: weightClass || null }),
      ...(onboardingDone !== undefined && { onboardingDone }),
      ...(notifyClassUpdates !== undefined && { notifyClassUpdates }),
      ...(notifyInstructorNotes !== undefined && { notifyInstructorNotes }),
      ...(notifyPrivateMessages !== undefined && { notifyPrivateMessages }),
      ...(notifyCheckinPrompts !== undefined && { notifyCheckinPrompts }),
      ...(notifyFeedbackPrompts !== undefined && { notifyFeedbackPrompts }),
      ...(notifyByEmail !== undefined && { notifyByEmail }),
      ...(allowDmsFromStudents !== undefined && { allowDmsFromStudents }),
      ...(allowMediaTagging    !== undefined && { allowMediaTagging }),
      ...(defaultJournalPrompts !== undefined && { defaultJournalPrompts }),
      ...(profilePrivacy !== undefined && { profilePrivacy }),
      ...(hiddenClassGroups !== undefined && { hiddenClassGroups }),
      ...(hiddenProgramIds !== undefined && { hiddenProgramIds }),
      ...(onboardedRoles !== undefined && { onboardedRoles }),
      ...(competeTournaments !== undefined && { competeTournaments }),
      ...(acceptsChallenges !== undefined && { acceptsChallenges }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      belt: true,
      stripes: true,
      bio: true,
      onboardingDone: true,
    },
  })

  return NextResponse.json(user)
}
