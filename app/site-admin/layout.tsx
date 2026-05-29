import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import Link from 'next/link'

const NAV = [
  { href: '/site-admin', label: 'Dashboard' },
  { href: '/site-admin/gyms', label: 'Gyms' },
  { href: '/site-admin/events', label: 'Events' },
  { href: '/site-admin/forums', label: 'Forums' },
  { href: '/site-admin/gyms/new-review', label: 'New Gyms' },
]

export default async function SiteAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('site_admin')) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-52 flex-shrink-0 bg-ink-soft min-h-screen pt-8 pb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-ash px-5 mb-4">Platform Admin</p>
        <nav className="flex flex-col">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="px-5 py-2.5 text-sm text-ash hover:text-paper hover:bg-steel/20 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Top nav — mobile */}
      <div className="md:hidden bg-ink-soft px-4 py-3 flex gap-4 overflow-x-auto">
        {NAV.map(item => (
          <Link key={item.href} href={item.href} className="text-sm text-ash hover:text-paper whitespace-nowrap flex-shrink-0">
            {item.label}
          </Link>
        ))}
      </div>

      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
