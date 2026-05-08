import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: 'admin' | 'instructor' | 'student'
    }
  }

  interface User {
    role: 'admin' | 'instructor' | 'student'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'admin' | 'instructor' | 'student'
  }
}
