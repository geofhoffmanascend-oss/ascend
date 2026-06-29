'use client'

import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'
import { FeatureIntroAuto } from './components/FeatureIntroAuto'
import { FeedbackButton } from './components/FeedbackButton'

export function Providers({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  return (
    <SessionProvider session={session}>
      {children}
      <FeatureIntroAuto />
      <FeedbackButton />
    </SessionProvider>
  )
}
