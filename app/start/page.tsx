import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

// Post-login landing decider. Sends gym admins to their admin dashboard and
// everyone else to the personal dashboard. Used by both credentials and Google
// sign-in so the default landing is role-aware (Google's callbackUrl is a
// static server redirect, so it needs a real page to branch on role).
export default async function StartPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (session.user.roles?.includes('admin')) redirect('/admin')
  redirect('/dashboard')
}
