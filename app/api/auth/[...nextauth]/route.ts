import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import prisma from '@/lib/database'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  jwt: { maxAge: 30 * 24 * 60 * 60 },
  logger: {
    error(code, metadata) {
      console.error('[NextAuth]', code, metadata)
    },
    warn(code) {
      console.warn('[NextAuth]', code)
    },
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })
          if (!user?.passwordHash) {
            console.log('[auth] credentials: no user or password hash for', credentials.email)
            return null
          }

          const valid = await bcrypt.compare(credentials.password, user.passwordHash)
          if (!valid) {
            console.log('[auth] credentials: invalid password for', credentials.email)
            return null
          }

          return { id: user.id, name: user.name, email: user.email, roles: user.roles as any }
        } catch (err) {
          console.error('[auth] credentials authorize error:', err)
          return null
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Google verifies email ownership, so it's safe to link a Google sign-in to an
      // existing account that shares the same email (e.g. one created via credentials).
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: { prompt: 'select_account' },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.roles = (user as any).roles ?? ['student']
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { gymId: true, belt: true } })
          token.gymId = dbUser?.gymId ?? null
          token.belt = dbUser?.belt ?? null
        } catch (err) {
          console.error('[auth] jwt gymId fetch error for user.id', user.id, err)
          token.gymId = null
          token.belt = null
        }
      } else if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: token.id }, select: { roles: true, gymId: true, belt: true } })
          if (dbUser) {
            token.roles = dbUser.roles as any
            token.gymId = dbUser.gymId ?? null
            token.belt = dbUser.belt ?? null
          }
        } catch (err) {
          console.error('[auth] jwt role refresh error for token.id', token.id, err)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.roles = token.roles ?? ['student']
        session.user.gymId = token.gymId ?? null
        session.user.belt = token.belt ?? null
      }
      return session
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log('[auth] signIn provider=%s userId=%s', account?.provider, user.id)
      // Record login for admin stats (last login + 30-day count). Best-effort.
      try {
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
        await prisma.loginEvent.create({ data: { userId: user.id } })
      } catch (err) {
        console.error('[auth] login tracking error:', err)
      }
      if (account?.provider === 'google') {
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
          if (dbUser && (!dbUser.roles || dbUser.roles.length === 0)) {
            await prisma.user.update({
              where: { id: user.id },
              data: { roles: ['student'] },
            })
          }
        } catch (err) {
          console.error('[auth] google signIn role init error:', err)
        }
      }
    },
    async signOut({ token }) {
      console.log('[auth] signOut userId=%s', token?.sub)
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
