import 'next-auth'
import 'next-auth/jwt'

export type AppRole = 'admin' | 'instructor' | 'student' | 'vendor' | 'site_admin'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      roles: AppRole[]
      gymId: string | null
      belt?: string | null
    }
    // Phase 53 — read-only "view as": present when an admin is viewing the app
    // as another user. session.user reflects the VIEWED user; viewAs carries the
    // real admin's identity + whether they're a site admin (controls DM access).
    viewAs?: {
      realId: string
      realName: string | null
      viewedId: string
      viewedName: string | null
      bySiteAdmin: boolean
    } | null
  }

  interface User {
    roles: AppRole[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    roles: AppRole[]
    gymId?: string | null
    belt?: string | null
    viewAs?: string | null         // viewed user id
    viewBySiteAdmin?: boolean       // real admin is a site_admin
  }
}
