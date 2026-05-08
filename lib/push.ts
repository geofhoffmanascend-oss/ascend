import webpush from 'web-push'
import prisma from '@/lib/database'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function sendPush(
  userId: string,
  payload: { title: string; body?: string; link?: string },
) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      ),
    ),
  )

  // Remove expired/invalid subscriptions
  const stale: string[] = []
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const status = (r.reason as { statusCode?: number })?.statusCode
      if (status === 410 || status === 404) stale.push(subs[i].endpoint)
    }
  })
  if (stale.length) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: stale } } })
  }
}
