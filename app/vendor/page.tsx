import type { Metadata } from "next"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Vendor Portal' }

export default async function VendorDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('vendor') && !session.user.roles?.includes('admin')) redirect('/dashboard')

  const isPhotographer = false // will read from user.vendorType after db push
  const isMerchant = false

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Vendor</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Vendor Dashboard</h1>
        <p className="text-ash text-sm mt-1">Manage your listings and sales.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-smoke bg-paper p-6 opacity-60">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-2">Photo Sales</p>
          <p className="text-slate text-sm">Upload and sell photos from the gym. Coming soon.</p>
        </div>
        <div className="border border-smoke bg-paper p-6 opacity-60">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-2">Merchandise</p>
          <p className="text-slate text-sm">Manage your products in the gym store. Coming soon.</p>
        </div>
        <Link href="/dashboard" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Dashboard</p>
          <p className="text-slate text-sm">Back to student view</p>
        </Link>
      </div>
    </div>
  )
}
