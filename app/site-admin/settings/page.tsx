import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { getPlatformSettings } from '@/lib/platformSettings'
import { PlatformSettingsClient } from './PlatformSettingsClient'

export const metadata = { title: 'Platform Settings — Site Admin' }

export default async function SiteAdminSettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('site_admin')) redirect('/dashboard')

  const settings = await getPlatformSettings()

  return (
    <div className="px-6 py-10 max-w-2xl">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Platform</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Feature Toggles</h1>
        <p className="text-sm text-ash mt-1">
          Control which features are active platform-wide. Toggles take effect immediately — no deploy required.
          Site admins and gym admins are never affected by these restrictions.
        </p>
      </div>
      <PlatformSettingsClient initial={settings} />
    </div>
  )
}
