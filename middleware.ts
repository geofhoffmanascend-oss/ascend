import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl
    const roles: string[] = (token?.roles as string[]) ?? []

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
        const publicPaths = ['/', '/about', '/login', '/register']
        if (publicPaths.some(p => pathname === p)) return true
        if (pathname.startsWith('/checkin')) return true
        if (pathname.startsWith('/tour')) return true
        if (pathname.startsWith('/profile/')) return true
        if (pathname.startsWith('/invite/')) return true
        if (pathname.startsWith('/gyms/') && !pathname.startsWith('/gyms/register')) return true
        if (pathname === '/events' || pathname.startsWith('/events/') && !pathname.startsWith('/events/new')) return true
        // Public tournament results (page self-gates on isPublic; detail page redirects anon to login)
        if (pathname.startsWith('/tournaments/')) return true
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
