import type { Metadata, Viewport } from 'next'
import { Analytics } from "@vercel/analytics/next"
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'
import { getEffectiveFeatures } from '@/lib/features'
import prisma from '@/lib/database'
import { Providers } from './providers'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ViewAsBanner } from './components/ViewAsBanner'
import { LayoutChrome } from './components/LayoutChrome'
import { ServiceWorkerRegistration } from './components/ServiceWorkerRegistration'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })

export const metadata: Metadata = {
  title: { default: 'AscendIt', template: '%s | AscendIt' },
  description: 'The Journey. The Art. The Community.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AscendIt',
  },
}

export const viewport: Viewport = {
  themeColor: '#182848',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const features = session ? await getEffectiveFeatures(session) : null
  const isProvider = session?.user?.id
    ? (await prisma.user.findUnique({ where: { id: session.user.id }, select: { providerStatus: true } }))?.providerStatus === 'approved'
    : false
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body suppressHydrationWarning>
        <Providers session={session}>
          <LayoutChrome
            banner={<ViewAsBanner />}
            header={<Header initialSession={session} features={features} isProvider={isProvider} />}
            footer={<Footer />}
          >
            {children}
          </LayoutChrome>
        </Providers>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
