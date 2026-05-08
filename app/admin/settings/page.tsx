import { requireAdmin } from '@/lib/adminAuth'
import { getGymSettings } from '@/lib/gymSettings'
import Link from 'next/link'
import { AdminSettingsForm } from './AdminSettingsForm'

export default async function AdminSettingsPage() {
  await requireAdmin()
  const settings = await getGymSettings()

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
      <AdminSettingsForm initial={{ reviewUrl: settings.reviewUrl ?? '' }} />
    </div>
  )
}
