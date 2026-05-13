import 'next-auth'
import 'next-auth/jwt'

export type AppRole = 'admin' | 'instructor' | 'student' | 'vendor'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      roles: AppRole[]
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
  }
}
