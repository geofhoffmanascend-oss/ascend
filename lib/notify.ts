import prisma from '@/lib/database'
import { NotificationType } from '@prisma/client'

const PREF_FIELD: Partial<Record<NotificationType, string>> = {
  class_update:    'notifyClassUpdates',
  instructor_note: 'notifyInstructorNotes',
  private_message: 'notifyPrivateMessages',
  checkin_prompt:  'notifyCheckinPrompts',
  feedback_prompt: 'notifyFeedbackPrompts',
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  options?: { body?: string; link?: string },
) {
  const prefField = PREF_FIELD[type]
  if (prefField) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        notifyClassUpdates:    true,
        notifyInstructorNotes: true,
        notifyPrivateMessages: true,
        notifyCheckinPrompts:  true,
        notifyFeedbackPrompts: true,
        notifyByEmail:         true,
      },
    })
    if (!user) return null
    const enabled = user[prefField as keyof typeof user]
    if (enabled === false) return null
    // TODO: if user.notifyByEmail, send email copy via nodemailer/resend
  }

  return prisma.notification.create({
    data: { userId, type, title, body: options?.body, link: options?.link },
  })
}
