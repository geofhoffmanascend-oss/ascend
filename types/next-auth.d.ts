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
  }
}
