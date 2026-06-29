import type { Metadata } from "next"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { getMondayOfWeek } from '@/lib/generateSessions'
import { getGymSetup } from '@/lib/gymSetup'
import { GymSetupCard } from './GymSetupCard'
import { TourAutoPromptGate } from '@/app/components/TourAutoPromptGate'
import { canApproveProviders } from '@/lib/provider'

export const metadata = { title: 'Admin' }

export default async function AdminHomePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('admin')) redirect('/dashboard')

  const setupProgress = await getGymSetup(session.user.gymId)

  const monday = getMondayOfWeek(new Date())
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  sunday.setUTCHours(23, 59, 59, 999)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setUTCHours(23, 59, 59, 999)

  // Scope all dashboard stats to THIS admin's gym (multi-tenancy).
  const gymId = session.user.gymId ?? null

  const [totalMembers, totalInstructors, todaySessions, newSignups, me] = await Promise.all([
    prisma.user.count({ where: { gymId } }),
    prisma.user.count({ where: { gymId, roles: { hasSome: ['instructor', 'admin'] } } }),
    prisma.classSession.count({ where: { date: { gte: today, lte: todayEnd }, class: { isActive: true, gymId } } }),
    prisma.user.count({ where: { gymId, createdAt: { gte: weekAgo } } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { belt: true, beltVerified: true, roles: true } }),
  ])

  // Independent-provider applications are approved by verified black belts (Phase 42.4) —
  // surface a queue link for those approvers who manage from the admin dashboard.
  const canApprove = !!me && canApproveProviders(me)
  const pendingProviders = canApprove
    ? await prisma.user.count({ where: { providerStatus: 'pending' } })
    : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <TourAutoPromptGate />

      {canApprove && pendingProviders > 0 && (
        <Link href="/provider/approvals" className="flex items-center justify-between gap-3 border border-brand-red/30 bg-brand-red/5 p-4 mb-6 hover:border-brand-red transition-colors">
          <div>
            <p className="text-sm font-bold text-ink">{pendingProviders} private instructor {pendingProviders === 1 ? 'application' : 'applications'} to review →</p>
            <p className="text-xs text-slate mt-0.5">Approve or reject black-belt-verified instructors applying to teach privates.</p>
          </div>
          <span className="bg-brand-red text-paper text-xs font-bold rounded-full px-2.5 py-1">{pendingProviders}</span>
        </Link>
      )}
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Admin</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Admin Dashboard</h1>
      </div>

      {/* Phase 38.3 — owner setup checklist (hides itself once complete) */}
      <GymSetupCard initial={setupProgress} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Members', value: totalMembers },
          { label: 'Instructors', value: totalInstructors },
          { label: 'Classes Today', value: todaySessions },
          { label: 'New This Week', value: newSignups },
        ].map(s => (
          <div key={s.label} className="border border-smoke bg-paper p-5">
            <p className="text-2xl font-display font-bold text-ink">{s.value}</p>
            <p className="text-xs text-ash uppercase tracking-wide mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Link href="/admin/users" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Users</p>
          <p className="text-slate text-sm">Manage members and instructors</p>
        </Link>
        <Link href="/admin/classes" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Classes</p>
          <p className="text-slate text-sm">Create and manage class schedule</p>
        </Link>
        <Link href="/admin/attendance" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Attendance</p>
          <p className="text-slate text-sm">Reports and history</p>
        </Link>
        <Link href="/admin/forum" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Forums</p>
          <p className="text-slate text-sm">Moderation and subscriptions</p>
        </Link>
        <Link href="/admin/feedback" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Feedback</p>
          <p className="text-slate text-sm">Member class feedback</p>
        </Link>
        <Link href="/admin/store" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Gear Store</p>
          <p className="text-slate text-sm">Products, orders, and pickup confirmation</p>
        </Link>
        <Link href="/admin/tournaments" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Tournaments</p>
          <p className="text-slate text-sm">Create and manage in-house scrimmages</p>
        </Link>
        <Link href="/admin/settings" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Gym Settings</p>
          <p className="text-slate text-sm">Review URL and gym configuration</p>
        </Link>
        <Link href="/instructor" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Instructor View</p>
          <p className="text-slate text-sm">Today's sessions and rosters</p>
        </Link>
        <Link href="/dashboard" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">My Dashboard</p>
          <p className="text-slate text-sm">Your personal athlete dashboard — training, schedule, journal</p>
        </Link>
      </div>
    </div>
  )
}
