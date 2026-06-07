import { requireAdmin } from '@/lib/adminAuth'
import { getGymSettings } from '@/lib/gymSettings'
import { getGymFeatures } from '@/lib/gymFeatures'
import prisma from '@/lib/database'
import Link from 'next/link'
import { AdminSettingsForm } from './AdminSettingsForm'
import { GymLogoForm } from './GymLogoForm'
import { GymFeaturesForm } from './GymFeaturesForm'

export default async function AdminSettingsPage() {
  const { session } = await requireAdmin()
  const settings = await getGymSettings(session?.user?.gymId)
  const features = await getGymFeatures(session?.user?.gymId)
  const gym = session?.user?.gymId
    ? await prisma.gym.findUnique({ where: { id: session.user.gymId }, select: { logoUrl: true } })
    : null

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/admin" className="text-xs text-ash hover:text-ink transition-colors">← Admin</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Admin</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Gym Settings</h1>
      </div>
      <div className="flex flex-col gap-8">
        <GymLogoForm initial={{ logoUrl: gym?.logoUrl ?? '' }} />
        <AdminSettingsForm initial={{ reviewUrl: settings.reviewUrl ?? '' }} />
        <GymFeaturesForm initial={features} />
      </div>
    </div>
  )
}
