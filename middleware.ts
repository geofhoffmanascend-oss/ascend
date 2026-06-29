import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { SIMPLE_LAUNCH } from '@/lib/launchMode'

// Page surfaces hidden in simple-launch mode (gym-management + paused features). Code retained;
// these just redirect to the dashboard. /site-admin stays (owner control panel).
const LAUNCH_HIDDEN_PREFIXES = ['/admin', '/instructor', '/vendor', '/tournaments', '/store', '/gyms/register']

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl
    // Phase 53 — while viewing as another user, gate page access by the VIEWED
    // user's roles so the impersonator sees exactly what that user sees. The real
    // account's roles are never changed; "Exit view" restores them.
    const roles: string[] = (token?.viewAs
      ? (token?.viewAsRoles as string[] | undefined)
      : (token?.roles as string[] | undefined)) ?? []

    // Phase 53 — read-only "view as": block every write from the viewed account
    // (except NextAuth, which is needed to exit view-as). GETs pass through.
    if (
      token?.viewAs &&
      pathname.startsWith('/api/') &&
      !pathname.startsWith('/api/auth') &&
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method)
    ) {
      return NextResponse.json({ error: 'Read-only — you are viewing as another user.' }, { status: 403 })
    }

    // Public-launch pivot: the gym class schedule is replaced by the personal training schedule.
    if (SIMPLE_LAUNCH && (pathname === '/schedule' || pathname.startsWith('/schedule/'))) {
      return NextResponse.redirect(new URL('/my-training', req.url))
    }

    // Public-launch pivot: hide gym-management + paused surfaces (code retained).
    if (
      SIMPLE_LAUNCH &&
      !pathname.startsWith('/api/') &&
      LAUNCH_HIDDEN_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
    ) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (pathname.startsWith('/admin') && !roles.includes('admin')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (pathname.startsWith('/site-admin') && !roles.includes('site_admin')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (
      pathname.startsWith('/instructor') &&
      !roles.includes('instructor') &&
      !roles.includes('admin')
    ) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (
      pathname.startsWith('/vendor') &&
      !roles.includes('vendor') &&
      !roles.includes('admin')
    ) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        const publicPaths = ['/', '/about', '/ethos', '/login', '/register', '/terms', '/privacy']
        if (publicPaths.some(p => pathname === p)) return true
        if (pathname.startsWith('/checkin')) return true
        if (pathname.startsWith('/tour')) return true
        if (pathname.startsWith('/profile/')) return true
        if (pathname.startsWith('/invite/')) return true
        if (pathname.startsWith('/gyms/') && !pathname.startsWith('/gyms/register') && !pathname.startsWith('/gyms/claim')) return true
        if (pathname === '/events' || pathname.startsWith('/events/') && !pathname.startsWith('/events/new')) return true
        // Public tournament results (page self-gates on isPublic; detail page redirects anon to login)
        if (pathname.startsWith('/tournaments/')) return true
        // Phase 58 — login-free public match scoreboard
        if (pathname.startsWith('/scoreboard/')) return true
        if (pathname.startsWith('/api/scoreboard/')) return true
        // Phase 60 — tour feedback accepts anonymous pre-onboarding viewers
        if (pathname.startsWith('/api/tour/feedback')) return true
        if (pathname.startsWith('/api/events') && req.method === 'GET') return true
        if (pathname.startsWith('/api/auth')) return true
        if (pathname.startsWith('/api/checkin/public')) return true
        if (pathname.startsWith('/api/profile')) return true
        if (pathname.startsWith('/api/gyms')) return true
        if (pathname === '/reset-password') return true
        if (pathname === '/forgot-password') return true
        if (pathname === '/confirm-email') return true
        if (pathname.startsWith('/api/auth/reset-password')) return true
        if (pathname.startsWith('/api/auth/forgot-password')) return true
        if (pathname.startsWith('/api/auth/confirm-email')) return true
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|icons/|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.webp$|.*\\.ico$).*)'],
}
