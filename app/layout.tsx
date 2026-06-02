import type { Metadata, Viewport } from 'next'
import { Analytics } from "@vercel/analytics/next"
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'
import { getEffectiveFeatures } from '@/lib/features'
import { Providers } from './providers'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
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
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body suppressHydrationWarning>
        <Providers session={session}>
          <div className="min-h-screen flex flex-col">
            <Header initialSession={session} features={features} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
