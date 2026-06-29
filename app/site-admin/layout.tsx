import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import Link from 'next/link'
import prisma from '@/lib/database'

const NAV: { href: string; label: string; badgeKey?: 'providers' }[] = [
  { href: '/site-admin', label: 'Dashboard' },
  { href: '/site-admin/users', label: 'Users' },
  { href: '/site-admin/gyms', label: 'Gyms' },
  { href: '/site-admin/events', label: 'Events' },
  { href: '/site-admin/forums', label: 'Forums' },
  { href: '/site-admin/gyms/new-review', label: 'New Gyms' },
  { href: '/site-admin/claims', label: 'Claims' },
  { href: '/provider/approvals', label: 'Provider Apps', badgeKey: 'providers' },
  { href: '/site-admin/admins', label: 'Admins' },
  { href: '/site-admin/user-feedback', label: 'User Feedback' },
  { href: '/site-admin/feedback', label: 'Tour Feedback' },
  { href: '/site-admin/settings', label: 'Feature Toggles' },
]

export default async function SiteAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('site_admin')) redirect('/dashboard')

  const pendingProviders = await prisma.user.count({ where: { providerStatus: 'pending' } })
  const badges: Record<string, number> = { providers: pendingProviders }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-52 flex-shrink-0 bg-ink-soft min-h-screen pt-8 pb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-ash px-5 mb-4">Platform Admin</p>
        <nav className="flex flex-col">
          {NAV.map(item => {
            const count = item.badgeKey ? badges[item.badgeKey] : 0
            return (
              <Link
                key={item.href}
                href={item.href}
                className="px-5 py-2.5 text-sm text-ash hover:text-paper hover:bg-steel/20 transition-colors flex items-center justify-between gap-2"
              >
                <span>{item.label}</span>
                {count > 0 && (
                  <span className="bg-brand-red text-paper text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{count}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Top nav — mobile */}
      <div className="md:hidden bg-ink-soft px-4 py-3 flex gap-4 overflow-x-auto">
        {NAV.map(item => {
          const count = item.badgeKey ? badges[item.badgeKey] : 0
          return (
            <Link key={item.href} href={item.href} className="text-sm text-ash hover:text-paper whitespace-nowrap flex-shrink-0 flex items-center gap-1.5">
              {item.label}
              {count > 0 && <span className="bg-brand-red text-paper text-[10px] font-bold rounded-full px-1.5 py-0.5">{count}</span>}
            </Link>
          )
        })}
      </div>

      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
